# Deployment Guide

This app uses a split deployment:
- **Frontend**: Firebase Hosting (static React app)
- **Backend**: Google Cloud Run (FastAPI Python service)

## Prerequisites

- Google Cloud SDK installed (`gcloud` CLI)
- Firebase CLI installed (`firebase` CLI)
- Docker installed (for local testing)

## Backend Deployment (Cloud Run)

### 1. Build and test locally (optional)

```bash
cd backend
docker build -t mortgage-api .
docker run -p 8080:8080 mortgage-api
# Test at http://localhost:8080/api/compare
```

### 2. Deploy to Cloud Run

```bash
cd backend

# Set your GCP project
gcloud config set project remortgage-helper

# Deploy to Cloud Run
gcloud run deploy mortgage-api \
  --source . \
  --region europe-west2 \
  --platform managed \
  --allow-unauthenticated \
  --max-instances 10 \
  --memory 512Mi
```

After deployment, you'll get a URL like:
`https://mortgage-api-HASH-ew.a.run.app`

### 3. Update frontend environment variable

Edit `frontend/.env.production` and replace the URL:

```bash
VITE_API_URL=https://mortgage-api-HASH-ew.a.run.app/api
```

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
cd backend
gcloud run deploy mortgage-api --source .
```

### Frontend changes:
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
