---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

SLOs, SLIs, and SLAs give you a vocabulary for expressing reliability as a constraint rather than a wish. The real value isn't the acronyms—it's that they force you to instrument what you actually care about and then hold engineering decisions accountable to that measurement.

**The mechanism**

An SLI (Service Level Indicator) is a ratio: good events / total events over a window. "Requests completing in under 200ms" is not an SLI—"the fraction of requests completing in under 200ms" is. This distinction matters because ratios are comparable across traffic volumes and time windows. Your SLI is what you can observe right now.

An SLO (Service Level Objective) is a target applied to an SLI: "99.9% of requests complete in under 200ms over a rolling 28-day window." This is an internal commitment your team makes to itself. It defines the boundary between normal degradation and something worth waking someone up for.

An SLA (Service Level Agreement) is an SLO with a penalty clause—legally or contractually binding. Typically your SLA target is softer than your SLO target, giving you a buffer before you breach a contract. If you're operating at 99.9% internally and your SLA promises 99.5%, a bad week won't trigger a customer credit.

**Mental model**

Think of error budgets as the derived quantity that makes all of this actionable. If your SLO is 99.9% over 30 days, you have roughly 43 minutes of budget to spend on failures. That budget frames feature velocity vs. reliability as a concrete tradeoff: every risky deploy spends budget; every incident drains it. When the budget runs low, the team slows deploys—not because someone issued a mandate, but because the math says so.

**Practical scenarios**

*SRE:* Error budget policies are how SRE teams avoid the reliability-vs-velocity death match. Burn rate alerts (consuming budget 2x faster than expected) give early warning before you're close to SLO breach.

*Backend:* Choosing SLIs is the hard part. Latency at p99 vs p50 tells different stories—p50 can look healthy while p99 is on fire. Availability measured at the load balancer hides errors that the load balancer absorbs. Good SLI selection means measuring the signal closest to the user's actual experience.

*DevOps:* SLOs justify infrastructure investment to non-engineers. "We're at 99.7% against a 99.9% SLO, and the gap traces to this queue bottleneck" is a tractable business conversation. "We need more reliability" is not.

**Where engineers go wrong**

Setting SLOs based on historical performance rather than user need is the most common trap—you're just codifying your current mediocrity. The other is treating SLOs as a ceiling rather than a target: exceeding your SLO is fine, but it also means you might be over-investing in reliability and underinvesting in features.

In design reviews, an engineer who asks "what's the SLI for this new dependency?" signals they're thinking about observability and blast radius from the start, not retrofitting it later.
