---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## N+1 Query Problem

The N+1 problem is what happens when your code fetches a list of records and then, for each one, fires a separate query to get related data — turning what should be a small number of database round trips into hundreds or thousands. The database itself handles each query fine; the killer is the accumulated latency from all those round trips.

**The mechanism**

ORMs make it easy to write code that looks innocent but hides a loop of queries. When you call `user.posts` inside a loop over users, the ORM lazily executes `SELECT * FROM posts WHERE user_id = ?` once per user. The ORM is doing exactly what you asked — it just doesn't volunteer the fact that "accessing a relationship" means "issuing a query."

**Concrete example**

```python
users = User.query.all()          # Query 1: SELECT * FROM users
for user in users:
    print(user.posts)             # Query 2..N+1: SELECT * FROM posts WHERE user_id = ?
```

With 200 users, you've made 201 queries. With eager loading:

```python
users = User.query.options(joinedload(User.posts)).all()  # 1 query with JOIN
```

One round trip, same data.

**Why it's insidious**

It's invisible in development. With 5 test users, 6 queries is nothing. In production with 500 users, you're hammering the database on every page load — and the slow query log won't help you because each individual query is fast. You need something that counts query volume, not duration: Django Debug Toolbar, Bullet gem (Rails), or application-level query logging.

**Real-world patterns where this bites you**

- **REST APIs that serialize nested resources**: a `/orders` endpoint that serializes each order's `customer`, `line_items`, and `products` without eager loading
- **GraphQL resolvers**: each field resolver fetches data independently; the standard fix is DataLoader to batch and deduplicate
- **Admin panels and reporting dashboards**: code that renders a table of entities with related counts or names
- **Background jobs**: processing a queue of records where each job touches related models

**Fixes, ranked by reach**

1. **Eager loading** (`includes`, `joinedload`, `with`) — catches it at the ORM level, minimal code change
2. **Batching/DataLoader pattern** — groups N lookups into one `WHERE id IN (...)`, useful when you can't control the fetch site (GraphQL)
3. **Raw JOIN query** — when you need full control over what's returned and how it's shaped

The decision between JOIN and batch-by-IDs matters at scale: JOINs can explode row counts with one-to-many relationships (a user with 100 posts returns 100 rows), while `WHERE id IN (...)` keeps rows predictable. For one-to-one or many-to-one, JOIN is usually fine. For one-to-many, batch the child query separately.
