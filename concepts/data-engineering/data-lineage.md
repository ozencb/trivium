---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Data Lineage

Data lineage is the ability to answer "where did this value come from, and what touched it on the way?" It's the audit trail that connects a number in a dashboard back through every transformation, join, and pipeline hop to its source record.

### The core mechanism

At its simplest, lineage is metadata collection at every step where data moves or changes shape. This happens at two levels:

**Column-level lineage** tracks that `revenue_usd` in your reporting table was derived from `orders.amount_cents / 100.0` joined with `fx_rates.rate`—not just that it came from the `orders` table generally. This granularity is what makes lineage actionable rather than decorative.

**Runtime lineage** means capturing the *actual* execution context: which pipeline run, at what timestamp, from which source snapshot. Static schema-level lineage tells you the recipe; runtime lineage tells you which specific batch of ingredients was used.

Most modern implementations attach lineage as metadata at write time—either as sidecar records (a separate `lineage_events` table), embedded in data catalog tooling (OpenLineage, Marquez, DataHub), or both.

### Concrete mental model

Imagine your Data Contract says the `churn_score` field in your ML feature store is sourced from `user_events`. A downstream analyst flags that churn scores jumped 30% on Tuesday. Without lineage, you're grepping logs. With lineage, you query: *what pipeline wrote to `churn_score` on Tuesday, and what tables did it read?* You find it consumed a `user_events` snapshot that included a CDC replication gap—you know the root cause in minutes, not days.

### Practical scenarios

**Backend:** When you're building a service that writes to a data warehouse (via CDC or direct write), you're implicitly a lineage producer. Tagging your writes with job ID, source system version, and schema version is low-cost and saves enormous debugging time downstream. Senior engineers instrument this proactively rather than retroactively.

**Data:** Pipeline breakage often has ambiguous blast radius—you don't know which dashboards or models depend on a broken table. Lineage flips this: given a broken upstream, you can enumerate every downstream consumer and prioritize incident response. This is also where regulatory work (GDPR right-to-erasure, SOC 2 data audits) becomes tractable—lineage lets you prove where a user's PII traveled.

### Where engineers get it wrong

The most common pitfall is tracking lineage at table granularity only. Table-level lineage tells you `model_features` depends on `events`—column-level tells you *which* feature depends on *which* event field. The difference matters enormously when a schema change breaks something subtle.

The other failure mode is treating lineage as a compliance checkbox rather than an operational tool. Teams that build it into their pipeline contracts and data contracts from day one get incident response that scales; teams that bolt it on later get an incomplete graph that no one trusts.
