# Law Suite

**Evidence before delivery.** A legal work product review prototype for consequential US matters.

Law Suite connects evidence records, unresolved exceptions, accountable decisions, and handoff requirements. It helps a team inspect what supports a draft and what still needs attention before supervising counsel relies on it.

This is an independent prototype. All Matter Review excerpts, names, and amounts are fictional. It does not provide verified research, enforced ethical walls, authenticated reviewer identity, or readiness for filing. No superiority over another legal AI product has been established.

[Published site](https://ggeorge73.github.io/Law-Suite/) — follows the verified main deployment; branch changes remain previews until merged.

## Product surfaces

| Surface | Implemented | Boundary |
|---|---|---|
| Matter Review | Three US scenarios; search/filter; excerpt inspection; reviewer notes; reopen decisions; policy checks; recalculated handoff; JSON packet; value assumptions | Synthetic in-memory data. Persists across section navigation; refresh resets it. No automatic analysis or new-source intake |
| Firm Operations | Sample charts, identity filters, sample access review, recommendation state, filtered CSV export | No live identity provider, telemetry, permissions changes, or persistence |
| Research & Documents | Optional local FastAPI prototype for matter metadata, bounded storage, unverified model drafts | Data API disabled by default; no authentication/tenancy, extraction, retrieval, citator, or immutable audit |

A source being available is different from a lawyer recording review. Missing, conflicting, or superseded evidence cannot be marked reviewed. Complete the Meridian sample to see supervising-lawyer readiness, then reopen a decision to revoke it. No action files or sends work product.

## Assessment and roadmap

- [Codebase, website, and competitive review](docs/LAW_SUITE_REVIEW.md): findings, original positioning, US firm priorities, architecture, and evaluation plan.
- [Security and governance](docs/SECURITY_AND_GOVERNANCE.md): boundaries and production requirements.
- [Product case study](docs/PRODUCT_CASE_STUDY.md): review logic and discovery hypotheses.
- [Demo script](docs/DEMO_SCRIPT.md): walkthrough.
- [AI-assisted development](docs/AI_ASSISTED_DEVELOPMENT.md): development history and contribution boundaries.

## Run the preview

From frontend, run npm ci --legacy-peer-deps, then npm start. Open http://localhost:3000. Leave REACT_APP_BACKEND_URL unset to reproduce the public preview and disconnected-research screen. Matter Review and Firm Operations need no database or AI credentials.

## Optional local backend

Create/activate a Python virtual environment and install backend/requirements-ci.txt. Copy backend/.env.example to backend/.env, configure local MongoDB, and explicitly set LAW_SUITE_ALLOW_LOCAL_DEMO=true for isolated synthetic-data development. Run uvicorn backend.server:app --host 127.0.0.1 --port 8001 from the repository root. Set REACT_APP_BACKEND_URL=http://127.0.0.1:8001 in the frontend local environment and restart it.

The opt-in is not authentication. Never expose this API through a public reverse proxy. Keep LAW_SUITE_AI_MODE=offline for tests. Live drafts require a managed Gemini credential and explicit live mode; they remain unverified. Model conversations are request-scoped until authenticated history exists.

Uploads are limited to 10 MiB, hashed from bytes, and marked stored rather than indexed. Public and external-storage registration are rejected. Firebase helper code is dormant pending an authorized storage service.

## Verification commands

- python -m unittest discover -s tests -p "test_*.py"
- python -m py_compile backend/server.py backend/research_safety.py backend_test.py
- In frontend: npm run build
- In frontend: npx playwright install chromium, then npm run test:e2e

Boundary tests use fake persistence. The separate backend_test.py harness exercises a disposable MongoDB API in CI. RUN_LIVE_AI_TESTS=true adds a provider contract smoke test, not legal-accuracy evaluation. Build, browser tests, and backend integration must pass before Pages deployment on main.

## Production next step

Implement authenticated matter-scoped persistence and versioned source ingestion before real documents. Then validate primary-law retrieval, issue resolution, and server-enforced decisions with supervising lawyers. See the assessment for sequencing and proposed success criteria; they are not delivered capabilities or measured results.
