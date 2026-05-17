---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## GraphQL N+1 Problem

In GraphQL, the N+1 problem is structural rather than accidental — the resolver model actively encourages it. Each resolver is responsible for fetching its own data independently, which means when a list query returns N parent objects, every child resolver fires N separate database queries to resolve nested fields. You end up with 1 query for the list + N queries for the related data, regardless of how clean your schema looks.

**The core mechanism**

GraphQL's execution model runs resolvers per field, per object. When you query `posts { author { name } }`, the runtime calls your `author` resolver once per post object in the result. Each invocation is isolated — resolvers don't share context by default, so each one issues its own `SELECT * FROM users WHERE id = ?`. If you return 100 posts, you get 100 user lookups. The schema is elegant; the database traffic is not.

**The fix: DataLoader batching**

[DataLoader](https://github.com/graphql/dataloader) solves this by flipping the execution model. Instead of fetching immediately, each resolver call enqueues a key (e.g., `userId`) into a batch. DataLoader defers resolution until the end of the current tick, then fires a single bulk query with all collected keys: `SELECT * FROM users WHERE id IN (1, 2, 3, ...)`. Results are fanned back out to the individual resolvers. The key insight: batching is per-request, so you get proper isolation without cross-request data leakage.

```js
const userLoader = new DataLoader(async (userIds) => {
  const users = await db.query('SELECT * FROM users WHERE id = ANY($1)', [userIds]);
  return userIds.map(id => users.find(u => u.id === id)); // ordering matters
});

// In your resolver:
author: (post) => userLoader.load(post.authorId)
```

The ordering requirement is subtle and a common source of bugs — DataLoader expects results in the same order as the input keys.

**Where this bites you**

**Backend:** Any resolver that fetches by a foreign key is a candidate. Nested queries are the obvious case, but mutations that return enriched payloads can hit this too. Prisma's `findMany` + `include` sidesteps it in simple cases, but once your resolvers are composed from independent services or data sources, DataLoader is your only real option.

**Fullstack:** If you control both ends (e.g., Next.js + GraphQL Yoga), it's tempting to lean on server components or caching and skip DataLoader. Don't — these are orthogonal concerns. DataLoader handles *within-request* batching; caching handles *across-request* deduplication. You usually want both.

**Practical callout:** DataLoader batching only works if all resolvers in a request share the same loader instance. Creating a new loader per resolver call defeats the purpose entirely. Scope loaders to the request context (e.g., via Apollo's `contextValue`), not the module level.
