---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Error Budgets

An error budget is the quantified amount of unreliability you're *allowed* to have before you're violating your SLO — it turns an abstract availability target into a concrete operational resource you can spend or conserve.

### The Core Mechanism

Your SLO defines the minimum acceptable reliability. The error budget is simply the complement: if your SLO says 99.9% of requests must succeed over 30 days, you have 0.1% of requests — roughly 43 minutes of downtime — to "spend." Every failed request, every slow response that misses your latency SLO, every deployment-induced blip draws from that budget.

The budget resets on a rolling window (or calendar period). This is key: it's not a one-time allowance. It's a continuous measure of how much cushion you currently have.

### Mental Model

Think of it like a checking account with a fixed monthly deposit. You start with $100 at the top of the month. Incidents withdraw from it. When it hits zero, you're in the red — your users are experiencing more unreliability than you promised. The goal isn't to end the month at $100 (that means you were too conservative), and it isn't to constantly overdraft. It's to spend the budget *intentionally*.

### Concrete Example

Say you run a payment API with a 99.95% success-rate SLO on a 28-day window. That's ~20 minutes of allowed downtime equivalent. You ship a bad deploy on day 5 that causes 12 minutes of elevated errors. You've spent 60% of your monthly budget in one incident. Now your team has to decide: do you risk another deploy this week, or do you freeze changes and let the budget recover? That decision is now data-driven, not a gut call.

### Practical Scenarios

**SRE:** Error budgets are the mechanism that enforces the tension between reliability and velocity. When the budget is healthy, the SRE team greenlit new deployments and experiments. When it's exhausted, they can enforce a feature freeze — not as a political fight, but as a contractual consequence of the SLO. It removes the "ops vs. dev" dynamic because the budget is shared.

**DevOps:** In CI/CD pipelines, budget awareness can gate releases automatically. Some teams integrate error budget burn rate into deployment policies: if you've burned >50% of the budget in the last 6 hours, the pipeline blocks non-critical deploys. This makes reliability a first-class concern in the delivery process rather than something handled reactively post-incident.

### What Makes It Powerful

The budget forces an honest conversation about risk. Reliability isn't free — it costs engineering time you could spend on features. The error budget makes that tradeoff explicit and quantitative. Teams that don't have error budgets tend to treat every incident as equally catastrophic or equally dismissible. With budgets, you can say "we burned 30% of our budget, that's notable but we're not in crisis" — which is a much healthier operating mode.
