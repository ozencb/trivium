---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

eBPF lets you inject custom programs into the Linux kernel at runtime — without writing a kernel module, recompiling, or rebooting. The kernel verifies them for safety before execution, then JIT-compiles them to native bytecode. Think of it as the kernel gaining a plugin system with a strict security sandbox.

**The core mechanism**

eBPF programs attach to *hooks* — predefined points in kernel execution: syscall entry/exit, network packet ingress/egress, kprobes (arbitrary kernel function calls), tracepoints, and more. When the hook fires, your program runs synchronously in kernel context. Because it skips the user/kernel boundary, it avoids the overhead that makes traditional observability tools (strace, tcpdump) impractical in production.

The verifier is the critical piece. Before loading, the kernel statically analyzes your eBPF bytecode: no unbounded loops, no invalid memory access, bounded stack depth, all pointers checked. This is what makes the "sandboxed kernel code" promise real — you can't crash the kernel with a bad eBPF program the way you could with a module.

eBPF programs communicate via *maps* — typed key-value stores shared between kernel and userspace. A program running in the packet path can increment a counter in a hash map; your Go/Python userspace daemon reads it out every second. This is how tools like Prometheus exporters or flow logs get built on top of eBPF.

**Concrete mental model**

Imagine you want to track which processes are making outbound connections and to what IPs. Without eBPF: you'd either strace everything (brutal overhead), parse /proc/net/tcp (polling, not real-time), or audit via netfilter hooks (kernel module territory). With eBPF: attach to the `tcp_connect` kernel function, extract pid/comm/remote IP, write to a ring buffer map. Userspace reads events as they happen. Zero sampling, near-zero overhead, no code changes to the application.

**Where SREs and DevOps engineers hit this**

- **Cilium/Calico eBPF mode**: Kubernetes CNI plugins using eBPF replace iptables entirely for service routing. Debugging why a service mesh rule isn't applying often means understanding that `bpftool prog list` is your iptables-save.
- **Continuous profiling**: Tools like Parca or Pyroscope use eBPF perf events to sample CPU stacks across all processes fleet-wide. When you're chasing a mystery CPU regression, this is the answer.
- **Security tooling**: Falco, Tetragon, and similar runtime security tools hook execve/open/connect syscalls. Understanding eBPF explains why these tools can enforce policy without ptrace and without per-container agents.

**When not to reach for it**: If you're running kernels older than ~5.4, the feature set degrades significantly. And if your problem is solvable from userspace without performance constraints, the verifier learning curve isn't worth it. Raw eBPF is C with constraints — most people consume it through Cilium, bcc, or libbpf-rs rather than writing programs directly.
