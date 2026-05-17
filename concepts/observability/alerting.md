---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Alerting

Alerting is the practice of defining conditions on your metrics and logs that trigger notifications when something demands human attention. Done well, it's the difference between your on-call engineer sleeping through minor blips and waking up when users are actually hurting.

### The Core Idea: Symptoms, Not Causes

The fundamental insight is to alert on **what users experience**, not on internal system states. This is the symptom-based vs. cause-based distinction. A high CPU alert is cause-based — CPU can spike for a dozen reasons, most benign. A "5% of requests are returning 5xx errors" alert is symptom-based — users are directly affected, and this almost always needs attention regardless of root cause.

This pairs directly with your SLIs and SLOs. If your SLO is "99.9% of requests complete in under 200ms," your alert fires when that burn rate is on track to exhaust your error budget within a defined window. This is called **burn rate alerting** and it's the most principled approach: you're not guessing at thresholds, you're asking "are we consuming our error budget faster than sustainable?"

### Concrete Mental Model

Think of your error budget as a tank of water with a slow leak. A momentary spike (fast leak) that self-heals doesn't drain the tank. But a sustained degradation (slow leak) will. A well-designed alert fires on *rate of drain*, not instantaneous flow. This is why Google's SRE book recommends two complementary alerts per SLO: one for fast burns (1-hour window, ~14x burn rate) and one for slow burns (6-hour window, ~6x burn rate) — catching both sudden outages and subtle degradation.

### Practical Scenarios

**SRE/Backend:** You've got a payment service. Alert on "payment success rate < 99%" for 5 minutes, not on "database query latency p99 > 500ms." The DB alert creates noise; it might be a batch job. The payment alert tells you users are losing money *right now*.

**DevOps:** During a deploy, watch error rates and latency at the edge (load balancer or gateway) before congratulating yourself. A canary that's 5% of traffic but showing 10% error rate should page before it rolls further. This requires alerting on *relative* degradation from baseline, not just absolute thresholds.

**General:** Avoid "flapping" alerts — conditions that oscillate in and out of threshold. Adding a `for: 5m` clause (sustained condition) in tools like Prometheus dramatically reduces noise without meaningfully delaying real pages.

### What Separates Senior Engineers

Most engineers configure alerts reactively after incidents. Senior engineers define SLIs first, then derive alerts from error budget burn rates, then tune them against historical data. They can explain why a particular threshold was chosen, and they treat alert fatigue as a system design failure — not a human problem.
