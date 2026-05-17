---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Error Budgets

An error budget is the acceptable failure allowance derived directly from your SLO — if your SLO is 99.9% availability, your error budget is 0.1% of requests (or time) that *can* fail. The power isn't in the math; it's in what the budget enables: a shared, objective language between product and engineering for when to slow down and fix things.

**The core mechanism**

Your SLO target implicitly defines two states: budget remaining, and budget exhausted. Most teams set a consumption rate policy on top of this. If you're burning through budget 10x faster than expected (a "burn rate alert"), something is seriously wrong — not just "we had an incident," but "at this rate, we'll breach SLO before the month ends." This is what makes error budgets operationally useful rather than just a reporting metric.

The key insight is that the budget doesn't belong to ops or product — it belongs to the team. When there's budget to spare, you can move fast, deploy aggressively, run experiments. When it's nearly gone, reliability work takes precedence, full stop. No negotiation, no "just one more feature" — the budget made the decision for you.

**Concrete mental model**

Think of it like a sprint velocity buffer. If your team has 40 story points of capacity and you've burned 38 by Wednesday, you don't take on new work — you protect what's already in flight. Error budgets work the same way, but the "capacity" is system reliability and the "work" is user-facing failures.

**Where this matters in practice**

*For SREs:* Error budget policies formalize what happens post-incident. If a bad deploy burns 30% of the monthly budget in a weekend, there's a clear trigger for a deployment freeze or a mandatory post-mortem with engineering changes as prerequisites for resuming. Without the budget framing, these conversations are political; with it, they're just math.

*For DevOps engineers:* When you own CI/CD pipelines and release cadence, error budgets give you a principled argument for slowing down deployments. "We've consumed 80% of our Q2 error budget and it's May 10th" is a much stronger case for tightening rollout controls than "I feel nervous about our deploy frequency."

**Why it differentiates senior engineers**

Junior engineers think about reliability as binary: is it up or is it down? Mid-level engineers track SLOs. Senior engineers use error budgets to *govern trade-offs* — they can walk into a design review and say "this architecture decision trades 0.05% availability for 40% latency reduction; here's what that costs us in monthly budget." That framing turns reliability from a gut feeling into a first-class engineering constraint, which is exactly the conversation happening in staff-level design discussions.
