"""FastAPI route definitions."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.db.session import get_db
from backend.app.services.repository import CatalogRepository
from backend.app.services.sync import SyncService
from backend.app.models.domain import SyncStatus, CourseRecord
from backend.app.config import settings


router = APIRouter()


def get_repo(db: Session = Depends(get_db)) -> CatalogRepository:
    return CatalogRepository(db)


def get_sync_service(db: Session = Depends(get_db)) -> SyncService:
    return SyncService(db)


def verify_admin_key(x_admin_key: str = Header(None)) -> None:
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin key")


# --- Health ---
@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# --- Sync ---
class RefreshResponse(BaseModel):
    snapshot_id: str
    status: str
    total_records: int
    new_records: int
    updated_records: int
    unchanged_records: int
    errors: list[str]


@router.post("/sync/refresh", response_model=RefreshResponse, dependencies=[Depends(verify_admin_key)])
async def refresh_catalog(
    term_id: Optional[str] = Query(None),
    sync_service: SyncService = Depends(get_sync_service),
):
    """Trigger manual catalog refresh (admin only)."""
    if sync_service.is_running:
        raise HTTPException(status_code=409, detail="Sync already in progress")

    snapshot = await sync_service.run_sync(term_id)
    return RefreshResponse(
        snapshot_id=snapshot.snapshot_id,
        status=snapshot.status,
        total_records=snapshot.total_records,
        new_records=snapshot.new_records,
        updated_records=snapshot.updated_records,
        unchanged_records=snapshot.unchanged_records,
        errors=snapshot.errors or [],
    )


@router.get("/sync/status", response_model=SyncStatus)
async def sync_status(
    term_id: Optional[str] = Query(None),
    sync_service: SyncService = Depends(get_sync_service),
):
    """Get current synchronization status."""
    return sync_service.get_status(term_id)


# --- Catalog ---
class CourseListResponse(BaseModel):
    items: list[CourseRecord]
    total: int
    limit: int
    offset: int


def _course_to_dict(record) -> dict:
    """Convert SQLAlchemy CourseRecordDB to dict for Pydantic validation."""
    return {
        "source_id": record.source_id,
        "course_code": record.course_code,
        "course_name": record.course_name,
        "instructors": record.instructors,
        "description": record.description,
        "term_id": record.term_id,
        "retrieved_at": record.retrieved_at,
        "snapshot_id": record.snapshot_id,
        "sections": [],
        "schedule": record.schedule,
        "campus": record.campus,
    }


@router.get("/catalog", response_model=CourseListResponse)
async def list_courses(
    term_id: Optional[str] = Query(None),
    snapshot_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    professor: Optional[str] = Query(None),
    subject_code: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    repo: CatalogRepository = Depends(get_repo),
):
    """List catalog courses with filtering and pagination."""
    term_id = term_id or settings.bb_term_id
    records, total = repo.get_courses(
        term_id=term_id,
        snapshot_id=snapshot_id,
        search=search,
        professor=professor,
        subject_code=subject_code,
        limit=limit,
        offset=offset,
    )
    return CourseListResponse(
        items=[CourseRecord.model_validate(_course_to_dict(r)) for r in records],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/catalog/{course_id}", response_model=CourseRecord)
async def get_course(
    course_id: int,
    term_id: Optional[str] = Query(None),
    snapshot_id: Optional[str] = Query(None),
    repo: CatalogRepository = Depends(get_repo),
):
    """Get a single course by database ID."""
    term_id = term_id or settings.bb_term_id
    record = repo.get_course_by_id(course_id, snapshot_id)
    if not record:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseRecord.model_validate(_course_to_dict(record))


# --- Professors ---
class ProfessorResponse(BaseModel):
    name: str
    course_count: int
    courses: list[str]


@router.get("/professors", response_model=list[ProfessorResponse])
async def list_professors(
    term_id: Optional[str] = Query(None),
    snapshot_id: Optional[str] = Query(None),
    repo: CatalogRepository = Depends(get_repo),
):
    """Get aggregated professor directory."""
    term_id = term_id or settings.bb_term_id
    return repo.get_professors(term_id, snapshot_id)


# --- Subjects ---
class SubjectResponse(BaseModel):
    code: str
    name: str
    section_count: int
    instructors: list[str]


@router.get("/subjects", response_model=list[SubjectResponse])
async def list_subjects(
    term_id: Optional[str] = Query(None),
    snapshot_id: Optional[str] = Query(None),
    repo: CatalogRepository = Depends(get_repo),
):
    """Get aggregated subject catalog."""
    term_id = term_id or settings.bb_term_id
    return repo.get_subjects(term_id, snapshot_id)


# --- Sections (placeholder - requires deeper extraction) ---
@router.get("/sections")
async def list_sections():
    """Section-level data requires drilling into individual courses.

    Current Blackboard catalog view only exposes course-level data.
    Section schedules/rooms require authenticated course access.
    """
    return {
        "message": "Section data not available from public catalog view",
        "note": "Requires authenticated course access or institutional API",
    }