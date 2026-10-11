"""SQLAlchemy database models."""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, DateTime, Text, ForeignKey, Index, UniqueConstraint, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Term(Base):
    __tablename__ = "terms"

    id = Column(String(64), primary_key=True)
    name = Column(String(255))
    is_active = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SyncSnapshotRecord(Base):
    __tablename__ = "sync_snapshots"

    snapshot_id = Column(String(64), primary_key=True)
    term_id = Column(String(64), ForeignKey("terms.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_records = Column(Integer, default=0)
    new_records = Column(Integer, default=0)
    updated_records = Column(Integer, default=0)
    unchanged_records = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    errors = Column(JSON, nullable=True)
    status = Column(String(32), default="running")

    term = relationship("Term")


class CourseRecordDB(Base):
    __tablename__ = "course_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String(128), nullable=False, index=True)
    course_code = Column(String(128), nullable=False, index=True)
    course_name = Column(String(512), nullable=False)
    instructors = Column(JSON, nullable=False)  # list of strings
    description = Column(Text, nullable=True)
    term_id = Column(String(64), ForeignKey("terms.id"), nullable=False, index=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow)
    snapshot_id = Column(String(64), ForeignKey("sync_snapshots.snapshot_id"), nullable=False, index=True)

    # Optional enrichment
    schedule = Column(String(512), nullable=True)
    campus = Column(String(256), nullable=True)

    __table_args__ = (
        UniqueConstraint("source_id", "snapshot_id", name="uq_course_snapshot"),
        Index("ix_course_term_snapshot", "term_id", "snapshot_id"),
    )

    term = relationship("Term")
    snapshot = relationship("SyncSnapshotRecord")


class CourseSectionDB(Base):
    __tablename__ = "course_sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_record_id = Column(Integer, ForeignKey("course_records.id"), nullable=False, index=True)
    section_id = Column(String(128), nullable=False)
    section_name = Column(String(256), nullable=True)
    instructor = Column(String(256), nullable=True)
    schedule = Column(String(512), nullable=True)
    location = Column(String(256), nullable=True)
    seats_total = Column(Integer, nullable=True)
    seats_available = Column(Integer, nullable=True)

    course_record = relationship("CourseRecordDB")


class SyncState(Base):
    """Key-value store for sync metadata."""
    __tablename__ = "sync_state"

    key = Column(String(128), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)