---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Alerting

Alerting is the mechanism that converts metrics and SLO state into actionable signals — it's how your observability system stops being passive and starts demanding attention. Without alerting, you're flying with instruments but no warnings.

### The Core Mechanism

An alert is fundamentally a threshold rule evaluated against a time series. But the interesting engineering lies in *what* you threshold and *when* you fire.

The naive approach alerts on raw metrics: CPU > 80%, error count > 100. The problem is these are noisy and often meaningless in isolation. Modern alerting shifts toward alerting on **symptoms, not causes** — specifically on SLO burn rates.

Instead of "error rate exceeded 1%," you write: "We've consumed more than 5% of our monthly error budget in the last hour." That's a burn rate alert. At that pace, your budget runs out in ~20 hours — urgent, actionable, and directly tied to user impact.

Burn rate alerts have a multi-window structure: a fast window (e.g., 1h) catches sudden spikes, a slow window (e.g., 6h) catches slow burns. Both must fire together to reduce false positives. This pattern comes from the Google SRE Workbook and is worth understanding as the baseline.

### Concrete Example

Say your SLO is 99.9% availability over 30 days. That's roughly 43 minutes of allowed downtime. Your error budget is 0.1% of total requests.

A 14.4x burn rate means you'd exhaust the budget in ~50 hours. You'd want a page. A 1x burn rate means you're exactly on track — no alert needed. At 2x, you might want a ticket, not a page.

You configure: fire if the 1h burn rate > 14.4 AND the 6h burn rate > 6. This gives you high confidence the problem is real and sustained.

### Practical Scenarios

**SRE:** You own the alerting policy. You define severity tiers — page vs. ticket vs. dashboard annotation — based on burn rate magnitude. The discipline is keeping pages rare and high-signal so on-call engineers don't tune out.

**DevOps/Platform:** You're configuring alertmanager or similar routing. Key decisions: grouping (bundle related alerts to avoid notification floods), inhibition (suppress downstream alerts when upstream is down), and silencing during planned maintenance.

**Backend engineer:** Your service gets an alert integrated at deploy time. You need to understand whether your SLOs are defined tightly enough that a bad deploy will actually fire an alert before too much damage is done. If your alert only fires after 6 hours of burn, a bad 2am deploy could hurt real users for hours before anyone wakes up.

### The Real Discipline

Alerting quality degrades over time. Alerts get added, rarely get removed, and on-call engineers start ignoring pages they've been conditioned to believe are false positives. Treating alert fatigue as a first-class engineering problem — with regular reviews of alert-to-incident ratios — is what separates teams that have good alerting from teams that have a lot of alerts.
