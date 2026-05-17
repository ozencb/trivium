# Trivium

Study-session app that surfaces high-impact software engineering concepts you don't know yet, prioritized by a prerequisite graph.

> Built almost entirely through vibe coding to test the capabilities of latest models.

![Demo](docs/recordings/demo.gif)

## How It Works

1. Concepts defined as YAML (metadata) + Markdown (explanation) file pairs
2. Scoring prioritizes concepts by how many things they unlock and prerequisite readiness
3. Study one concept at a time: mark as "known", "vaguely familiar", or "don't know"
4. Unknown concepts show an AI-generated explanation
5. Progress tracked in local SQLite

## Quick Start

```bash
pnpm install
pnpm dev
# http://localhost:3000
```

Generate explanations (requires Claude Code CLI):

```bash
pnpm generate
```

## Tech Stack

- Next.js (App Router) + TypeScript
- SQLite (better-sqlite3)
- shadcn/ui + Tailwind CSS
- Claude Code CLI (generation)
- Vitest (testing)

## Project Structure

```
/concepts/<category>/   — YAML metadata + MD explanations (42 concepts, 15 categories)
/scripts/               — Generation and import CLIs
/src/app/               — Next.js pages and API routes
/src/lib/               — Core logic (db, scoring, concept loader, constants)
/src/components/        — UI components
/data/                  — SQLite database (gitignored, created at runtime)
```

## Concept Format

Each concept has a `.yaml` metadata file and a `.md` explanation file:

```yaml
# concepts/networking/tcp-congestion-control.yaml
id: tcp-congestion-control
title: TCP Congestion Control
category: [Networking, TCP/IP]
roles: [backend, sre]
lenses: [foundational, practical]
prerequisites: [tcp-basics]
dependents: [http2-flow-control]
brief: "How TCP adapts sending rate to avoid overwhelming the network"
```

The `.md` file contains the generated explanation with frontmatter tracking model and prompt version.

**Roles:** backend, frontend, sre, fullstack, devops, data

**Lenses:** foundational, practical, career

**Categories:** algorithms, api-design, architecture, concurrency, databases, devops, distributed-systems, frontend, messaging, networking, observability, operating-systems, performance, security, testing

## Scoring Algorithm

```
score = (unlock_count × 3) + (depth_penalty × -1) + (prerequisite_readiness × 6)
```

- **unlock_count** — how many concepts depend on this one
- **depth_penalty** — prefer shallower concepts
- **prerequisite_readiness** — fraction of prerequisites already known

Concepts with all prerequisites met surface first. Known concepts excluded.

## Generation Pipeline

Uses Claude Code CLI (`claude -p`) — no API key needed.

```bash
pnpm generate                           # generate all missing
pnpm generate -- --category=Networking  # one category only
pnpm generate -- --regenerate           # force regenerate all
```

Idempotent — hashes the prompt template and skips concepts already generated with the current version. Edit template in `scripts/prompt-template.ts`.

Additional scripts:

```bash
pnpm generate-concepts                          # auto-detect gaps across all categories
pnpm generate-concepts -- --category="Databases" # target a specific category
pnpm generate-concepts -- --count=10            # control how many to generate (default varies)
```

- `pnpm generate-concepts` — generate concept YAML metadata via Claude API, with gap detection or targeted category mode
- `pnpm import` — import explanations from external sources

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with progress overview |
| `/session` | Study session — one concept at a time, filtered by role/lens |
| `/browse` | Browse all concepts by category |
| `/progress` | Progress breakdown by category, role, and lens |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/concepts` | List concepts with progress (filterable) |
| GET | `/api/concepts/[id]` | Single concept with explanation |
| POST | `/api/concepts/[id]/progress` | Update concept status |
| GET | `/api/session/next` | Next concept based on scoring + filters |

## Docker

```bash
docker compose up --build
```

SQLite data persists via volume mount at `./data/`.

## Adding Concepts

1. Create a `.yaml` file in `concepts/<category>/`
2. Reference existing concept IDs in `prerequisites` and `dependents`
3. Run `pnpm generate` to create the `.md` explanation
4. Concepts appear on next page load

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GENERATE_MODEL` | `claude-sonnet-4-6` | Model for explanation generation |
