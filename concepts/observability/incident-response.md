---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Incident response is the organizational muscle that turns production chaos into structured action — without it, every outage becomes a fire drill where the wrong people are paged, duplicate fixes conflict, and lessons evaporate. It matters because at scale, incidents are inevitable; your competitive advantage is how fast and cleanly you recover.

**The core mechanism**

The process has four phases that loop: detect → triage → mitigate → learn. Detection comes from your alerting stack firing on SLO breaches. Triage means classifying severity (usually SEV1–SEV4) which determines who gets paged and how fast. Mitigation is about restoring service — not fixing root cause. The "fix" often comes later; mitigation might be rolling back a deploy, rerouting traffic, or increasing a timeout. Learning happens in a postmortem, ideally blameless, where you identify contributing factors rather than scapegoating individuals.

Severity classification is where most teams underinvest. A SEV1 might mean "payment processing is down, all hands." SEV3 might mean "one dashboard is slow, oncall handles async." Getting this wrong in either direction — over-escalating or under-escalating — is expensive. Over-escalation burns trust; under-escalation burns users.

**Mental model**

Think of it like an ER triage system. The ER doesn't try to cure the underlying disease while the patient is coding — they stabilize first. Your job during an incident is to stop the bleeding. The postmortem is where you investigate why it happened.

**Practical scenarios**

*SRE:* You own the runbooks. You're writing the escalation policy and defining what "SEV1" means contractually. During incidents you're the incident commander — you coordinate, not necessarily fix. You ensure someone owns comms to stakeholders while engineers dig.

*Backend:* You're often the one paged because you own the service. Know your service's blast radius: what breaks if your service is down? Have a mental checklist — recent deploys, dependency health, DB connections. Postmortems are where you turn your debugging findings into permanent improvements (circuit breakers, better error budgets, runbook entries).

*DevOps/Platform:* You own the tooling that makes incident response fast — structured logging, distributed tracing, dashboards, deploy rollback automation. If oncall engineers have to SSH into prod and grep logs manually, that's a platform failure.

**What separates senior engineers**

In interviews and design discussions, junior engineers often conflate "fixing the bug" with "resolving the incident." Seniors understand these are separate concerns with different urgency and different owners. They also think about incident response as a system: runbooks need to be discoverable, alerts need actionable descriptions, and postmortems need follow-through tracking or they're theater. The question "how would you handle this going wrong in production?" should immediately trigger thoughts about severity, escalation, rollback strategy, and postmortem structure — not just the fix itself.
