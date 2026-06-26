# Provider Network Management EHR Simulator

A visually convincing Provider Management / EHR simulation built for the
Blues Connect UiPath demo (2026-07-16). It is **not** a full EHR — it models
provider records, network participation assignments, and an audit trail so a
UiPath agent (via REST API) and UiPath RPA (via browser automation) can both
demonstrate updating a "system of record" in front of a live audience.

Visual style: Salesforce Health Cloud — white, card-based, with Genzeon ×
UiPath branding accents.

## Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (`backend/`)
- **Frontend:** React + Vite + Tailwind CSS (`frontend/`)

## Quick Start (local)

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate   # or .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

API docs (Swagger UI): http://localhost:8000/docs

**Frontend** (in a second terminal):

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run dev
```

App: http://localhost:5173

## Resetting demo state

The most important tool for a live demo — restores the database to the exact
pre-demo seed state (all participations + audit log) without restarting
anything:

```bash
curl -X POST http://localhost:8000/api/v1/demo/reset
```

Other demo-control endpoints:
- `POST /api/v1/demo/reset/{provider_id}` — reset a single provider
- `GET /api/v1/demo/status` — current status of Scenarios A/B/C/D
- `POST /api/v1/demo/scenario/{A|B|C|D}/setup` — pre-configure one scenario's before-state

These are also wired into the app's sidebar ("Reset Demo") and Dashboard
("Reset All").

## How UiPath connects

**Via REST API** (Agent Builder / Integration Service): base URL
`http://<backend-host>/api/v1`, no auth required for this demo. Full endpoint
list and schemas are in Swagger UI at `/docs`.

**Via RPA** (browser automation): every interactive element has a stable
`data-testid`. Key selectors:

```
provider-search-input            group-filter-select
provider-row-{provider_id}       provider-name-{provider_id}
provider-npi-{provider_id}       provider-view-{provider_id}
add-participation-btn            network-select
agreement-input                  effective-date-input
submit-participation-btn         edit-participation-{participation_id}
terminate-participation-{participation_id}
participation-status-{participation_id}
participation-network-{participation_id}
audit-row-{transaction_id}       demo-reset-btn
```

Typical RPA flow: search by NPI on Providers → click that row's `View` →
on Provider Detail, click `Add Participation` (or the row's ✏️ to edit, or
`Terminate`) → fill the form → submit. Every field the bot fills is a real
input bound to the same API calls a human analyst's clicks trigger; the bot
just sets Source = RPA instead of Manual.

## Deployment

`backend/railway.json` and both services' `Dockerfile`s are included for a
Railway (backend) + Vercel/Railway (frontend) deploy. Not yet deployed as
part of this build pass — verify locally first, then:

1. Backend: deploy `backend/` to Railway with a persistent volume mounted at
   `/app/data` (SQLite must survive redeploys).
2. Frontend: build with `VITE_API_BASE_URL` set to the deployed backend's
   `/api/v1` URL (it's baked in at build time, not read at runtime), then
   deploy the static `dist/` output or the provided Nginx Dockerfile.
