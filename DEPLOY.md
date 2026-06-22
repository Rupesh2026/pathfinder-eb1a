# Deploying to Render

The whole stack deploys from one Blueprint: [`render.yaml`](./render.yaml). It
provisions four services:

| Service | Type | Root | What it runs |
|---------|------|------|--------------|
| `eb1a-agent-server` | web (Python) | `agents/` | FastAPI + Google ADK agent API |
| `eb1a-frontend` | web (Node) | `frontend/` | Next.js 14 app (dashboard + evaluator) |
| `eb1a-daily-trigger` | cron (Python) | `agents/` | POSTs `/run-daily-agents` at 07:00 UTC |
| `eb1a-weekly-trigger` | cron (Python) | `agents/` | POSTs `/run-weekly-reflection` Sun 00:00 UTC |

`CRON_API_KEY` is generated once on the agent server and auto-shared with the
crons and frontend via `fromService`, so those three always match.

> Prefer Vercel for the frontend? Just delete the `eb1a-frontend` service block
> from `render.yaml` before deploying — the agent server and crons are independent.

## 1. Prerequisites

- A Supabase project with the migrations in `supabase/migrations/` applied.
- API keys: **OpenAI** (or Gemini), **Tavily**, **Resend**.
- This repo pushed to GitHub/GitLab.

## 2. Create the Blueprint

1. Render Dashboard → **New** → **Blueprint**.
2. Connect this repository. Render reads `render.yaml` and lists the four services.
3. Render prompts for every `sync: false` value — fill them in (see checklist below),
   or leave them blank and add them per-service afterward under **Environment**.
4. **Apply** to build and deploy.

## 3. Secrets to set (`sync: false`)

**`eb1a-agent-server`**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (default provider; or set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY`)
- `TAVILY_API_KEY`
- `GOOGLE_CLOUD_PROJECT` — only for Vertex AI (optional)

**`eb1a-frontend`**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, and/or `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `AGENT_SERVER_URL` and `RENDER_SERVICE_URL` — **fill in step 4**

**Both crons**
- `SERVICE_URL` — **fill in step 4**

## 4. Wire the agent server URL (after first deploy)

Render does not know the agent server's URL until it exists. Once
`eb1a-agent-server` is live, copy its URL (e.g.
`https://eb1a-agent-server.onrender.com`, **no trailing slash**) and set:

- `eb1a-frontend` → `AGENT_SERVER_URL` **and** `RENDER_SERVICE_URL`
- `eb1a-daily-trigger` → `SERVICE_URL`
- `eb1a-weekly-trigger` → `SERVICE_URL`

Saving an env var triggers a redeploy of that service.

## 5. Verify

- `GET https://eb1a-agent-server.onrender.com/` → `{"status":"ok", ...}`
- Open the frontend URL, sign up, and click **Run scan** on the dashboard — it
  should POST to the agent server and update scan status.
- Trigger the daily cron manually from the Render dashboard to confirm the
  pipeline runs end-to-end.

## Notes

- Python is pinned to **3.11.9**, Node to **20.11.1** (via `render.yaml` env vars).
- On the free/starter plan the web services sleep when idle; the daily cron wakes
  the agent server when it fires.
- The agent service runs the daily pipeline as a background task and responds
  immediately, so dashboard scans don't hit request timeouts.
