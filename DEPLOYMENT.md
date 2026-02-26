# Deployment Guide

This app uses a split deployment:
- **Frontend**: Firebase Hosting (static React app)
- **Backend**: Firebase Cloud Functions (FastAPI Python service)

## Prerequisites

- Firebase CLI installed (`firebase` CLI)
- Python 3.13 (for local development)
- UV package manager (for local development)

## Backend Deployment (Cloud Functions)

### 1. Test locally with Firebase emulator (optional)

```bash
# Start the functions emulator
firebase emulators:start --only functions

# Function will be available at:
# http://localhost:5001/remortgage-helper/us-central1/api

# Test the API:
curl -X POST http://localhost:5001/remortgage-helper/us-central1/api/api/compare \
  -H "Content-Type: application/json" \
  -d '{"loan_amount": 200000, "total_term_years": 25, "long_term_rate": 5.0, "offers": [...]}'
```

### 2. Deploy to Cloud Functions

```bash
# From project root
firebase deploy --only functions
```

After deployment, you'll get a URL like:
`https://us-central1-remortgage-helper.cloudfunctions.net/api`

### 3. Update frontend environment variable

Edit `frontend/.env.production` and replace the URL:

```bash
VITE_API_URL=https://us-central1-remortgage-helper.cloudfunctions.net/api/api
```

Note: The `/api` at the end is important - your FastAPI router uses `/api/compare` endpoint.

## Frontend Deployment (Firebase)

### 1. Build the frontend

```bash
cd frontend
npm run build
```

### 2. Deploy to Firebase

```bash
cd ..  # Back to project root
firebase deploy
```

Your app will be live at: https://remortgage-helper.web.app/

## Making Updates

### Backend changes:
```bash
# From project root
firebase deploy --only functions
```

### Frontend changes:
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

### Deploy both:
```bash
cd frontend
npm run build
cd ..
firebase deploy
```

## Testing Production Build Locally

```bash
# Build frontend with production API URL
cd frontend
npm run build

# Serve locally
npx vite preview
```
