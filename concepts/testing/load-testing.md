---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Load testing is how you find out where your system breaks before your users do. Unlike unit or integration tests that verify correctness, load tests verify behavior under stress — giving you empirical data on throughput ceilings, latency degradation curves, and failure modes you can only observe at scale.

## Core Mechanism

The idea is simple: generate traffic that mimics (or exceeds) your production load profile, then observe how the system responds. But the nuance is in the *profile*. A naive load test hammers a single endpoint with uniform requests. A realistic one models actual user behavior — session ramp-ups, think time between requests, mixed read/write ratios, cache hit patterns, geographic distribution. Getting this wrong produces data that looks convincing but predicts nothing.

There are three distinct shapes you care about:

- **Load test**: sustained traffic at expected peak — does the system hold SLOs under normal heavy use?
- **Stress test**: traffic beyond expected peak — where does it crack, and does it crack gracefully?
- **Spike test**: sudden burst (traffic surge from a campaign, viral moment) — does latency spike and recover, or does the system cascade?

Each answers a different question. Conflating them leads to false confidence.

## Mental Model

Think of your system as a highway. Throughput is cars per hour. Latency is drive time. Load testing reveals the traffic volume at which the highway starts backing up — and whether the backup clears after traffic drops or becomes a permanent jam. The goal isn't to survive the peak moment; it's to understand whether recovery is automatic.

## Practical Connections

**Backend**: You're releasing a new batch-processing endpoint. A load test reveals that at 200 concurrent requests, the connection pool exhausts and requests start queuing. Your P99 latency violates your SLO before the CPU is even stressed — the bottleneck is the pool size, not the compute. You'd never catch this with unit tests.

**SRE**: You've set error budget burn rate alerts based on SLI thresholds. Load testing helps you calibrate where those thresholds become realistic — you learn that your latency SLI starts degrading at 60% of your self-reported capacity ceiling, giving you a meaningful margin before alerting.

**Fullstack**: An API that performs fine in dev starts timing out under real user concurrency because each request triggers three synchronous downstream calls. Load testing surfaces that serial fan-out pattern before it becomes a user-facing incident on launch day.

## Common Pitfalls

- **Testing in isolation**: your service holds up fine, but the database or a shared downstream service doesn't. Test the path, not just the component.
- **Ignoring warmup**: JVM JIT, CDN cache priming, connection pool establishment — cold-start behavior can dominate early results.
- **Not modeling recovery**: whether a system recovers after shedding load matters as much as whether it survives the peak.

This is the prerequisite for capacity planning because you can't plan headroom for growth without knowing where the current ceiling actually is.
