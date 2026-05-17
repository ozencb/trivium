---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Database Migrations

Schema changes in production are irreversible in one critical way: your running app and your database can briefly be on different versions simultaneously. Migrations are the discipline of managing that gap — expressing schema evolution as ordered, version-controlled scripts that can be applied (and ideally reversed) deterministically.

**The core mechanism**

A migration runner (Flyway, Liquibase, Alembic, ActiveRecord, etc.) maintains a `schema_migrations` table tracking which scripts have been applied. On deploy, it runs any unapplied migrations in sequence. The files themselves live in source control, so schema history is auditable and reproducible across environments.

The hard part isn't *applying* migrations — it's the deployment window. Rolling deploys mean v1 and v2 of your app run *concurrently* while the migration runs. This forces a constraint: migrations must be backward-compatible with the previous application version.

**Concrete mental model**

Say you want to rename `users.full_name` to `users.display_name`. The naive path (rename it, deploy app) breaks the old pods still reading `full_name`. The safe path spans three deploys:

1. Add `display_name`, backfill it, dual-write in app code
2. Migrate reads to `display_name`, keep writing both
3. Drop `full_name` once old version is gone

This "expand/contract" pattern is the standard answer in interviews when someone asks how you rename a column without downtime. Most engineers know *that* you need it; fewer can articulate *why* (the concurrent-version window) or walk through the three phases unprompted.

**Backend** — ORMs like Django or Rails auto-generate migration files from model diffs, but auto-generated doesn't mean safe. The index creation problem is classic: `CREATE INDEX` locks the table in Postgres unless you use `CREATE INDEX CONCURRENTLY`, which most ORMs don't emit by default. Knowing to override this is a common production incident waiting to happen.

**Fullstack** — If your API version and schema version are out of sync, clients hitting the old endpoint while the new column exists (but isn't backfilled yet) get NULLs or errors. You need to think about API versioning and migration timing together.

**DevOps** — Migration failures mid-deploy are among the trickiest rollback scenarios. Some teams run migrations as a separate pre-deploy step with an explicit go/no-go gate; others run them at container startup. The latter couples migration failures to pod restarts, which can cause cascading crashes. Separating them gives you cleaner rollback control.

**What separates senior engineers here**: they think about migrations as a *coordination problem between code versions*, not just SQL files. They write additive migrations by default, flag destructive ones for manual review, and treat the three-phase expand/contract as standard practice rather than an edge case.
