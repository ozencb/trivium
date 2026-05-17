---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Schema-First API Design

Define the interface contract in a machine-readable schema (OpenAPI, Protobuf, GraphQL SDL) before writing any implementation code. The schema becomes the single source of truth that both client and server must conform to — not documentation generated after the fact.

### The Core Mechanism

The discipline isn't just "write docs first." It's that the schema is *executable*: servers validate requests against it, clients generate typed SDKs from it, mocks spin up from it before any handler exists. This breaks the most common API rot cycle — where the spec drifts from the implementation because the implementation was written first and the spec was never checked in CI.

The real leverage is **parallel development**. Once the schema is approved, frontend and backend teams can work simultaneously. Frontend uses a generated mock server; backend uses contract tests derived from the same schema. Integration becomes a formality rather than a negotiation.

### Concrete Example

You're building a `/orders` endpoint. Schema-first means you write the OpenAPI spec first — request body shape, response codes, error formats — get it reviewed in a PR, then generate:
- Server stubs (e.g., via `openapi-generator`) with empty handlers to implement
- A TypeScript client SDK for the frontend
- A Prism mock server the frontend uses immediately

When the backend ships, the frontend already knows exactly what to expect. If the backend deviates from the schema, contract tests catch it in CI — not in a production incident.

### Where It Actually Matters

**Backend:** Schema-first forces the API design conversation to happen before you're anchored by implementation constraints. It's much easier to change a field name in a YAML file than after you've built persistence, handlers, and tests around it. In team settings, PRs on schema changes are reviewable by non-implementers — PMs, frontend engineers, consumers of your API.

**Fullstack:** The bigger win is eliminating the "what does this field actually return?" back-and-forth that plagues fullstack development. Generated types mean the compiler catches breaking changes. Schema evolution (nullable fields, new required params) becomes a deliberate, reviewable decision rather than a silent runtime surprise.

### What Trips People Up

The failure mode is treating the schema as documentation rather than enforcement. If your CI doesn't validate the live API against the schema, you get drift. The schema becomes a lie. Real schema-first means the generated code *is* the code — you're not maintaining two parallel artifacts, you're deriving one from the other.

In interviews and design discussions, the differentiating signal is understanding this enforcement gap. Knowing OpenAPI syntax is table stakes; knowing that schema-first only works if code generation and contract testing are wired into your build pipeline is what separates engineers who've operated this at scale from those who've just read about it.
