---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Circuit Breaker** wraps calls to a downstream dependency and automatically stops making those calls when failure crosses a threshold — giving the dependency time to recover and preventing your service from drowning in cascading failures.

## The Core Mechanism

You know timeout patterns stop you from waiting forever on a single call. Circuit breaker goes further: it tracks the *rate* of failures over time and, when that rate exceeds a threshold, opens the circuit — meaning subsequent calls *fail immediately* without even attempting the network call.

Three states:

- **Closed** — normal operation, calls go through, failures are counted
- **Open** — all calls fail instantly with a short-circuit error, no downstream contact
- **Half-open** — after a cooldown period, a probe request is allowed through; if it succeeds, the circuit closes again; if it fails, back to open

The key insight: failing fast is strictly better than failing slow. An open circuit returns an error in microseconds instead of tying up a thread for 30 seconds waiting on a timeout.

## Mental Model

Think of the electrical circuit breaker in your home. If a fault draws too much current, the breaker trips — not to punish the appliance, but to protect the whole house from catching fire. It resets (half-open probe) after you fix the underlying problem.

## Practical Scenarios

**Backend:** Your order service calls an inventory service. Inventory goes unhealthy — maybe a bad deploy, maybe database pressure. Without a circuit breaker, every order request ties up a thread for the full timeout duration. Under load, your thread pool exhausts, your order service dies too. With a circuit breaker, after N failures the circuit opens, orders fail fast with a clear error, your service stays alive, and you can serve degraded responses (show "check availability at pickup") instead of going down.

**SRE:** Circuit breakers are a first-class signal in observability. Circuit state changes should fire alerts — an open circuit is a leading indicator before user-facing error rates spike. You can also use circuit state to drive load shedding decisions, or expose it in `/health` endpoints so orchestrators can route traffic away.

**Fullstack:** A BFF (Backend for Frontend) calling multiple microservices benefits enormously here. If the recommendations service circuit opens, the BFF returns the page without recommendations rather than timing out the entire page render. Circuit breakers at the API boundary let you implement graceful degradation UI patterns — the frontend shows a skeleton or fallback, not a spinner that never resolves.

## What It Doesn't Replace

Circuit breakers complement timeouts, they don't replace them. You still need timeouts for the closed state — the breaker needs failure signals to count. And they're stateful, so in distributed systems you need to decide whether each instance manages its own breaker state or shares it (most implementations use per-instance state for simplicity).

This pattern is foundational for understanding **Bulkhead**, which isolates *resource pools* rather than individual call paths.
