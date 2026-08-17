# AI Security Lab

**Break the Prompt. Understand the Risk. Build the Defense.**

An educational platform where security students attack deliberately vulnerable
AI applications to learn Prompt Injection, Indirect Prompt Injection, RAG
Injection, Multi-Turn Manipulation, and AI Agent Security — hands-on, against
a real local LLM (Ollama + Gemma 3 4B), with deterministic server-side
challenge validation and instructor progress tracking.

All secrets, documents, and tools inside the labs are synthetic fixtures.
Nothing in this repo talks to real cloud APIs, real credentials, or real
infrastructure — every "attack" is fully sandboxed.

---

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma ·
Ollama (Gemma 3 4B) · Docker Compose

## Architecture

```
                     INTERNET
                        │
                  HTTPS (Caddy)
                        │
                     AWS EC2
   ┌────────────────────────────────────────┐
   │            AI SECURITY LAB              │
   │                                          │
   │   Next.js App                            │
   │      ├── PostgreSQL   (internal only)    │
   │      └── Ollama       (internal only)    │
   │             └── Gemma 3 4B               │
   └────────────────────────────────────────┘
```

Docker Compose services: `app`, `postgres`, `ollama` (+ `caddy` in the
production overlay). Postgres and Ollama are never published to the
internet — only the app (directly, or via Caddy in production) is reachable.

---

## 1. Requirements

- Docker + Docker Compose
- ~4 GB free disk for the Gemma 3 4B model
- Node.js 20+ (only needed if you want to run the app outside Docker for
  faster local iteration)

## 2. Local development (Docker, recommended)

```bash
cp .env.example .env
# generate a real secret and paste it into SESSION_SECRET:
openssl rand -hex 32

docker compose up -d --build
docker exec -it $(docker compose ps -q ollama) ollama pull gemma3:4b

docker compose exec app npm run db:migrate
docker compose exec app npm run db:seed
```

Visit **http://localhost:3000**.

Seeded accounts (see `prisma/seed.ts`):
- Instructor: `instructor@training.local`
- Student: `student@training.local`

With `DEV_OTP_MODE=true` (the default in `.env.example`), the OTP code is
always **123456** and is also printed to the `app` container logs — no real
email delivery needed for local development.

## 3. Local development (App on host, DB/LLM in Docker)

Faster edit-reload loop than rebuilding the Docker image on every change:

```bash
cp .env.example .env
docker compose up -d postgres ollama
docker exec -it $(docker compose ps -q ollama) ollama pull gemma3:4b

# .env DATABASE_URL / LLM_BASE_URL should point at the published host ports:
#   DATABASE_URL=postgresql://labuser:labpassword@localhost:15432/ai_security_lab
#   LLM_BASE_URL=http://localhost:11434

npm install
npm run db:migrate:dev
npm run db:seed
npm run dev
```

## 4. Environment variables

