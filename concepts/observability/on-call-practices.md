---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## On-Call Practices

On-call is the operational contract between a team and the systems they own: someone is always reachable, accountable, and empowered to act. Done poorly, it's a tax that grinds down engineers; done well, it's a forcing function that drives genuinely better systems.

### The Core Mechanism

On-call isn't just "someone's phone rings." The real machinery is:

**Routing**: Alerts fire → paging rules decide who gets woken → escalation paths kick in if they don't respond. The design of this chain matters enormously. Alert on symptoms (high error rate, latency p99 spike), not causes (CPU at 80%)—causes are for dashboards, symptoms are for humans.

**Runbooks**: The on-call responder shouldn't need to reason from first principles at 3am. A runbook codifies: what this alert means, what to check first, what actions to take, and when to escalate. Good runbooks are actionable checklists, not prose. Bad ones are worse than none—they give false confidence.

**Rotations**: Primary/secondary shadow structures let you spread load while keeping a clear owner. Common failure: rotations that are too long (burnout) or too short (no accountability, no learning). Weekly primary is a reasonable default; 2-week rotations in small teams create unsustainable concentrations.

**Toil tracking**: Toil is repetitive manual work with no lasting value. Every on-call shift should track pages per shift and whether each page was actionable. More than ~2 pages per shift per week signals a problem. This data is the leverage to justify engineering investment in reliability over features.

### Mental Model

Think of on-call health as a feedback loop. Pages → responder takes action → either the system or the runbook improves → fewer pages next time. If that loop is broken (pages keep repeating, fixes are temporary, runbooks never get updated), you're running an extraction operation on your engineers.

### In Practice

**SRE**: You're often designing the paging policy and owning the toil metrics. Pushing back on "alert on everything" is your job. The question isn't "is this worth knowing?" but "is this worth waking someone up for?"

**Backend**: When your service goes on-call rotation, the design decisions you make now—observability, graceful degradation, clear ownership of failure modes—determine what your teammates deal with at 3am. On-call experience is often what separates engineers who design for operability from those who don't.

**DevOps/Platform**: Rotation design and escalation policy are your domain. The common mistake is letting product teams opt out of their own on-call. Services should be owned by the people who build them; platform's job is reducing the burden, not absorbing it.

### The Senior-Engineer Signal

In design discussions, raising operability proactively—"how will we know this is broken, and who responds?"—marks you as someone who thinks about the full lifecycle. In interviews, knowing that alert fatigue is a reliability failure (not just a morale problem) and that toil is measurable and actionable distinguishes you from engineers who treat on-call as an unfortunate fact of life rather than a system to optimize.
