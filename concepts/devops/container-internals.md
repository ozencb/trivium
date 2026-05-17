---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Container Internals: Namespaces and Cgroups

Containers are not lightweight VMs — they're processes running on the host kernel with carefully scoped visibility and resource budgets. The two Linux primitives that make this work are **namespaces** (what a process can see) and **cgroups** (what a process can use).

### Namespaces: Scoped Visibility

A namespace wraps a global resource and presents each process with its own isolated view. Linux has several:

- **pid**: process sees its own PID 1, can't signal processes outside the namespace
- **net**: private network stack — own interfaces, routing table, iptables rules
- **mnt**: own filesystem tree (this is how `chroot` fits in — layered on top)
- **user**: remaps UIDs, so container root (0) maps to an unprivileged host UID
- **uts**: own hostname
- **ipc**: isolated shared memory and message queues

When you run `docker run`, the runtime (`runc`) calls `clone()` with these namespace flags, forking a child that inherits a stripped view of the world. The child thinks it's alone; the host kernel knows otherwise. Crucially, **no kernel is copied** — the container shares yours.

### Cgroups: Resource Accounting and Limits

Cgroups (control groups) are a kernel accounting hierarchy. You assign processes to a cgroup and set limits: CPU shares, memory cap, I/O bandwidth, PIDs. The kernel enforces these at scheduler and allocator level.

A memory-limited container that tries to allocate beyond its cgroup ceiling gets an OOM kill — not the host, just that cgroup's processes. This is how `--memory=512m` actually works, and why a misconfigured limit can cause mysterious OOM crashes with no host-level symptoms.

### Mental Model

Think of a container as: **a process tree + a namespace bundle + a cgroup leaf**. The filesystem (layers, overlay mounts) is separate — it's just how the root namespace gets populated. The "container" abstraction is the runtime stitching these three primitives together.

### Why This Matters in Practice

**Backend**: If your service leaks memory, the cgroup OOM killer terminates it. Understanding cgroup hierarchies explains why Kubernetes's `requests` vs `limits` distinction exists — requests influence scheduling (which node), limits set cgroup caps (enforcement).

**SRE**: Container breakouts almost always exploit shared kernel surface — a `ptrace` vulnerability, a misconfigured user namespace, a privileged mount. Knowing that containers share the kernel makes you correctly skeptical of "just run it in a container" as a security boundary without `seccomp`, `AppArmor`, or user namespace hardening.

**DevOps**: Namespace leaks (e.g., host network mode) silently remove isolation. Seeing `--net=host` in a Dockerfile should trigger immediate scrutiny — that container shares the host's network namespace entirely, defeating a significant portion of the isolation model.

The senior-engineer signal in interviews: knowing that `pid` namespace isolation is why you need a proper init process (`tini`, `dumb-init`) inside containers, because PID 1 is responsible for reaping orphaned child processes — and without it, zombies accumulate.
