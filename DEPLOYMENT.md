# CI/CD & Deployment

This repository ships a single CI/CD pipeline (`.github/workflows/ci-cd.yml`) that covers tests, builds, Docker pushes, and Render deploy hooks.

## Pipeline behavior
- `pull_request`: runs tests + coverage for frontend and backend, builds frontend assets and a backend tarball artifact, uploads all build/coverage artifacts.
- `push` to `main`: runs the same tests/builds, then builds and pushes Docker images, and finally triggers Render deploy hooks (if set).
- Artifacts: `frontend-build` (frontend/build), `backend-build` (backend/build/backend-build.tgz), and coverage for both apps.

## Required GitHub Secrets
- `DOCKER_USERNAME` – Docker Hub namespace used for image tags.
- `DOCKER_PASSWORD` – Docker Hub password or access token.
- `RENDER_DEPLOY_HOOK_BACKEND` – Render deploy hook URL for the backend service (optional; step skipped if empty).
- `RENDER_DEPLOY_HOOK_FRONTEND` – Render deploy hook URL for the frontend service (optional; step skipped if empty).
- `REACT_APP_API_URL` – Backend base URL baked into the frontend bundle during Docker build (set to your deployed backend URL to avoid localhost defaults).

## Docker images
- Backend image: `${DOCKER_USERNAME}/todo-backend` tagged with `latest` and the commit SHA.
- Frontend image: `${DOCKER_USERNAME}/todo-frontend` tagged with `latest` and the commit SHA.
- Backend port defaults to `3242` (configurable via `PORT` env var).

## Render setup (high level)
1. **Backend Web Service**
   - Create a Render Web Service from the backend Docker image (`${DOCKER_USERNAME}/todo-backend:latest`).
   - Environment: set `MONGO_URI` (or `MONGODB_URI`) to your MongoDB Atlas/Render connection string. Add `JWT_SECRET` and `REFRESH_TOKEN_SECRET`, and optionally `PORT` (defaults to 3242).
   - If you do not supply `MONGO_URI`/`MONGODB_URI`, the service will start an in-memory MongoDB (data is ephemeral and resets on restart). The backend Docker image now uses a Debian base so the fallback works on Render.
   - Under *Settings → Deploy Hooks*, generate a deploy hook URL and store it as `RENDER_DEPLOY_HOOK_BACKEND`.
2. **Frontend Web Service (Docker)**
   - Create a Render Web Service from `${DOCKER_USERNAME}/todo-frontend:latest`.
   - Set `REACT_APP_API_URL` to the public URL of the backend service so API calls point at the correct host.
   - Generate a deploy hook URL and store it as `RENDER_DEPLOY_HOOK_FRONTEND`.

Once secrets are in place, pushes to `main` will push fresh Docker images and trigger the Render deploy hooks automatically; pull requests will stop after tests/builds and artifact uploads.
