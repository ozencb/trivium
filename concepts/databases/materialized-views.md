---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Materialized Views

A materialized view is a query result physically saved to disk, refreshed either on a schedule or triggered by data changes. You use one when the query is too expensive to run on every request but the data doesn't need to be perfectly real-time.

**The core mechanism**

A normal view is just a saved SQL query — the database re-executes it every time you select from it. A materialized view breaks that contract: the first time (or each refresh), the full query executes and the results land in a real table. Subsequent reads hit that table directly, with no join or aggregation cost. The tradeoff is staleness and storage.

Refreshes come in two forms. **Full refresh** truncates and repopulates the entire view — simple but expensive for large datasets. **Incremental refresh** (supported in some systems like BigQuery, Snowflake, and newer Postgres extensions) replays only changed rows by tracking deltas from base tables, which makes refreshes cheap enough to run frequently.

**Concrete example**

Say you're building a dashboard that shows monthly revenue by product category. The underlying query joins `orders`, `order_items`, and `products`, then aggregates — it touches millions of rows. Running this per page load is a non-starter.

Instead, you materialize it:

```sql
CREATE MATERIALIZED VIEW monthly_revenue_by_category AS
  SELECT date_trunc('month', o.created_at) AS month,
         p.category,
         SUM(oi.price * oi.quantity) AS revenue
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  GROUP BY 1, 2;
```

Refresh it nightly. Dashboard queries finish in milliseconds.

**Where it shows up in practice**

- **Backend**: Reporting endpoints or admin dashboards where latency matters but slight staleness (hours, not seconds) is acceptable. Common in analytics-heavy SaaS products alongside their OLTP database.
- **Data**: Warehouse query optimization — Snowflake and BigQuery both use materialized views to pre-aggregate fact tables, cutting downstream query costs by orders of magnitude.
- **Fullstack**: Powering search indexes or faceted filters (counts per category, price ranges) where rebuilding from source on every filter interaction is too slow.

**Pitfalls worth knowing**

Staleness bites you when product or business logic changes — a view refreshed hourly can silently serve wrong data for up to an hour if a bug slipped in. Also, dependencies stack: if your view depends on another view, refresh order matters. The biggest mistake is treating a materialized view as a caching layer you control — it's the database's structure, not your application's cache, so invalidation is less granular than you might want.

Reach for materialized views when queries are expensive, reads are frequent, and you can tolerate data lag. If you need sub-second freshness, you're looking at a different solution (event-driven denormalization, read replicas, or a caching layer at the app level).
