---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## API Mocking

API mocking is the practice of replacing a real service dependency with a controlled stand-in that speaks the same contract — same endpoints, same request/response shapes — without executing real business logic. The core value is decoupling: your code under test doesn't care whether the responses come from a running service or a recorded fixture, so you can make assertions in isolation.

**The core mechanism**

The key insight is that a mock isn't just a stub returning hardcoded JSON. A well-built mock enforces the contract. Tools like MSW (Mock Service Worker), WireMock, or Prism can generate mocks *from* an OpenAPI spec, meaning if the spec says `GET /users/{id}` returns a `User` object with a required `email` field, your mock validates that outgoing requests and responses conform. This shifts mocking from "I manually wrote some fake data" to "I'm testing against the agreed interface."

Most mocking tools operate at one of two layers:
- **Network interception** (MSW, nock): Intercept HTTP calls at the fetch/XHR level inside the process, invisible to your application code.
- **Standalone server** (WireMock, Prism): Spin up a real HTTP server on localhost that your app talks to via configuration.

**Concrete mental model**

Think of a mock as a flight simulator. A pilot training on a 737 simulator isn't flying a real plane, but the controls, instruments, and failure modes mirror the real thing closely enough that the training transfers. The value breaks down if the simulator drifts from the real plane's behavior — same failure mode when your mock drifts from the actual API.

**Practical scenarios**

*Frontend:* The classic use case. Your React app needs to render a dashboard but the backend endpoints aren't built yet. You mock the `/metrics` endpoint with MSW, run your dev server, and iterate on the UI while the backend team works in parallel. The contract (OpenAPI spec) is the handshake — both sides commit to it, and the mock enforces it.

*Backend:* You're building a service that calls a third-party payment processor. You don't want real charges in your test suite, and the sandbox environment is flaky. A mock of the payment API lets you write deterministic tests for error cases (card declined, timeout, 500 response) that are hard to reproduce reliably with a real service.

*Fullstack:* Integration tests that run in CI against a full frontend+backend stack can still mock external services (Stripe, Twilio, internal microservices) to avoid flakiness and cost. The app under test is real; only its outbound dependencies are mocked.

**Common pitfall**

Mock drift — the mock diverges from the real API as the service evolves, and your tests pass while production breaks. The fix is contract testing (Pact, OpenAPI-driven validation) which verifies the mock's contract against the real service periodically. This is the direct path to Service Virtualization, which takes mock management to the infrastructure level.
