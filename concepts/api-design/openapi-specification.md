---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## OpenAPI Specification

OpenAPI is a machine-readable YAML/JSON document that describes your REST API completely enough that tools—not humans—can generate SDKs, spin up mock servers, render interactive docs, and run contract tests against it. The core value isn't documentation; it's that a single versioned artifact becomes the ground truth that every downstream consumer (frontend, mobile, QA, third-party integrators) works from.

**The core mechanism**

An OpenAPI spec describes paths, HTTP methods, path/query/header parameters, request body schemas, response schemas per status code, auth schemes, and reusable component definitions—all in a structured format that tools can parse deterministically. The two philosophies for producing it: *design-first* (write the spec, then implement) vs. *code-first* (annotate your code, generate the spec). Design-first is harder to start but forces API contracts to be deliberate before any code is written; code-first is faster to adopt but risks spec drift where generated docs lag behind actual behavior.

**Mental model**

Think of it as a TypeScript interface for your entire API surface—but one that's language-agnostic and toolchain-consumable. When you change the interface, everything downstream regenerates: client SDKs, server stubs, mock responses, validation middleware.

**Backend scenarios**

You can feed the spec into `openapi-generator` to produce server stubs in Go, Java, Python, etc., then fill in business logic. More practically: middleware like `express-openapi-validator` or `oas-tools` will reject malformed requests *at the gateway* before they reach your handlers—schema enforcement without hand-rolling validation. In CI, tools like Schemathesis fuzz your real API against the spec and surface undocumented error paths automatically.

**Fullstack scenarios**

The classic unlock: frontend teams run a mock server (Prism, Mockoon) pointed at the spec while the backend builds in parallel. When the real service ships, they swap one URL. This eliminates the "we're blocked on the API" bottleneck. It also makes the contract explicit—if the backend ships a response shape that doesn't match the spec, the frontend's contract tests catch it before integration.

**Common pitfalls**

Spec drift is the silent killer—especially in code-first setups where the spec is regenerated inconsistently. Overusing `anyOf`/`oneOf` to model polymorphic responses sounds correct but breaks most generators. Documenting only 200 responses and leaving error schemas empty means consumers invent their own error handling.

**The senior differentiator**

Knowing when to skip it: internal gRPC/Protobuf microservices communicate better through `.proto` files. Treating the spec as a versioned artifact committed to the repo and validated in CI—not as a doc site you regenerate manually. And pushing for design-first on external APIs, because retrofitting a spec onto an existing API usually reveals the API was designed for the implementation, not for the consumer.
