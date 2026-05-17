---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Linux Namespaces

The kernel's process model has always had a problem: global state. PIDs, network interfaces, mount tables, user IDs—these are system-wide tables, and every process sees the same ones. Namespaces solve this by making those tables per-process (more precisely, per-namespace), so a process can have a completely coherent but isolated view of the system without the kernel needing to run a separate OS instance.

**The core mechanism**

A namespace is a kernel object that wraps a specific resource domain. The kernel maintains multiple instances of that domain simultaneously. When you call `clone()` with flags like `CLONE_NEWPID` or `CLONE_NEWNET`, the new process gets a fresh instance of that domain rather than inheriting the parent's. The original global view still exists—it's just one namespace among many.

There are seven namespace types:

| Namespace | Isolates |
|-----------|----------|
| `pid` | PID number space |
| `net` | Network stack (interfaces, routes, iptables) |
| `mnt` | Mount table |
| `uts` | Hostname and domain name |
| `ipc` | SysV IPC, POSIX message queues |
| `user` | UID/GID mappings |
| `cgroup` | cgroup root |

The critical invariant: namespaces are hierarchical for PIDs and users, flat for the rest. A process in a PID namespace always has *two* PIDs—its namespace-local one (often 1) and its host-visible one. The host can see everything; a containerized process cannot see out.

**Mental model**

Think of it like virtual memory, but for kernel resource tables instead of address spaces. Just as the MMU lets each process believe it owns the full address space—while the kernel manages the real physical pages behind the scenes—namespaces let each process believe it owns the full PID tree, the full network stack, and so on. The kernel maintains the mapping and enforces the boundary.

**Why this matters for devops/SRE**

When you `kubectl exec` into a pod and run `ps`, you see only the processes in that PID namespace. But on the node, `ps aux` shows the same processes with their host PIDs—because the host is in the root namespace. This is why a container's PID 1 is your app binary, not `systemd`.

Network namespaces explain CNI plugins: each pod gets its own `net` namespace (empty at creation), and the CNI plugin wires a veth pair between it and the host, then programs routes and iptables rules inside that namespace. Debugging pod networking with `ip netns exec` drops you directly into that namespace.

`nsenter` is the escape hatch SREs reach for when a container is too minimal to debug—it lets you enter a running process's namespaces from the host and bring your own tools with you.
