"""Repository layer for catalog data access."""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from backend.app.models.db import (
    CourseRecordDB, CourseSectionDB, SyncSnapshotRecord, Term, SyncState
)
from backend.app.models.domain import CourseRecord, SyncSnapshot, SyncStatus


class CatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    # --- Term ---
    def get_term(self, term_id: str) -> Optional[Term]:
        return self.db.query(Term).filter(Term.id == term_id).first()

    def upsert_term(self, term_id: str, name: str = None) -> Term:
        term = self.get_term(term_id)
        if not term:
            term = Term(id=term_id, name=name or term_id)
            self.db.add(term)
        else:
            term.name = name or term.name
        self.db.flush()
        return term

    # --- Snapshots ---
    def create_snapshot(self, snapshot: SyncSnapshot) -> SyncSnapshotRecord:
        record = SyncSnapshotRecord(
            snapshot_id=snapshot.snapshot_id,
            term_id=snapshot.term_id,
            started_at=snapshot.started_at,
            completed_at=snapshot.completed_at,
            total_records=snapshot.total_records,
            new_records=snapshot.new_records,
            updated_records=snapshot.updated_records,
            unchanged_records=snapshot.unchanged_records,
            error_count=snapshot.error_count,
            errors=snapshot.errors,
            status=snapshot.status,
        )
        self.db.add(record)
        self.db.flush()
        return record

    def update_snapshot(self, snapshot_id: str, **kwargs) -> Optional[SyncSnapshotRecord]:
        record = self.db.query(SyncSnapshotRecord).filter(SyncSnapshotRecord.snapshot_id == snapshot_id).first()
        if record:
            for k, v in kwargs.items():
                setattr(record, k, v)
            self.db.flush()
        return record

    def get_latest_snapshot(self, term_id: str) -> Optional[SyncSnapshotRecord]:
        return (
            self.db.query(SyncSnapshotRecord)
            .filter(SyncSnapshotRecord.term_id == term_id, SyncSnapshotRecord.status == "completed")
            .order_by(desc(SyncSnapshotRecord.started_at))
            .first()
        )

    def get_snapshot(self, snapshot_id: str) -> Optional[SyncSnapshotRecord]:
        return self.db.query(SyncSnapshotRecord).filter(SyncSnapshotRecord.snapshot_id == snapshot_id).first()

    # --- Course Records ---
    def bulk_upsert_courses(self, courses: list[CourseRecord], snapshot_id: str) -> tuple[int, int, int]:
        """Insert or update course records. Returns (new, updated, unchanged)."""
        new_count = updated_count = unchanged_count = 0

        for course in courses:
            existing = (
                self.db.query(CourseRecordDB)
                .filter(
                    CourseRecordDB.source_id == course.source_id,
                    CourseRecordDB.term_id == course.term_id,
                )
                .first()
            )

            instructors_json = course.instructors

            if existing:
                # Check if changed
                changed = (
                    existing.course_name != course.course_name
                    or existing.instructors != instructors_json
                    or (existing.description or "") != (course.description or "")
                )
                if changed:
                    existing.course_name = course.course_name
                    existing.instructors = instructors_json
                    existing.description = course.description
                    existing.retrieved_at = course.retrieved_at
                    existing.snapshot_id = snapshot_id
                    if course.schedule:
                        existing.schedule = course.schedule
                    if course.campus:
                        existing.campus = course.campus
                    updated_count += 1
                else:
                    # Touch snapshot_id to track membership
                    existing.snapshot_id = snapshot_id
                    unchanged_count += 1
            else:
                record = CourseRecordDB(
                    source_id=course.source_id,
                    course_code=course.course_code,
                    course_name=course.course_name,
                    instructors=instructors_json,
                    description=course.description,
                    term_id=course.term_id,
                    retrieved_at=course.retrieved_at,
                    snapshot_id=snapshot_id,
                    schedule=course.schedule,
                    campus=course.campus,
                )
                self.db.add(record)
                new_count += 1

        self.db.flush()
        return new_count, updated_count, unchanged_count

    def get_courses(
        self,
        term_id: str,
        snapshot_id: Optional[str] = None,
        search: Optional[str] = None,
        professor: Optional[str] = None,
        subject_code: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[CourseRecordDB], int]:
        query = self.db.query(CourseRecordDB).filter(CourseRecordDB.term_id == term_id)

        if snapshot_id:
            query = query.filter(CourseRecordDB.snapshot_id == snapshot_id)
        else:
            # Default to latest completed snapshot
            latest = self.get_latest_snapshot(term_id)
            if latest:
                query = query.filter(CourseRecordDB.snapshot_id == latest.snapshot_id)

        if search:
            query = query.filter(
                or_(
                    CourseRecordDB.course_name.ilike(f"%{search}%"),
                    CourseRecordDB.course_code.ilike(f"%{search}%"),
                    CourseRecordDB.description.ilike(f"%{search}%"),
                )
            )

        if professor:
            # JSON contains check - SQLite supports json_each
            query = query.filter(CourseRecordDB.instructors.like(f"%{professor}%"))

        if subject_code:
            query = query.filter(CourseRecordDB.course_code.ilike(f"%{subject_code}%"))

        total = query.count()
        records = query.order_by(CourseRecordDB.course_code).offset(offset).limit(limit).all()
        return records, total

    def get_course_by_id(self, course_id: int, snapshot_id: Optional[str] = None) -> Optional[CourseRecordDB]:
        query = self.db.query(CourseRecordDB).filter(CourseRecordDB.id == course_id)
        if snapshot_id:
            query = query.filter(CourseRecordDB.snapshot_id == snapshot_id)
        return query.first()

    def get_professors(self, term_id: str, snapshot_id: Optional[str] = None) -> list[dict]:
        """Get aggregated professor list with course counts."""
        courses, _ = self.get_courses(term_id, snapshot_id, limit=10000)
        prof_map: dict[str, set[str]] = {}
        for c in courses:
            for prof in c.instructors or []:
                prof_map.setdefault(prof, set()).add(c.course_code)

        return [
            {"name": name, "course_count": len(codes), "courses": sorted(codes)}
            for name, codes in sorted(prof_map.items())
        ]

    def get_subjects(self, term_id: str, snapshot_id: Optional[str] = None) -> list[dict]:
        """Get aggregated subject list."""
        courses, _ = self.get_courses(term_id, snapshot_id, limit=10000)
        subj_map: dict[str, dict] = {}
        for c in courses:
            key = c.course_code
            if key not in subj_map:
                subj_map[key] = {"code": c.course_code, "name": c.course_name, "instructors": set(), "section_count": 0}
            subj_map[key]["instructors"].update(c.instructors or [])
            subj_map[key]["section_count"] += 1

        return [
            {"code": v["code"], "name": v["name"], "instructors": sorted(v["instructors"]), "section_count": v["section_count"]}
            for v in sorted(subj_map.values(), key=lambda x: x["code"])
        ]

    # --- Sync State ---
    def set_state(self, key: str, value: str) -> None:
        state = self.db.query(SyncState).filter(SyncState.key == key).first()
        if state:
            state.value = value
        else:
            state = SyncState(key=key, value=value)
            self.db.add(state)
        self.db.flush()

    def get_state(self, key: str) -> Optional[str]:
        state = self.db.query(SyncState).filter(SyncState.key == key).first()
        return state.value if state else None

    def get_sync_status(self, term_id: str) -> SyncStatus:
        latest = self.get_latest_snapshot(term_id)
        last_attempt_str = self.get_state(f"last_attempt_{term_id}")
        last_attempt = datetime.fromisoformat(last_attempt_str) if last_attempt_str else None

        is_stale = False
        if latest and latest.completed_at:
            stale_threshold = 120  # minutes
            delta = datetime.utcnow() - latest.completed_at
            is_stale = delta.total_seconds() > stale_threshold * 60

        return SyncStatus(
            last_successful_sync=latest.completed_at if latest else None,
            last_attempt=last_attempt,
            last_snapshot=SyncSnapshot.model_validate(latest) if latest else None,
            current_status="idle",  # Will be overridden by service
            is_stale=is_stale,
            stale_threshold_minutes=120,
        )