---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Chaos Engineering

Chaos Engineering is the practice of deliberately injecting failures into production-like systems to surface hidden assumptions before they become incidents. Complex distributed systems fail in ways you can't predict by reading code or reviewing architecture diagrams—you have to run the system under stress to see what actually breaks.

**Core Mechanism**

The discipline has a specific structure, not just "break things and see what happens." It starts with a *steady-state hypothesis*: a measurable signal that tells you the system is healthy (error rate < 0.1%, p99 latency < 200ms, orders per minute within a normal range). You then run an experiment—kill a pod, saturate a network interface, introduce latency on a dependency—while watching whether that steady state holds. If it does, your system is resilient to that failure class. If it doesn't, you've found a real gap before an on-call rotation does at 2am.

Automated rollback is as critical as the experiment itself. Stopping an experiment when the steady state degrades beyond a threshold is what separates chaos engineering from reckless destruction. Blast radius control is a first-class requirement, not an afterthought.

**Mental Model**

Think of it as a vaccine trial for your infrastructure. A vaccine introduces a controlled dose of pathogen to train the immune system. Chaos experiments introduce controlled failure to train both your system's resilience mechanisms and your team's incident response reflexes. The goal isn't to cause damage—it's to observe and adapt before the uncontrolled version happens.

**Practical Scenarios**

*SRE:* You've instrumented services with circuit breakers. Chaos engineering verifies they actually trip under real conditions—not just unit tests. Simulate a downstream dependency going *slow* (not down—slow), and confirm your timeout configuration actually terminates connections rather than letting threads pile up until memory exhausts. Misconfigured circuit breakers are common in production; chaos surfaces this cheaply.

*DevOps:* Blue-green deployments give you confidence in release rollbacks. Chaos engineering tests whether your switchover mechanism holds under load. Does flipping traffic back to blue work cleanly if green is already degraded? Run the experiment on a Tuesday afternoon, not during a real incident.

*Backend:* Bulkhead patterns isolate thread pools per downstream. An experiment that saturates calls to one service validates whether the bulkhead prevents cascading failures—or whether a shared resource (connection pool, database, cache) bypasses the bulkhead and creates the cascade anyway. This is a common gap: the bulkhead exists, but the dependency you didn't model around it doesn't respect it.

**Where Senior Engineers Differentiate**

In design reviews, proposing an architecture without asking "how would we chaos test this?" signals a gap. The question forces specificity: what's the steady state? what failure modes are we not resilient to? It shifts the conversation from "this should work" to "here's how we'll verify it works under failure"—which is what distinguishes engineers who design for observable failure from those who design for nominal success.
