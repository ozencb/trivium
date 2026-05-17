---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Integration Testing

Unit tests lie. Not maliciously—they test exactly what you tell them to, against mocks you control. The problem is that the real world doesn't use your mocks. Integration tests exist because the contract between your code and its dependencies is where bugs actually live.

**The core mechanism:** Integration tests spin up real (or realistic) dependencies and exercise multiple components communicating across actual boundaries. Where a unit test might mock `db.query()` and return a hardcoded row, an integration test runs against a real Postgres instance, exercises the ORM, and verifies the round-trip. The test is no longer asking "does my code call the right method?"—it's asking "does this actually work?"

**What they catch that unit tests can't:**
- SQL that's valid Python but invalid for your schema
- Transaction isolation bugs
- Serialization mismatches between services (your code sends `snake_case`, the downstream expects `camelCase`)
- Race conditions in message consumers
- Auth middleware that works in isolation but strips headers before your handler sees them

**Mental model:** Think of your system as pipe joints. Unit tests verify each pipe section has the right diameter on paper. Integration tests run water through the actual joints and find that two sections that looked compatible don't seal—because tolerances, or because someone used metric specs on an imperial fitting.

**Practical patterns by context:**

*Backend:* A service layer test that seeds a database, calls your business logic, and asserts on the resulting DB state—not on what methods were called. Common setup: Testcontainers to spin up ephemeral Postgres/Redis per test run, transaction rollback to reset state cheaply.

*Fullstack:* Testing an API endpoint from HTTP request to database write. You're not mocking the request parser, the middleware chain, or the ORM—you're sending real HTTP and asserting on both the response and the side effects. This catches the case where your controller and service agree but the route is misconfigured.

*DevOps:* Infrastructure integration tests—does your app actually connect to the provisioned RDS instance with the right secrets? Does the ECS task have the IAM role it needs to write to S3? Terraform can `plan` without error and still produce an environment where your app fails on boot.

**The main pitfall** is test isolation. If test A leaves dirty state that test B depends on, you have hidden coupling and flaky tests. Strict teardown or transaction rollback per test is non-negotiable. The other pitfall is slow feedback—integration tests are inherently slower, so running them on every keystroke is wrong; run them in CI and on pre-commit.

Integration tests don't replace unit tests—they answer a different question. Unit tests verify logic; integration tests verify that the wired-together system behaves as intended.
