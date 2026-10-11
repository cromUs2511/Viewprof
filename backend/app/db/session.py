"""Database session and initialization."""
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from backend.app.config import settings
from backend.app.models.db import Base


def _get_connect_args(database_url: str) -> dict:
    """Return appropriate connect args based on database type."""
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    # PostgreSQL and others don't need special connect args
    return {}


def _get_pool_class(database_url: str):
    """Use NullPool for serverless/serverless-friendly environments."""
    if database_url.startswith("postgresql") or database_url.startswith("postgres"):
        return NullPool
    return None


engine = create_engine(
    settings.database_url,
    connect_args=_get_connect_args(settings.database_url),
    poolclass=_get_pool_class(settings.database_url),
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()