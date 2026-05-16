---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Container Internals

A container is not a lightweight VM — it's a regular Linux process running with restricted visibility into the host system. The "isolation" is an illusion crafted by the kernel, not hardware virtualization.

### The core mechanism: namespaces + cgroups

Linux namespaces are the isolation primitive. When you `docker run`, the kernel creates a new process and assigns it to several namespaces:

- **PID namespace** — the process sees itself as PID 1, can't see host processes
- **net namespace** — gets its own network stack (interfaces, routing table, iptables rules)
- **mnt namespace** — has its own mount table; sees a different filesystem root via `chroot`
- **uts namespace** — its own hostname
- **ipc/user namespaces** — isolated IPC, optionally remapped UIDs

cgroups (control groups) handle the *resource* side: CPU shares, memory limits, I/O bandwidth. When Kubernetes sets `resources.limits.memory: 512Mi`, it's writing to a cgroup file like `/sys/fs/cgroup/memory/docker/<id>/memory.limit_in_bytes`.

The filesystem you see inside a container is a union mount (OverlayFS). Each layer in your Dockerfile is a read-only directory. At runtime, a thin writable layer sits on top — writes copy-up from the lower layers. This is why two containers from the same image share disk space but don't interfere.

### Mental model

Think of it as: the kernel is the only real kernel. Containers share it. Docker just calls `clone()` with namespace flags and then `execve()` into your entrypoint. You can verify this — `docker run` shows up as a regular process in `ps aux` on the host.

### Practical implications

**Backend**: When a service OOMs inside a container, it's because the cgroup memory limit was hit, not the host's physical RAM. The kernel's OOM killer fires against the cgroup, killing processes in that container. This is distinct from hitting virtual memory limits.

**SRE**: `docker stats` and `kubectl top` read from cgroup accounting, not `/proc` directly. If your container has no memory limit set, `free -m` inside shows the *host's* RAM — a common footgun where apps size their heap off that and exceed what's actually available.

**DevOps**: Port binding in containers (your prerequisite) works because each container has its own net namespace with a virtual eth interface. When you do `-p 8080:80`, Docker adds an iptables NAT rule on the host that forwards traffic from host port 8080 into the container's namespace on port 80. This is exactly the model Kubernetes builds on — each pod gets its own net namespace, and kube-proxy/CNI plugins manage the routing rules between them.

Understanding namespaces makes Kubernetes scheduling intuitive: the scheduler places pods, but namespace setup is the container runtime's job, which is why CNI plugins exist as a separate layer.
