# Mapúa Enrollment Intelligence Dashboard

A modern, searchable enrollment catalog built from the official Mapúa Blackboard course catalog.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Blackboard     │────▶│  Python/Backend  │────▶│  React/Frontend │
│  Catalog        │     │  FastAPI + SQLite│     │  Vite + Tailwind│
│  (Source)       │     │  (Sync Engine)   │     │  (Dashboard)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Features

- **Real catalog data** — Extracted from `https://mapua.blackboard.com/webapps/blackboard/execute/viewCatalog?type=Course&termId=_758_1`
- **Professor search** — Search and filter by instructor name
- **Subject catalog** — Browse by subject code/name with section counts
- **Sync engine** — Manual/auto refresh with change detection, error handling, and snapshot versioning
- **Data freshness indicators** — Shows last sync, stale detection, and extraction errors
- **Clean academic UI** — Mapúa-inspired red/black/white theme

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm 9+

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env if needed (ADMIN_API_KEY for refresh endpoint)
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/sync/status` | Sync status & freshness |
| POST | `/api/sync/refresh` | Trigger catalog refresh (requires `X-Admin-Key`) |
| GET | `/api/catalog` | Paginated course list with filters |
| GET | `/api/professors` | Aggregated professor directory |
| GET | `/api/subjects` | Aggregated subject catalog |
| GET | `/api/sections` | Section info (placeholder) |

### Query Parameters

**Catalog**: `term_id`, `snapshot_id`, `search`, `professor`, `subject_code`, `limit`, `offset`

**Professors/Subjects**: `term_id`, `snapshot_id`

## Data Model

```python
CourseRecord:
  source_id: str          # Blackboard course_id or identifier
  course_code: str        # Course ID from catalog
  course_name: str        # Course name
  instructors: list[str]  # Professor names (from source)
  description: str?       # Often empty in catalog view
  term_id: str            # e.g., "_758_1" (1Q2627)
  retrieved_at: datetime
  snapshot_id: str?       # Sync snapshot identifier
  sections: list[]        # Not available from catalog view
  schedule: str?          # Not available from catalog view
  campus: str?            # Not available from catalog view
```

## Sync Process

1. **Guest login** → establishes session cookies
2. **Search with `NotBlank`** → returns all courses for term
3. **Paginate** → 1,000 records per request (max Blackboard allows)
4. **Parse HTML table** → extract course code, name, instructors, description
5. **Validate** → refuse to commit if <10% of expected records returned
6. **Upsert** → new/updated/unchanged counts tracked
7. **Snapshot** → versioned record with timestamp and error log
8. **Preserve last valid** → failed sync never replaces good data

## Configuration

Key environment variables (`.env`):

```env
BB_CATALOG_URL=https://mapua.blackboard.com/webapps/blackboard/execute/viewCatalog
BB_TERM_ID=_758_1
SYNC_INTERVAL_MINUTES=60
DATABASE_URL=sqlite:///./catalog.db
ADMIN_API_KEY=your-secure-key
```

## Data Limitations

The **public catalog view only exposes**:
- Course ID / Code
- Course Name  
- Instructor(s) — comma-separated, parsed as array
- Description (usually empty)

**Not available without authenticated access**:
- Section codes/schedules/rooms
- Campus/location
- Seat availability / enrollment status
- Real-time enrollment data

## Development

### Run tests
```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm test
```

### Project Structure
```
backend/
  app/
    adapters/      # Blackboard extraction
    api/           # FastAPI routes
    models/        # Domain + DB models
    services/      # Sync + Repository
    db/            # Session management
  tests/           # Pytest fixtures + tests
frontend/
  src/
    components/    # Reusable UI (Table, Pagination, SearchBar...)
    pages/         # Route pages (Overview, Professors, Subjects...)
    hooks/         # React Query hooks
    types/         # TypeScript interfaces
    lib/           # API client
```

## Security

- No credentials stored — uses guest session cookies only
- Admin refresh endpoint protected by `X-Admin-Key` header
- CORS restricted to localhost:5173 in dev
- No secrets in logs or responses
- `.env` in `.gitignore`

## Deployment Notes

For production:
1. Switch to PostgreSQL: `DATABASE_URL=postgresql://...`
2. Set strong `ADMIN_API_KEY`
3. Configure reverse proxy (nginx) with TLS
4. Run sync as scheduled job (cron/systemd) or background worker
5. Consider institutional API access for section-level data

## License

Internal tool for Mapúa enrollment operations. Not for public redistribution of catalog data without authorization.