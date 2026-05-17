---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Blameless Postmortem

When systems fail, the instinct is to find who broke it. Blameless postmortems reject that instinct on practical grounds: the engineer who made the mistake acted within a system that *allowed* the mistake to happen, and firing them doesn't fix the system.

### The Core Mechanism

The key shift is from "who caused this?" to "what conditions made this outcome likely?" This isn't soft thinking — it's stolen from aviation and medicine, where blame cultures demonstrably kill people by suppressing incident reporting. If engineers know a postmortem ends with punishment, they hide information, under-report near-misses, and you're flying blind on your actual failure rate.

A postmortem has a few concrete components: a **timeline** (reconstructed precisely, not rationalized), **contributing factors** (plural, almost always — rarely one root cause), **impact scope**, and **action items** with owners and due dates.

The action items are where most postmortems fail. "Be more careful" and "add monitoring" without specifics aren't action items — they're wishes. Good action items change the *system*: automated checks that prevent the mistake, alerts that catch it earlier, runbooks that give the next on-call engineer better options.

### Concrete Example

An engineer deploys a config change that drops the database connection pool size from 100 to 1, causing a 45-minute outage. Blame culture: engineer gets reprimanded. Blameless: the postmortem asks *why* that value could be set that low at all. Answer: no validation on the config field, no canary deployment, no automated load test in staging. Three action items that protect every future deployment, not just from this engineer.

### Practical Scenarios

**SRE:** You're writing postmortems for every incident above a severity threshold. The discipline here is resisting "human error" as a root cause — it's always a symptom. What made the human error possible?

**Backend:** After a data corruption bug, a postmortem might surface that your migration process has no dry-run mode, or that your staging data doesn't represent production cardinality. These are architectural findings, not personal failures.

**DevOps:** Runbooks that were outdated, alerts that fired too late or not at all, rollback procedures that required manual steps — postmortems expose gaps in your operational infrastructure.

### Where This Differentiates Senior Engineers

In design discussions, the tell is whether someone proposes controls *before* an incident. Blameless culture informs how you design systems: you assume humans will make mistakes (because they will), so you build in safeguards rather than relying on individual vigilance.

In interviews, articulating that blamelessness is an *information-collection strategy* — not just a culture value — shows you've internalized the mechanism, not just the buzzword.

The failure mode to watch: "blameless" gets conflated with "consequence-free." It isn't. Process accountability (was the deployment process followed?) is still fair game. Personal accountability for *intentional* negligence is still valid. The target is removing blame for good-faith mistakes made within a flawed system.
