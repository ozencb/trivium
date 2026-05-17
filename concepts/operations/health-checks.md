---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Health Checks

Health checks are the contract between your application and its infrastructure — a way for orchestrators like Kubernetes and load balancers to ask "are you okay?" and get a meaningful answer. Without them, infrastructure can only detect that your process is running, not whether it's actually serving traffic correctly.

**The core mechanism**

There are three distinct probes, each serving a different question:

- **Liveness**: "Should this container be killed and restarted?" A liveness failure means the process is stuck — deadlocked, OOM, corrupted state. The fix is restart.
- **Readiness**: "Should this instance receive traffic?" A readiness failure means the instance is alive but not ready — still warming up, waiting on a dependency, under too much load. The fix is traffic removal, not restart.
- **Startup**: "Has the application finished initializing?" Used to give slow-starting apps a grace period before liveness kicks in, preventing a restart loop during boot.

The distinction between liveness and readiness is where most people get it wrong initially. A database connection failing should fail readiness, not liveness. Failing liveness triggers a restart that probably won't fix a downstream DB being down — it just adds churn.

**Mental model**

Think of a surgeon mid-operation. The hospital (orchestrator) can see they're physically present (liveness: alive), but they shouldn't be handed a new patient right now (readiness: not ready for new traffic). Killing and replacing the surgeon (restart) wouldn't help.

**In practice**

*Backend engineering*: Your `/health/ready` endpoint should check actual dependencies — can you reach the database, is the cache warm, are critical config values loaded? A shallow `200 OK` that always returns healthy is useless and extremely common. The failure mode is that a node with a broken DB connection stays in rotation and returns 500s to real users.

*SRE*: Health checks are upstream of your circuit breaker. If circuit breakers handle failure gracefully within a call, health checks handle it at the routing layer. A well-tuned readiness probe means your CB never even sees load from a degraded instance.

*DevOps/Platform*: Startup probes matter more than people think for JVM services or anything with slow initialization. Without them, Kubernetes often kills the pod during its first liveness check, triggering a restart loop that takes minutes to stabilize. Setting `initialDelaySeconds` is a blunt workaround; startup probes are the right tool.

**Common pitfall**

Making health checks too expensive — hitting the DB on every probe, with a 5-second interval — adds load during the exact moments (degradation, high traffic) when you want least overhead. Keep probe endpoints lightweight: check connection pool state, not a live query.

Health checks are simple in concept but surprisingly nuanced in calibration. Get the thresholds wrong and you either restart healthy instances under momentary pressure, or leave genuinely broken ones serving traffic.
