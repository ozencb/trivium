---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## gRPC

gRPC formalizes service communication into a code-generated contract: you write a `.proto` file, run `protoc`, and get strongly-typed client/server stubs in a dozen languages. The pitch over REST isn't just performance—it's that schema drift becomes a compile error rather than a runtime surprise.

**Core mechanism**

The `.proto` file is the single source of truth. It defines services, methods, and message shapes. Code generation produces stubs that handle serialization, framing, and HTTP/2 stream management. You write business logic; the generated layer handles the wire.

Under the hood, gRPC maps to four communication patterns:
- **Unary** — one request, one response (equivalent to a REST call)
- **Server streaming** — client sends once, server pushes a stream (e.g., live telemetry)
- **Client streaming** — client streams data, server responds once (e.g., file upload)
- **Bidirectional streaming** — both sides stream concurrently over a single HTTP/2 connection

HTTP/2 multiplexing means all four patterns share one TCP connection without head-of-line blocking. Flow control operates at both connection and stream levels, so a slow consumer can back-pressure a fast producer without application-layer polling.

**Mental model**

Think of `.proto` the way you think of a TypeScript interface that both sides of a network boundary are forced to import. If Service B removes a field Service A depends on, the build breaks—not a prod incident at 2am.

**Practical scenarios**

*Backend:* Internal microservice-to-microservice calls are where gRPC earns its keep. You control both endpoints, care about latency at high RPS, and want streaming without WebSocket infrastructure. Interceptors handle auth, tracing, and deadline propagation cleanly.

*Fullstack:* Raw gRPC doesn't run in browsers (HTTP/2 trailers aren't exposed). You have two options: grpc-web with an Envoy proxy, or the Connect protocol (Buf's implementation), which speaks both gRPC and HTTP/1.1 JSON. For new projects, Connect is usually the better call—you get gRPC semantics without the proxy overhead.

**Pitfalls worth knowing**

- L4 load balancers treat gRPC as a single long-lived TCP connection—all traffic goes to one backend. You need L7-aware load balancing (Envoy, GCP's HTTP/2 LB) or client-side load balancing.
- Schema evolution requires field number discipline. Never reuse a field number; use `reserved` when removing fields. Violating this silently corrupts deserialization.
- Debugging: no curl equivalent. Use `grpcurl` or Postman's gRPC support. Missing this tooling is a common friction point when onboarding teams.

**When to reach for it**

Internal services at scale, bidirectional streaming, or polyglot environments where shared contract enforcement matters. Avoid it for public-facing APIs where discoverability and browser-native consumption matter more than performance—REST/JSON with OpenAPI is still the better public interface.

The design-discussion signal: proposing gRPC for internal comms while keeping REST for the public API layer shows you understand the tradeoff rather than cargo-culting either approach.
