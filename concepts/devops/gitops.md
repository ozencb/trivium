---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## GitOps

GitOps takes Infrastructure as Code one step further: instead of using IaC as a *tool you run*, you use it as a *contract you maintain*. Git becomes the authoritative description of what should exist, and automated agents are responsible for making reality match it — continuously, not just at deploy time.

**The core mechanism**

The key shift from traditional IaC is the reconciliation loop. Tools like Argo CD or Flux run inside your cluster and constantly compare *desired state* (Git) against *actual state* (cluster). Any drift — whether from a manual `kubectl apply`, a node crash, or a botched manual rollback — gets detected and corrected automatically. You're not pushing changes to infrastructure; you're declaring them and trusting the loop to converge.

This inverts the deployment model. Instead of a CI pipeline with `kubectl` credentials SSHing into your cluster, the cluster *pulls* its own config from Git. Your CI system just merges PRs; the cluster handles the rest.

**Mental model**

Think of your cluster as a thermostat. Git is the temperature setting. The reconciler is the HVAC system — it doesn't care how the room got to the wrong temperature, it just keeps correcting until the setting matches. A traditional deploy pipeline is more like manually adjusting a space heater: fine until someone opens a window and nobody notices.

**Where this matters in practice**

For **DevOps**: the PR-based workflow becomes the audit trail for *everything*. Want to know who rolled back production at 2am? It's in Git history. Want to gate deploys on code review? PRs already do that. Rollback is `git revert` — no special tooling, no institutional knowledge required.

For **SRE**: drift detection is the underrated win. Production environments accumulate entropy — someone applies a hotfix directly, a Helm chart gets partially upgraded, a configmap gets edited in place. GitOps surfaces this as observable divergence rather than a mystery you discover during an incident. The reconciler either corrects it or alerts on it, depending on how you configure sync policy.

**Common pitfalls**

- **Secrets management is a separate problem.** GitOps doesn't solve how to keep credentials out of your repo — you'll need something like Sealed Secrets or External Secrets Operator alongside it.
- **Reconciliation conflicts with imperative workflows.** If your team still `kubectl apply`s directly, the reconciler will undo it. This requires real cultural adoption, not just tooling adoption.
- **Slow feedback loops.** If your reconciler runs every 3 minutes, that's how long deploys feel. Tune sync intervals and use webhooks for push-triggered syncs.

Reach for GitOps when you want audit trails, self-healing infrastructure, and a clear separation between "what CI does" and "what deploys do." Skip it for simple setups where the operational overhead outweighs the benefits.
