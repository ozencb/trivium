---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**API versioning is a contract management strategy** — it lets you evolve your API without breaking existing clients that depend on its current behavior.

## The Core Idea

Every API is a contract. Once clients depend on it, you can't just change response shapes, rename fields, or remove endpoints without breaking them. Versioning gives you a way to introduce breaking changes by creating a parallel contract (`v2`) while honoring the old one (`v1`) for however long you need.

The mechanism is straightforward: you isolate a "version" of your API surface — its endpoints, request/response schemas, and behavior — and route requests to the right version. The hard part isn't the routing; it's deciding what constitutes a "breaking" change and maintaining multiple live versions.

## Versioning Strategies

**URI versioning** (`/v1/users`, `/v2/users`) is the most common. It's explicit, cacheable, and easy to reason about in logs. The downside is it violates REST's principle that a URI should identify a resource, not a version of the API.

**Header versioning** (`Accept: application/vnd.api+json; version=2`) is more RESTful but harder to test in a browser and invisible from the URL. It also requires clients to set headers correctly — which they often don't.

**Query param versioning** (`/users?version=2`) is easy to add but pollutes URLs and is often harder to deprecate cleanly.

Most teams pick URI versioning and accept the REST purist criticism because the operational clarity is worth it.

## Practical Scenarios

**Backend:** You're adding a new user model that replaces `full_name` with `first_name` + `last_name`. Without versioning, every client breaks simultaneously. With versioning, `v1` keeps serving `full_name` (you populate it by joining the two fields), `v2` returns the new shape. You can deprecate `v1` once clients migrate.

**Fullstack:** You own both the API and the frontend, so you might think versioning is unnecessary. It's not — mobile clients on old app versions will call your API for months after you ship a new backend. If you deploy a breaking change, those users get errors. Versioning lets you decouple backend deploys from client releases.

## What Actually Gets Versioned

In practice, people version entire API paths rather than individual resources. This creates maintenance overhead: bug fixes often need to be backported to older versions, and shared business logic can't be cleanly isolated. Some teams use **expansion by default** — never removing fields, only adding new ones — to avoid versioning altogether. This works until it doesn't, and then you need versioning anyway.

The connection to **API deprecation** is direct: versioning creates the machinery for deprecation. Without versioned endpoints, you can't announce "v1 sunsets in 6 months" — you have no `v1` to point at.
