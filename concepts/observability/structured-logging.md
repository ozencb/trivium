---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Structured Logging

Instead of writing `"User 42 logged in from 192.168.1.1"`, structured logging emits `{"event":"user_login","user_id":42,"ip":"192.168.1.1","ts":"2026-05-17T10:23:00Z"}`. The difference sounds cosmetic until you're debugging a production incident at 2am across 40 service instances.

**The core mechanism**

Free-form strings require regex or grep to extract meaning — fragile, slow, and impossible to aggregate. Structured logs are records with consistent fields. Log aggregators (Elasticsearch, Loki, Splunk, Datadog) ingest these and let you query `user_id:42 AND status:error` across millions of events instantly, or compute p99 latency by `service` and `endpoint` with a single query. The key insight is that logs become queryable data, not text.

Most implementations use JSON as the wire format, but the shape matters more than the serialization. Fields like `trace_id`, `span_id`, `service`, `level`, `duration_ms`, and `error.type` are the vocabulary that makes cross-service correlation possible. When a request flows through an API gateway → auth service → database, a shared `trace_id` threaded through every log entry lets you reconstruct the full timeline.

**Concrete example**

A checkout fails. With unstructured logs, you grep for "error" and get 10,000 lines. With structured logs, you query `trace_id:"abc123"` and see exactly which service, at what step, with what payload — sorted by timestamp. Then you pivot: `error.type:"timeout" AND service:"payment"` to see if it's systemic.

**Where it matters in practice**

- **Backend:** Every log call should include request context (user, tenant, request ID) injected via middleware — not passed explicitly. Libraries like `structlog` (Python), `zerolog` (Go), or `pino` (Node) make this ergonomic with context chaining.
  
- **SRE:** Structured logs are the foundation for alerting on semantic conditions rather than log volume. "Alert when `error.type:db_connection_refused` appears >10 times/minute" beats "alert when error count spikes."

- **Fullstack:** Correlating a frontend error report with a backend trace requires a shared request ID. Without structured logging on both sides, this correlation is manual and unreliable.

**Common pitfalls senior engineers catch**

- Logging sensitive data in field values (PII, tokens) — structured logs make it *easier* to accidentally expose this because fields are indexed and searchable.
- Over-logging: high-cardinality fields like raw SQL queries or full request bodies will destroy your storage budget and slow indexing.
- Inconsistent field names across services (`user_id` vs `userId` vs `uid`) break cross-service queries — this needs a schema convention enforced at the team level, not per-engineer judgment.

In design discussions, reaching for structured logging signals you're thinking about operability from day one, not retrofitting it after the first outage.
