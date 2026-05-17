---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Circuit Breaker

When a downstream service starts failing, naively retrying every call doesn't just waste resources — it turns one sick service into a cascading outage. The circuit breaker wraps those remote calls in a state machine that detects the failure pattern and stops trying, giving the downstream time to recover while protecting your own system.

**The mechanism**

Three states, and the transitions between them are what matter:

- **Closed** (normal): calls pass through, failures are counted against a rolling window. Once failures cross a threshold (e.g., 50% of the last 20 calls), the breaker *trips*.
- **Open** (failing fast): all calls immediately return an error — no network round-trip, no timeout wait, no thread pool exhaustion. A timer starts.
- **Half-Open** (probing): after the timeout expires, a small number of probe calls are allowed through. If they succeed, the breaker resets to Closed. If they fail, back to Open.

The insight that separates real understanding from surface knowledge: **the threshold and window design is the hard part**. A count-based threshold (`5 failures`) is too sensitive to traffic spikes. A percentage-based threshold with a minimum request floor (`50% failure rate, minimum 10 requests`) avoids tripping during low-traffic periods when two failures look like 100%.

**Mental model**

Think of your home's circuit breaker. When there's a short, it trips immediately rather than letting current continue to flow and burn the wiring. You don't keep flipping it repeatedly — you wait, check the underlying cause, then cautiously restore power. Same idea here, except software can automate the "wait and probe" part.

**In practice**

*Backend*: You're calling a payment processor. It starts timing out. Without a breaker, your thread pool fills with pending HTTP connections, your service degrades, and now callers upstream see *your* service as broken. With a breaker, open state returns an immediate "payment service unavailable" — your threads are freed, you degrade gracefully, and you can surface a user-friendly fallback.

*SRE*: Circuit breakers are a key lever in *steady-state* resilience, but they complicate alerting. A breaker in Open state suppresses errors that would otherwise alert you. You need metrics on breaker state transitions, not just error rates, or you'll miss that a dependency has been degraded for 20 minutes.

*Fullstack*: API gateways (Kong, Envoy, AWS API Gateway) implement circuit breaking at the network layer. Knowing this means you can push the concern out of application code entirely, and configure it per-route with traffic-weighted thresholds rather than rebuilding it in every service.

**Where engineers get this wrong in interviews**

Describing only the happy path: "it trips after N failures." The differentiation is discussing *what N should be*, why half-open exists (closed-loop recovery probe vs. relying on an operator), and how breaker state interacts with health checks, retries, and bulkheads — which is exactly where this concept leads next.
