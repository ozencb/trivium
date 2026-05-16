---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Database migrations are versioned, incremental changes to a schema (or data) that can be applied and — critically — reversed in a controlled way. They exist because production databases can't be wiped and recreated; changes must be surgical and auditable.

## The Core Mechanism

A migration is a unit of work with two halves: `up` (apply the change) and `down` (reverse it). Your migration tool tracks which have run in a metadata table (`schema_migrations`, `flyway_schema_history`, etc.). On deploy, it runs all pending `up` functions in order. On rollback — which you already know about — it runs `down` in reverse order.

The important insight is that **migrations are append-only history**. You never edit a migration once it's been committed and run anywhere. If you made a mistake, you write a *new* migration to fix it. This preserves the invariant that every environment (dev, staging, prod) can reach the same state by replaying the same sequence.

## Concrete Mental Model

Think of migrations like Git commits for your schema. Each commit is immutable. `git log` shows your history; your migrations table is the same thing. You can't rewrite history without breaking everyone downstream.

```sql
-- 0042_add_user_preferences.sql (up)
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- down
ALTER TABLE users DROP COLUMN preferences;
```

## Practical Scenarios

**Backend**: You're adding a `status` column with a `NOT NULL` constraint. The naive `ALTER TABLE` will fail on a live table with rows — you need a migration sequence: add nullable, backfill, add constraint. That multi-step coordination is exactly what migrations codify.

**Fullstack**: Your frontend is deploying slightly ahead of or behind your backend. The migration has to be compatible with *both* the old and new app version during the transition window. This is why destructive changes (dropping columns, renaming) require multi-phase migrations across deploys, not a single ALTER.

**DevOps**: In a CI/CD pipeline, migrations run as part of the deploy job — often before traffic shifts to new pods. The pipeline needs to handle the case where the migration succeeds but the app deploy fails (the DB is already migrated, so rollback means running `down`, which you've already thought through). This is also why migration tooling integrates with deployment orchestrators: Kubernetes init containers, Helm hooks, Flyway/Liquibase in your pipeline YAML.

## The Connection to What's Next

Once you accept that migrations run *while traffic is live*, you hit the real constraint: large or locking operations (full-table rewrites, index builds without `CONCURRENTLY`, column type changes) cause downtime. That's the problem zero-downtime migrations solve — it's the same mechanism, but with additional constraints on *how* each migration must be structured.
