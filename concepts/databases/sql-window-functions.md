---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Window functions let you compute aggregates over a set of related rows while keeping every row in the result — unlike `GROUP BY`, which collapses rows. The "window" is a per-row definition of which peers participate in the calculation, making patterns like running totals, rankings, and period-over-period deltas expressible without self-joins or subqueries.

**Core mechanism**

The `OVER()` clause is where the work happens. It has three independent parts:

- `PARTITION BY` — resets the window per group (like `GROUP BY` scoping, but rows survive)
- `ORDER BY` — controls ordering within each partition, and implicitly defines the frame
- Frame spec (`ROWS` / `RANGE BETWEEN ...`) — pins exactly which rows around the current row are included in the aggregate

When you write `SUM(amount) OVER (PARTITION BY user_id ORDER BY ts)`, the frame defaults to `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — so the sum grows cumulatively per user. Change it to `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` and you get a 7-row rolling window. The distinction between `ROWS` (physical row offset) and `RANGE` (logical value offset) is where most bugs live: `RANGE` with ties includes all rows with the same `ORDER BY` value, which silently over-counts.

**Mental model**

Think of it as: for every output row, the database creates a virtual sub-table of peer rows matching the partition, sorts them, slices out the frame, runs the aggregate, and staples the result back to the original row. The base query runs once; the window function is a second pass layered on top.

**Practical patterns**

*Backend*: Ranking results without a subquery. `ROW_NUMBER() OVER (PARTITION BY category ORDER BY score DESC)` gives a per-category rank in one query — filter with a CTE where rank = 1 to get category winners. `LAG(status, 1) OVER (PARTITION BY order_id ORDER BY changed_at)` surfaces the previous state, making event-log diffing trivial.

*Data/analytics*: Running totals, cohort retention, month-over-month deltas. `amount - LAG(amount) OVER (PARTITION BY account ORDER BY month)` is cleaner and faster than a self-join. For rolling averages over time-series data, `AVG(value) OVER (ORDER BY ts ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)` is idiomatic.

**When to reach for it**

Any time you catch yourself writing a correlated subquery that references the outer row for an aggregate, a window function is almost certainly the right replacement — same semantics, single scan. Also reach for it when `GROUP BY` loses the detail you need: if you want both the row-level data *and* a group-level aggregate in the same result set, `GROUP BY` can't give you that without a join back to the original table.

**Common pitfalls**: forgetting that `WHERE` filters rows *before* window functions execute (use a CTE or subquery to filter after), conflating `RANGE` and `ROWS` semantics with tied values, and expecting `ORDER BY` inside `OVER()` to affect the final result order — it doesn't.
