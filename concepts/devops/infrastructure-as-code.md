---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Infrastructure as Code

IaC means your servers, networks, databases, and load balancers are defined in source files—committed, reviewed, and versioned like application code. The core problem it solves is *configuration drift*: when infrastructure is provisioned manually, environments diverge silently over time, and nobody knows what "production actually looks like" without SSHing around and hoping.

**The core mechanism**

Tools like Terraform maintain a *state file*—a snapshot of what infrastructure currently exists—and compare it against your declared desired state. When you run `terraform apply`, it computes a diff (the "plan") and executes only the delta. This is declarative, not imperative: you describe the end state, not the sequence of steps to get there. Pulumi takes the same model but lets you write that declaration in a real programming language, which matters when your infra has logic (loops, conditionals, module composition).

The state file is the sharp edge here. It's ground truth. If someone manually changes a resource outside Terraform, the state diverges and your next apply can destroy or conflict with real infrastructure. State locking (via S3 + DynamoDB, Terraform Cloud, etc.) prevents concurrent apply races, and remote state is non-negotiable in team settings.

**Mental model**

Think of it like a migration system for infrastructure. Just as database migrations let you evolve schema reproducibly across environments, IaC lets you evolve infra reproducibly. Your staging environment is the dry run; production is the apply. You can diff, review, and roll back.

**Where it matters in practice**

- **Backend:** When you own the deployment pipeline—spinning up RDS instances, Redis clusters, ECS services—IaC means a new engineer can stand up the full stack from scratch in minutes. It also means you can delete staging on Friday and recreate it Monday without tickets.

- **SRE:** Post-incident, IaC is your proof that a config change caused the outage—the PR is right there. It also enforces policy: no security group opens port 22 to 0.0.0.0/0 without a code review.

- **DevOps:** Multi-environment parity becomes a module parameter, not a prayer. `var.environment = "prod"` vs `"staging"` is the only difference between environments.

**Common pitfalls**

- Treating state as disposable—it isn't. Losing state against real infrastructure is painful.
- Mixing IaC with manual changes. Pick one. Manual changes get overwritten.
- Monolithic root modules. Large state files mean large blast radii on every apply. Split by lifecycle and ownership.

**Why senior engineers care**

In design discussions, IaC fluency signals you think about operational correctness, not just feature delivery. You ask: "how does this get deployed consistently?" and "what happens when someone needs to reproduce this environment?" Those questions separate people who ship features from people who own systems.
