# Style & Trim Backend

FastAPI + PostgreSQL backend for the Style & Trim booking system.

## Run locally

1. Create a `.env` file from `.env.example`.
2. Point `DATABASE_URL` at PostgreSQL.
3. Start the app:

```bash
cd backend
python -m uvicorn app.main:create_app --factory --reload
```

## Test

```bash
cd backend
pytest
```