See `.env.example` for the full list with descriptions. The important ones:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (pooled, if your provider offers one) |
| `DIRECT_URL` | Unpooled Postgres connection string — required by Prisma Migrate |
| `SESSION_SECRET` | Random secret backing session cookies — generate with `openssl rand -hex 32` |
| `LLM_PROVIDER` | `ollama` (self-hosted, default) or `groq` (hosted, free tier) |
| `LLM_BASE_URL` / `LLM_MODEL` | Used when `LLM_PROVIDER=ollama` — where to reach Ollama and which model |
| `GROQ_API_KEY` / `LLM_MODEL` | Used when `LLM_PROVIDER=groq` — free key at [console.groq.com](https://console.groq.com) |
| `EMAIL_PROVIDER` / `EMAIL_API_KEY` / `EMAIL_FROM` | OTP email delivery in production (`resend` + free key at [resend.com](https://resend.com)) |
| `DEV_OTP_MODE` | **Must be `false` in production.** When `true`, OTP is always `123456` and printed to logs instead of emailed |

Never commit a real `.env` file — it's already git-ignored.

## 5. Database

```bash
npm run db:migrate:dev   # create/apply a migration during development
npm run db:migrate       # apply migrations in production (non-interactive)
npm run db:seed          # seed instructor, student, and the 8 labs
npm run db:studio        # browse the DB with Prisma Studio
```

## 6. Testing

```bash
npm run test
```

Covers the deterministic challenge validators (the server-side logic that
decides whether a lab is "solved" — this must never be the LLM's call),
rate limiting, and the simulated tool-authorization logic. Auth/session and
IDOR behavior were verified via manual end-to-end request testing against a
running instance (OTP issuance/verification, session cookie scoping,
student-vs-instructor route access, cross-user data isolation).

## 7. The 8 labs

| # | Lab | Difficulty | Teaches |
|---|---|---|---|
| 1 | Direct Prompt Injection | Beginner | System prompts aren't a security boundary |
| 2 | System Instruction Disclosure | Beginner | Prompt confidentiality is not enforceable |
| 3 | Instruction vs Data | Beginner | LLMs can't structurally separate commands from content |
| 4 | Indirect Prompt Injection | Intermediate | Untrusted documents can hijack behavior without attacker/app contact |
| 5 | RAG Injection | Intermediate | Poisoned retrieval corpora affect every user |
| 6 | Multi-Turn Prompt Injection | Intermediate | Guardrails can erode across a conversation |
| 7 | Tool Calling Injection | Advanced | Excessive agency without server-side authorization |
| 8 | Chained AI Attack | Advanced | Indirect injection → context manipulation → unauthorized tool action |

Each lab is config-driven (`src/lib/labs/content/*.ts`) against one shared
lab engine (`/labs/[slug]`) — not eight separate apps. Success is always
decided by a deterministic, server-side validator (`src/lib/labs/validators.ts`),
never by asking the model whether the student succeeded.

## 8. Production deployment (single AWS EC2 instance)

No EKS/ECS/RDS/Lambda — one EC2 instance running Docker Compose.

1. Launch an EC2 instance (Ubuntu, with enough RAM/CPU for Gemma 3 4B —
   4 vCPU / 16 GB is a reasonable baseline for CPU inference; use a GPU
   instance for materially faster responses).
2. Security group:
   - `443` and `80` open to `0.0.0.0/0`
   - `22` restricted to your admin IP only
   - **Do not** open `5432` or `11434` — they stay internal to the Docker network.
3. Point a DNS record at the instance's public IP.
4. On the instance:

   ```bash
   git clone <this repo> ai-security-lab && cd ai-security-lab
   cp .env.example .env   # fill in SESSION_SECRET, EMAIL_*, set DEV_OTP_MODE=false
   echo "APP_DOMAIN=lab.example.com" >> .env

   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   docker exec -it $(docker compose ps -q ollama) ollama pull gemma3:4b
   docker compose exec app npm run db:migrate
   docker compose exec app npm run db:seed
   ```

5. Caddy automatically provisions and renews a Let's Encrypt certificate for
   `APP_DOMAIN` and terminates HTTPS; HTTP requests are redirected to HTTPS
   automatically. The app itself is not published to the host in this mode
   (`docker-compose.prod.yml` removes its port publish) — only Caddy is.

Production cookies are automatically `Secure`, `HttpOnly`, and `SameSite=Lax`
once `NODE_ENV=production` (set by the Dockerfile).

## 8b. Production deployment (free tier: Vercel + Neon + Groq)

An alternative to self-hosting: no server to manage, $0 within each
provider's free tier. The tradeoff is that model inference runs on Groq's
infrastructure instead of a model you host — see the security notes below.

1. Push this repo to GitHub.
2. **Neon** ([neon.tech](https://neon.tech)) — create a free Postgres project. Copy both
   connection strings from the dashboard: the pooled one (host ends in
   `-pooler`) for `DATABASE_URL`, and the direct one for `DIRECT_URL`.
3. **Groq** ([console.groq.com](https://console.groq.com)) — create a free API key for `GROQ_API_KEY`.
   Set `LLM_PROVIDER=groq` and pick a model you have access to for `LLM_MODEL`
   (e.g. `llama-3.3-70b-versatile`).
4. **Resend** ([resend.com](https://resend.com)) — create a free API key for `EMAIL_API_KEY`,
   set `EMAIL_PROVIDER=resend`. Without a verified domain, Resend's shared
   `onboarding@resend.dev` sender only delivers to your own account email —
   verify a domain you own (a few DNS records, still free) to send real OTP
   codes to arbitrary student emails.
5. **Vercel** ([vercel.com](https://vercel.com)) — import the GitHub repo. Add all the env
   vars above plus `SESSION_SECRET`, `APP_URL` (your `*.vercel.app` URL or
   custom domain), and `DEV_OTP_MODE=false`. Deploy.
6. Run migrations and seed against Neon once, from your machine:

   ```bash
   DATABASE_URL="<neon pooled url>" DIRECT_URL="<neon direct url>" npm run db:migrate
   DATABASE_URL="<neon pooled url>" npm run db:seed
   ```

Vercel sets `NODE_ENV=production` automatically, so secure cookies and the
`DEV_OTP_MODE` lockout both apply the same as the Docker deployment.

## 9. Security notes

- The platform itself (auth, sessions, authorization, rate limiting) is
  built to be genuinely secure — only the *labs* are intentionally vulnerable,
  and only within their own simulated sandbox (fake secrets, fake tools, fake
  data). Nothing in a lab has real filesystem, network, cloud, or database access.
- Every authorization decision (student vs. instructor, "is this your own
  attempt") is enforced server-side against the session's DB-backed record —
  never from client-supplied role/user IDs.
- OTP codes are hashed (bcrypt) at rest, rate-limited per email and per IP,
  capped at 5 verification attempts, expire after 10 minutes, and are never
  returned in an API response or logged in production.
- With `LLM_PROVIDER=groq`, lab conversation content is sent to Groq's API
  rather than staying on infrastructure you control — expected and fine for
  a fast, zero-cost deployment, but worth knowing if "nothing leaves our
  servers" matters for how you're presenting this. `LLM_PROVIDER=ollama`
  keeps everything self-hosted.
