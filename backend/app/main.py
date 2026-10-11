"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db.session import init_db
from backend.app.api.routes import router as api_router
from backend.app.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting Mapúa Enrollment Intelligence Dashboard API")
    init_db()
    log.info("Database initialized")
    yield
    log.info("Shutting down")


app = FastAPI(
    title="Mapúa Enrollment Intelligence Dashboard API",
    version="0.1.0",
    description="Searchable enrollment catalog from Mapúa Blackboard course catalog",
    lifespan=lifespan,
)

# CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "Mapúa Enrollment Intelligence Dashboard API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/health",
    }