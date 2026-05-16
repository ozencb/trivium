---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Zero-Downtime Migrations

Schema changes that don't require taking your database or application offline — achieved by carefully sequencing what gets deployed and when, so old and new code can coexist against the same database during the transition.

### The Core Problem

The naive approach to schema changes is: stop traffic, run migration, deploy new code, resume. That works in a maintenance window but fails when you need continuous availability. The real challenge is that you have two code versions running simultaneously during a deployment rollout — old pods are still serving requests while new ones spin up. If your migration removes a column that old code still reads, or renames a table the old queries reference, you get errors mid-rollout.

The solution is **expand-contract** (also called **parallel change**): break every schema change into phases where each phase is backward-compatible with the code versions running alongside it.

### Expand-Contract in Practice

Take renaming a column `user_name` → `username`:

1. **Expand**: Add the new `username` column. Write to both columns in application code. Old code still reads `user_name`, new code reads `username`. Both work.
2. **Migrate**: Backfill `username` from `user_name` for existing rows. Do this in batches to avoid locking.
3. **Contract**: Once all old code is gone (old pods fully drained), drop `user_name`.

What looks like one migration is actually three separate deployments spanning days or weeks. That's the discipline — resist collapsing them back into one.

### What This Looks Like Per Role

**Backend**: You write dual-write logic during transitions and add feature flags or versioned endpoints to manage which code path runs. You also need to think about index creation — `CREATE INDEX` takes locks; use `CREATE INDEX CONCURRENTLY` in Postgres.

**SRE**: You define the rollout policy so old replicas fully drain before you remove backward-compatibility code. You monitor for query errors that signal a phase was skipped. You treat failed rollbacks the same as failed deployments — the database state must be compatible either way.

**DevOps/Platform**: CI/CD pipelines need to know which migrations are safe to run before or after code deploys, and enforce the ordering. Some teams use migration "gates" — a migration can't be marked contract-phase until the expand-phase has been in production for N days.

### The Mental Model

Think of it like widening a road while traffic flows. You build the new lane first (expand), run both lanes together, verify load, then demolish the old lane (contract). You never close the road.

The failure mode is skipping phases under deadline pressure. That's where most zero-downtime incidents actually come from — the process was known, but someone collapsed it.
