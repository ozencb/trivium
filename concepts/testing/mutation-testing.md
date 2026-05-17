---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Mutation Testing

Your test suite passes. Coverage is 85%. But does that mean your tests are actually *good*? Mutation testing answers that question by asking: if the code were slightly wrong, would your tests notice?

**The mechanism**

A mutation testing tool takes your source code and generates hundreds of variants—mutants—each with a single small change: `>` becomes `>=`, `+` becomes `-`, a `return true` becomes `return false`, a conditional gets deleted entirely. It then runs your full test suite against each mutant. If the tests fail on a mutant, the mutant is "killed"—good, your tests caught it. If the tests pass despite the broken code, the mutant "survived"—that's a gap in your suite.

The output is a **mutation score**: killed / total. A suite with 95% line coverage but 40% mutation score tells you something important: your tests execute the code but don't assert meaningful things about its behavior.

**Why this matters beyond coverage**

Coverage tells you which lines ran. Mutation testing tells you whether your assertions are load-bearing. Consider:

```python
def is_eligible(age):
    return age >= 18

def test_eligible():
    assert is_eligible(20) == True
```

100% coverage. But a mutant changing `>=` to `>` survives—no test checks the boundary. Property-based testing would catch this naturally (you'd generate edge cases), but mutation testing exposes the gap even without that discipline.

**Practical mental model**

Think of it like adversarial code review: a tool plays the role of a developer who introduces subtle bugs and checks whether your test suite would catch them in CI. It's asking "are my tests falsifiable?"—the same epistemological question behind property-based testing, but applied retrospectively to existing suites.

**Backend**

In service code, mutation testing is most valuable on business logic with complex conditionals—pricing engines, authorization checks, state machine transitions. These are exactly the places where an off-by-one or flipped operator causes a real incident, and where unit tests often assert the happy path without covering the boundary semantics. Running Pitest (JVM), mutmut (Python), or Stryker (JS/TS) on your domain layer regularly surfaces tests that are essentially decorative.

**Fullstack**

On the frontend, mutation testing on pure logic (form validation, data transformation, UI state reducers) works well. It's less practical for component render tests where assertions tend to be coarse ("element exists"). On API handlers and middleware, it's effective for surfacing whether error-path tests actually verify the right status codes and response shapes, or just that the endpoint didn't throw.

**When to reach for it**

Not as a gate on every commit—it's slow. Use it periodically on high-stakes modules, or when onboarding onto a legacy codebase to audit whether the existing test suite is trustworthy before you start refactoring against it.
