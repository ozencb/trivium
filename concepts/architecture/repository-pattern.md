---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Repository Pattern

The Repository Pattern puts a collection-like interface in front of your persistence layer so domain code calls `userRepo.findById(id)` instead of crafting SQL or chaining ORM methods directly. The payoff: domain logic stays ignorant of whether data lives in Postgres, Redis, or a flat file, and you can swap or fake that layer without touching business logic.

### Core Mechanism

Your domain code depends only on an interface — `UserRepository` with methods like `findById`, `save`, `delete` — injected via DI. The concrete implementation (`PostgresUserRepository`, `MongoUserRepository`) lives behind it. Services receive the interface; they never instantiate the concrete class.

The critical invariant that separates this from "just wrapping the ORM": **repositories return domain objects, not ORM entities or raw rows.** `findActiveUsers()` returns `User[]`, not query builder results. That boundary is what keeps domain logic pure. All query logic — joins, filters, pagination — is encapsulated inside the repository. None of it leaks into services.

### Mental Model

Think of a repository as a collection that happens to be backed by a database. From the caller's perspective it's like working with an in-memory array: `repo.add(user)`, `repo.find(id)`, `repo.remove(id)`. The implementation detail (SQL, document store, external API) is invisible to the caller.

### In Practice

**Backend:** When testing a service that sends email on user creation, you don't want a real database in the test. Inject a `FakeUserRepository` that holds users in memory — tests run in milliseconds, zero infrastructure needed. When migrating from MySQL to Postgres or adding a read replica, only the concrete implementation changes.

**Fullstack:** On the frontend (Next.js, Remix), repositories abstract *where* data comes from — API call, local cache, SSR-fetched data — behind the same interface. A `ProductRepository` might hit REST in production but return fixtures during Storybook development or Cypress tests. The component doesn't know or care.

### Common Pitfalls

- **Leaking query syntax to callers** (`repo.findWhere('status = ?', 'active')`) defeats the abstraction — callers now know it's a SQL-backed store.
- **One generic `Repository<T>`** with raw CRUD loses the ability to express domain-meaningful queries like `findUsersEligibleForPromotion()`.
- **Returning ORM entities into domain logic** — those entities often carry lazy-load behavior and lifecycle hooks that couple your domain to the ORM in non-obvious ways.

### Connection to Hexagonal Architecture

The repository interface is literally a *port* in Hexagonal Architecture, and the concrete implementation is an *adapter*. Once you internalize this pattern, the Hexagonal model becomes obvious: your application core defines interfaces for everything it needs from the outside world; adapters fulfill those contracts. Repository is the most common example of that idea in action.
