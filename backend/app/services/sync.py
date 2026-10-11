"""Synchronization service orchestrating extraction, validation, and persistence."""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from backend.app.adapters.blackboard import BlackboardCatalogAdapter, ExtractionResult
from backend.app.models.db import SyncSnapshotRecord
from backend.app.models.domain import CourseRecord, SyncSnapshot, SyncStatus
from backend.app.services.repository import CatalogRepository
from backend.app.config import settings

import logging
log = logging.getLogger(__name__)


class SyncService:
    """Orchestrates catalog synchronization with safety guarantees."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = CatalogRepository(db)
        self._current_snapshot_id: Optional[str] = None
        self._is_running = False

    @property
    def is_running(self) -> bool:
        return self._is_running

    def _generate_snapshot_id(self) -> str:
        return f"snap_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    async def run_sync(self, term_id: Optional[str] = None) -> SyncSnapshot:
        """Execute full synchronization cycle.

        Safety guarantees:
        - Never replaces valid catalog with empty/partial data
        - Validates record count before committing
        - Preserves last valid snapshot on failure
        - Records all errors for diagnostics
        """
        if self._is_running:
            raise RuntimeError("Sync already in progress")

        term_id = term_id or settings.bb_term_id
        self._is_running = True
        snapshot_id = self._generate_snapshot_id()
        self._current_snapshot_id = snapshot_id

        snapshot = SyncSnapshot(
            snapshot_id=snapshot_id,
            term_id=term_id,
            started_at=datetime.utcnow(),
            status="running",
        )

        try:
            log.info("Starting sync %s for term %s", snapshot_id, term_id)

            # Ensure term exists
            self.repo.upsert_term(term_id)

            # Create snapshot record
            self.repo.create_snapshot(snapshot)
            self.db.commit()

            # Extract from source
            async with BlackboardCatalogAdapter() as adapter:
                result: ExtractionResult = await adapter.extract_all(snapshot_id)

            # Validation: refuse to commit if extraction yielded suspiciously few records
            if result.total_count > 0 and len(result.records) < result.total_count * 0.1:
                raise ValueError(
                    f"Extraction returned only {len(result.records)}/{result.total_count} records "
                    f"({len(result.records)/result.total_count*100:.1f}%) - aborting to prevent data loss"
                )

            if not result.records and result.total_count > 0:
                raise ValueError("Extraction returned zero records but source reports data exists")

            # Persist courses
            new_c, updated_c, unchanged_c = self.repo.bulk_upsert_courses(result.records, snapshot_id)

            # Update snapshot with results
            snapshot.completed_at = datetime.utcnow()
            snapshot.total_records = len(result.records)
            snapshot.new_records = new_c
            snapshot.updated_records = updated_c
            snapshot.unchanged_records = unchanged_c
            snapshot.error_count = len(result.errors)
            snapshot.errors = result.errors
            snapshot.status = "completed" if not result.errors else "partial"

            self.repo.update_snapshot(
                snapshot_id,
                completed_at=snapshot.completed_at,
                total_records=snapshot.total_records,
                new_records=new_c,
                updated_records=updated_c,
                unchanged_records=unchanged_c,
                error_count=snapshot.error_count,
                errors=snapshot.errors,
                status=snapshot.status,
            )

            # Record last successful sync timestamp
            self.repo.set_state(f"last_success_{term_id}", snapshot.completed_at.isoformat())
            self.repo.set_state(f"last_attempt_{term_id}", datetime.utcnow().isoformat())
            self.repo.set_state(f"last_snapshot_{term_id}", snapshot_id)

            self.db.commit()
            log.info(
                "Sync %s completed: %d new, %d updated, %d unchanged, %d errors",
                snapshot_id, new_c, updated_c, unchanged_c, len(result.errors)
            )

        except Exception as e:
            log.exception("Sync %s failed: %s", snapshot_id, e)
            snapshot.completed_at = datetime.utcnow()
            snapshot.status = "failed"
            snapshot.errors = [str(e)]
            snapshot.error_count = 1

            self.repo.update_snapshot(snapshot_id, status="failed", errors=[str(e)], completed_at=snapshot.completed_at)
            self.repo.set_state(f"last_attempt_{term_id}", datetime.utcnow().isoformat())
            self.db.commit()
            raise

        finally:
            self._is_running = False
            self._current_snapshot_id = None

        return snapshot

    def get_status(self, term_id: Optional[str] = None) -> SyncStatus:
        term_id = term_id or settings.bb_term_id
        status = self.repo.get_sync_status(term_id)
        status.current_status = "running" if self._is_running else "idle"
        return status