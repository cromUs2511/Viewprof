#!/usr/bin/env bash
# Production entrypoint for Render

set -e

# Ensure Python can find the backend module
export PYTHONPATH="${PYTHONPATH:-.}"

# Run database migrations if needed (optional - tables created on startup)
# alembic upgrade head

# Start the application
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"