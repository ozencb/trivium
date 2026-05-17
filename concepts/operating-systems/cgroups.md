---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Control Groups (cgroups)

cgroups are a Linux kernel mechanism for organizing processes into hierarchical groups and enforcing resource limits on those groups. They exist because the kernel needs a way to answer "how much CPU/memory/I/O should this group of processes get?" — a question that process-level scheduling alone can't answer when processes spawn children or you need to guarantee isolation between workloads.

**Core mechanism**

The kernel exposes cgroups through a virtual filesystem (typically mounted at `/sys/fs/cgroup`). Each directory in that hierarchy is a cgroup, and every process on the system belongs to exactly one cgroup per subsystem (called a *controller*). Controllers are the enforcement engines: `cpu` uses the Completely Fair Scheduler's bandwidth throttling, `memory` hooks into page fault handling and the OOM killer, `blkio`/`io` intercepts block layer I/O.

The critical invariant: limits are *hierarchical and additive downward but bounded upward*. A child cgroup cannot consume more than its parent allows, but its limit doesn't automatically inherit the parent's full quota — you set limits explicitly at each level. If you set a group to 2 CPUs, all descendants collectively share those 2 CPUs regardless of what their own limits say.

Two resource models exist: *hard limits* (memory.max — process gets OOM-killed when exceeded) and *soft limits* (cpu.weight — weighted fairness when contention exists, no enforcement when idle). These model two different SLO guarantees.

**Mental model**

Think of it like a budget hierarchy in a company. The kernel is the CFO with a fixed budget (total CPU cycles, RAM). Departments (top-level cgroups) get allocated slices. Teams within departments (child cgroups) subdivide further. A team can't spend more than its department's total — the constraint propagates downward. When the company is flush, no one notices the budget. Under pressure, the hierarchy enforces who gets what.

**Practical implications**

*For DevOps*: Every container you run (Docker, containerd, Kubernetes pods) maps to a cgroup. When you set `resources.limits.memory: 512Mi` in a K8s manifest, that becomes a `memory.max` write into the pod's cgroup. When a container gets OOM-killed unexpectedly, checking `/sys/fs/cgroup/<pod>/memory.events` tells you exactly how many times it hit the limit before dying.

*For SREs*: The `noisy neighbor` problem in multi-tenant systems is fundamentally a cgroup configuration problem. If a service is causing latency spikes for neighbors, `cpu.weight` and `cpu.max` (v2) let you guarantee a minimum share without starving them. The `memory.pressure` and `cpu.pressure` files (PSI — Pressure Stall Information) give you utilization signals that are far more actionable than raw usage percentages when debugging saturation.

cgroups v2 (unified hierarchy) replaced the fragmented v1 model where each controller was a separate tree — worth knowing since most modern distros default to v2 and the semantics differ meaningfully.
