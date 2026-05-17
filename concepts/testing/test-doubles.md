---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Test Doubles

When a unit under test has external dependencies—a database, an HTTP client, a payment processor—you have a choice: run those dependencies for real, or substitute them with something controlled. Test doubles are the substitutes. The reason to use them isn't just speed; it's isolation. A failing test should point at *your code*, not at network latency or a third-party API being down.

**The core idea: there are five distinct varieties**, each with a different contract:

- **Dummy**: satisfies a parameter requirement but is never called. Pass `null` or an empty object when the method signature demands it but the test path never touches it.
- **Stub**: returns predetermined values. Call `getUser()` → always returns `{id: 1, name: "Alice"}`. No logic, no state, no verification.
- **Spy**: a stub that *records* calls. You can assert afterward that `sendEmail` was called exactly once with a specific address.
- **Mock**: like a spy, but the expectations are declared *upfront*. The test fails if those expectations aren't met, regardless of what else happens.
- **Fake**: has a real, working implementation—just simplified. An in-memory database that supports actual queries is a fake. It has genuine behavior, unlike a stub.

The critical theoretical split is **state verification** vs **behavior verification**. Stubs and fakes let you assert on *what came out* of the system. Mocks assert on *how the system talked to its collaborators*. Overusing mocks couples tests to implementation details—change how the code achieves the same result and every mock-heavy test breaks, even though behavior is unchanged.

**Backend**: You're writing a service that charges a credit card and then sends a receipt email. In tests, stub the payment gateway to return a success response, and spy on the email sender to confirm it was called with the right address. No real charges, no actual emails.

**Frontend**: A React component fetches user data on mount. Stub `fetch` (or your HTTP client) to return a fixture. Now you can test loading states, error states, and the happy path without a running API server.

**Fullstack**: Integration tests for an API endpoint that calls an external weather service. Use a fake HTTP server that responds predictably—you test the full request/response cycle of *your* code while the external dependency stays deterministic.

**Where engineers go wrong**: mocking everything reflexively, including internal collaborators or things that are cheap to run for real. If two modules are tightly coupled and you mock the boundary between them, you're testing implementation, not behavior. The heuristic: mock at *architectural boundaries* (HTTP, database, queue), not between your own classes. And prefer fakes over mocks when the dependency has non-trivial interaction patterns—an in-memory repo is more trustworthy than a pile of `expect(repo.save).toBeCalledWith(...)` assertions.
