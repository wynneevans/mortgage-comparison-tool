# Remortgage Helper

Compare mortgage offers side by side — e.g. a 2-year fixed vs a 5-year fixed.

Live at: **[remortgage-helper.com](https://remortgage-helper.com)**

## Stack

- **Frontend**: React 19, TypeScript, Vite, Recharts
- **Backend**: FastAPI (Python 3.13), deployed as Firebase Cloud Functions (Gen 2)
- **Hosting**: Firebase Hosting + Cloud Run
- **Security**: Firebase App Check + reCAPTCHA Enterprise

## Local Development

### Backend

```bash
cd backend
uv sync
uv run uvicorn mortgage_api.main:app --reload  # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:8000`.

### Environment files

Copy the examples and fill in your Firebase credentials:

```bash
cp frontend/.env.example frontend/.env.development
cp backend/.env.example backend/.env
```

## Deployment

Build the frontend, then deploy both frontend and backend together:

```bash
cd frontend && npm run build && cd ..
firebase deploy
```

## Testing & Linting

```bash
# Backend
cd backend
uv run pytest
uv run ruff check .

# Frontend
cd frontend
npm run lint
```
