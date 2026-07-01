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

Note: `agreement-input` is a `<select>`, not a free-text field — it only
lists agreements valid for the chosen network and the provider's group(s)
(see Crosswalk below), so the bot picks an option rather than typing a
value.

## Network ↔ Agreement Crosswalk

The Crosswalk tab (`/crosswalk`, `GET /api/v1/crosswalk`) shows which
Agreement ID applies to which Network for each Group — the same mapping the
Add/Edit Participation form's Agreement dropdown is filtered by. The backend
rejects (`422`) any `agreement_id` that doesn't belong to both the requested
`network_code` and one of the provider's active group affiliations, so a
participation's agreement can never drift from what this tab shows. A
dual-affiliated provider (e.g. Dr. Maria Lopez, P002) will show agreement
options from both her groups for the same network — that ambiguity is
intentional, it's what Scenario B's exception is about.

## Deployment (Render)

Both services are deployed on Render (free tier):

| Service | URL | Type |
|---|---|---|
| Frontend | https://provider-mgmt-app.onrender.com | Static Site |
| Backend API | https://provider-mgmt-backend.onrender.com/api/v1 | Docker Web Service |
| Swagger docs | https://provider-mgmt-backend.onrender.com/docs | — |

**Free tier note:** the backend spins down after ~15 minutes of inactivity. The first request after idle may take 30–60 seconds to wake up. Data resets to the seeded baseline on each cold start (no persistent disk on free tier) — useful for repeatable demo runs.

**To redeploy:** push to `main` on GitHub. Render auto-deploys both services on every push.

**Environment variables required on the backend Render service:**
- `OPENAI_API_KEY` — required for the AI conversation agent (set via Render Dashboard → provider-mgmt-backend → Environment)

**To deploy from scratch:**
1. Push the repo to GitHub.
2. On Render: New → Web Service → connect repo → Root Directory: `backend` → Runtime: Docker → free plan → deploy. Note the assigned URL.
3. On Render: New → Static Site → connect repo → Root Directory: `frontend` → Build Command: `npm install && npm run build` → Publish Directory: `dist` → add env var `VITE_API_BASE_URL=https://<your-backend>.onrender.com/api/v1` → deploy.
4. Add Redirects/Rewrites rule on the static site: Source `/*` → Destination `/index.html` → Action: Rewrite (required for React Router client-side routing).

## AI Conversation Agent

A floating "Provider Ops Assistant" chat bubble (bottom-right corner of every screen) lets analysts and demo audiences ask questions and take actions through natural language.

**Built with:** OpenAI `gpt-4o-mini` via function calling. The backend's `POST /api/v1/chat` endpoint pre-loads the full database state (providers, participations, affiliations, crosswalk, eligibility rules, demo scenario descriptions) into the system prompt on every request, then runs a tool-use loop that can execute confirmed write operations directly against the database.

**What it can do:**
- Answer questions about provider data: "Which providers are in Medicare?", "Does Dr. Lopez have dual affiliation?", "What does rule R002 require?"
- Add a provider to a network: "Add Dr. John Smith to Medicare"
- Terminate a participation: "Terminate Dr. Emily Chen's Commercial PPO"
- Update a participation's agreement or effective date

**Confirmation gate:** the agent always proposes the action and waits for explicit confirmation ("yes", "go ahead", etc.) before executing any write. It will also decline ineligible requests — e.g. "Add Dr. Emily Chen to COD" is refused because her Neurology specialty fails eligibility rule R001 (COD is PCP-only).

**Write actions** use `source=API`, so they appear with the teal "🤖 UiPath Agent" badge in the UI — the same badge that real UiPath automation produces. After any write action, all open screens (Provider Detail, Dashboard, etc.) refresh automatically.

**Toggle:** the AI Assistant can be turned on/off via the toggle switch in the sidebar's Demo Controls section without navigating away from the current screen.
