"""Normalized domain models for catalog data."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CourseRecord(BaseModel):
    """A single course record from the Blackboard catalog."""
    source_id: str = Field(..., description="Blackboard course_id (e.g., '_41471_1') or course identifier")
    course_code: str = Field(..., description="Course ID/Code from catalog (first column)")
    course_name: str = Field(..., description="Course Name from catalog")
    instructors: list[str] = Field(default_factory=list, description="List of instructor names")
    description: Optional[str] = Field(None, description="Course description")
    term_id: str = Field(..., description="Term identifier (e.g., '_758_1')")
    retrieved_at: datetime = Field(default_factory=datetime.utcnow, description="When this record was fetched")
    snapshot_id: Optional[str] = Field(None, description="Snapshot identifier this record belongs to")

    # Optional enrichment fields (null if not available from catalog view)
    sections: list["CourseSection"] = Field(default_factory=list, description="Section details if available")
    schedule: Optional[str] = Field(None, description="Schedule string if available")
    campus: Optional[str] = Field(None, description="Campus/location if available")


class CourseSection(BaseModel):
    """Section information for a course (if available from source)."""
    section_id: str
    section_name: Optional[str] = None
    instructor: Optional[str] = None
    schedule: Optional[str] = None
    location: Optional[str] = None
    seats_total: Optional[int] = None
    seats_available: Optional[int] = None


class SyncSnapshot(BaseModel):
    """A catalog synchronization snapshot."""
    snapshot_id: str
    term_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_records: int = 0
    new_records: int = 0
    updated_records: int = 0
    unchanged_records: int = 0
    error_count: int = 0
    errors: list[str] = Field(default_factory=list)
    status: str = "running"  # running, completed, failed, partial


class SyncStatus(BaseModel):
    """Current synchronization status."""
    last_successful_sync: Optional[datetime] = None
    last_attempt: Optional[datetime] = None
    last_snapshot: Optional[SyncSnapshot] = None
    current_status: str = "idle"  # idle, running, failed
    is_stale: bool = False
    stale_threshold_minutes: int = 120


class ProfessorSummary(BaseModel):
    """Aggregated professor information."""
    name: str
    course_count: int
    courses: list[str]  # course codes


class SubjectSummary(BaseModel):
    """Aggregated subject information."""
    code: str
    name: str
    section_count: int
    instructors: list[str]