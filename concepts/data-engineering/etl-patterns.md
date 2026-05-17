---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## ETL and ELT Patterns

ETL (extract-transform-load) and ELT (extract-load-transform) are the two dominant topologies for moving data between systems. The choice isn't cosmetic — it determines where compute lives, who owns schema evolution, and how you handle failures.

### The Core Distinction

In **ETL**, data is transformed *before* it hits the destination. Your pipeline reads from source, applies business logic in an intermediate compute layer, and writes clean, shaped data to the target. The destination only ever sees conformant data.

In **ELT**, raw data lands in the destination first, and transformation happens *inside* the destination using its own compute — typically SQL on a columnar warehouse like BigQuery or Snowflake. The destination becomes both storage and the transformation engine.

This matters because it shifts the cost model. ETL externalizes compute (your pipeline servers, Spark clusters). ELT leverages the warehouse's native compute, which scales cheaply for large scans but makes the destination schema messy with raw/staging/mart layers.

### Mental Model

Think of ETL like a chef who preps ingredients before service — guests (downstream consumers) only see finished dishes. ELT is a raw ingredient buffet where guests cook for themselves. ELT is messier but faster to put out and more flexible when you don't know yet what dishes you'll need.

### Where It Gets Interesting

**Late-arriving data** is where topology reveals its tradeoffs. In ETL, late records require reprocessing your transformation layer — often painful if transformations are stateful (aggregations, joins). In ELT, raw data is already in the warehouse, so you can re-run the SQL transformation against the full corrected dataset cheaply. This is why ELT has largely won for analytical workloads.

**Schema evolution** is the other sharp edge. ETL pipelines typically enforce schema at ingest time — a source field rename breaks your pipeline. ELT defers that enforcement, so source changes don't break ingestion, but they silently corrupt downstream transformations until someone notices the numbers are wrong. Neither is safe; they just fail differently.

### Practical Scenarios

**Backend:** If you're building a billing data pipeline, ETL makes sense — you want exactly-once semantics and validated, auditable records before anything touches the billing database. Schema enforcement at the boundary is a feature, not a bug.

**Data:** If you're populating an analytics warehouse where the shape of analysis is still evolving (common in early-stage products), ELT wins. Ingest raw event streams via something like Fivetran or Airbyte, land them in BigQuery, and let analysts iterate on dbt models without touching the ingestion layer.

### What Differentiates Senior Engineers Here

The junior answer is "ELT is modern, ETL is legacy." The senior answer is: ELT trades ingestion simplicity for transformation governance complexity — you now need data contracts, testing at the model layer (dbt tests, Great Expectations), and careful handling of PII in raw tables. ETL trades flexibility for earlier failure modes, which is sometimes exactly what you want. The architecture decision is downstream of your reliability, latency, and governance requirements.
