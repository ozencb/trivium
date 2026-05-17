---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Zero-Downtime Migrations

Zero-downtime migrations are the discipline of making schema changes in multiple backward-compatible steps so that old and new application code can coexist during each step. The problem they solve is simple: a schema change and a code deploy are two separate events, and naive migrations assume they happen simultaneously—they don't.

### The Core Mechanism: Expand-Contract

The pattern has three phases:

1. **Expand** — add new structure without removing old. Both old and new code remain valid.
2. **Migrate** — backfill data into the new structure, usually in batches to avoid lock contention.
3. **Contract** — remove the old structure once no running code references it.

This maps directly to multiple deploys. Each deploy must leave the system in a consistent state.

### Concrete Example: Renaming a Column

You want to rename `user_name` to `username`. The naive approach—`ALTER TABLE users RENAME COLUMN user_name TO username`—breaks any running pods still referencing the old name. The expand-contract approach instead:

1. **Expand**: Add `username` (nullable). Deploy code that writes to *both* columns, reads from `user_name`.
2. **Migrate**: `UPDATE users SET username = user_name WHERE username IS NULL` — run in batches.
3. **Transition**: Deploy code that reads from `username`, writes to both (still backward-compatible with any old pods).
4. **Contract**: Deploy code that only uses `username`. Then drop `user_name`.

What looked like one operation is four steps across three deploys. This is why senior engineers pause when someone casually says "let's just rename that column."

### Why It Matters in Practice

**Backend**: Your migration tooling doesn't enforce this—you do. Libraries like Rails' `strong_migrations` or Flyway's compatibility checks help, but the expand-contract discipline is a judgment call at design time. Get it wrong and you're either taking a maintenance window or causing a production incident.

**SRE**: This pattern is how you honor error-budget commitments during schema changes. Without it, every non-trivial migration is either a calculated risk or a maintenance window. With it, you can migrate a billion-row table with zero downtime by spreading the backfill over hours while the system runs normally.

**DevOps**: Pipelines need to treat migration deploys and code deploys as distinct, gated stages. The migration runs first, validation happens (did the backfill complete? are there no `NOT NULL` violations?), and only then does the code deploy proceed. Collapsing these into one step is the footgun.

### The Interview Signal

Most engineers treat migrations as atomic. The differentiating move is recognizing that any schema change spanning a deploy window needs to be backward-compatible in both directions—old code against new schema, and new code against old schema—until the transition is complete. When you hear "we need to add a foreign key constraint," the senior response is asking what the intermediate state looks like when half the fleet is on the old code.
