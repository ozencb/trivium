---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Infrastructure Drift

Infrastructure drift is what happens when your IaC declarations and your actual running infrastructure silently diverge. The problem isn't the divergence itself—it's that you won't know about it until a deployment breaks or an incident exposes the gap.

### The core mechanism

IaC tools like Terraform or Pulumi operate on a declared state model: you describe what *should* exist, the tool reconciles it against what *does* exist, and applies changes. Drift happens in the spaces between those reconciliations. Someone SSHs into a box and tweaks an nginx config to unblock an incident. A cloud engineer manually bumps an RDS instance class to handle a traffic spike. A security team member opens a firewall rule directly in the console "just temporarily." None of these changes touch the IaC repo.

The state file (or remote state backend) now lies. It says the instance type is `db.t3.medium` when the actual instance is `db.r5.large`. The next `terraform apply` either silently reverts that change or errors out in a way that's hard to diagnose.

### Mental model

Think of your IaC as a snapshot of intent, not a live mirror of reality. Every out-of-band change widens the gap between the snapshot and the real world. Each drift event is low-cost in isolation but compounds: after six months of incident-driven manual changes, your "production environment" is an undocumented artifact that exists only in AWS's actual state—not in your repo. Reproducing it becomes archaeology.

### Where this bites in practice

**DevOps:** Drift makes environment parity a fiction. You think staging matches production because they share the same Terraform modules, but staging hasn't had six months of manual hotfixes applied to it. Bugs appear in production that don't reproduce in staging, and the root cause is a config value someone changed by hand in 2024.

**SRE:** Drift surfaces during incidents in the worst possible way. You're mid-outage, your runbook assumes a certain security group configuration, but the actual rules have been modified. Or you try to roll back a bad deployment with `terraform apply` and the plan includes unrelated reverts of manual changes that were load-bearing—and now you've made the incident worse.

### The fix isn't just discipline

Teams often try to solve drift with process ("no manual changes, ever") but that breaks down under incident pressure. The more durable approach is treating drift detection as a first-class concern: run `terraform plan` in CI on a schedule and alert when the plan is non-empty, use tools like `driftctl` or AWS Config rules to catch out-of-band changes, and treat the drift report as a signal worth investigating rather than a noise to dismiss. The goal isn't zero drift—it's knowing where you are.
