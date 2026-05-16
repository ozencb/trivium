---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Container Networking

Containers get their own isolated network stack via Linux network namespaces, but they still need to talk to each other and the outside world — container networking is the set of mechanisms that make that possible without collapsing the isolation.

### Core Mechanism

Each container gets a network namespace: its own routing table, iptables rules, and network interfaces. The runtime creates a **veth pair** — a virtual Ethernet cable with two ends. One end lives inside the container's namespace (as `eth0`), the other end is attached to a bridge on the host (like `docker0`). Traffic leaving the container travels through this veth pair to the bridge, which acts like a virtual switch routing between containers on the same host.

For cross-host traffic, runtimes use **overlay networks** (VXLAN being the most common). Packets from container A are encapsulated in UDP and tunneled to the host running container B, where they're decapsulated and delivered. The containers see flat L2 addresses; the encapsulation/decapsulation is invisible to them.

DNS ties it together: in Kubernetes, each pod's `/etc/resolv.conf` points to the cluster DNS (CoreDNS), which resolves `service-name.namespace.svc.cluster.local` to a ClusterIP. That VIP doesn't correspond to a real interface — iptables/IPVS rules on each node intercept packets destined for it and DNAT them to one of the backing pod IPs.

### Mental Model

Think of it as a three-layer stack: **namespaces** give isolation, **veth + bridge** give local connectivity, **overlay or BGP routes** give cross-node connectivity. When you `curl http://my-service`, the chain is: DNS lookup → ClusterIP → iptables DNAT → backend pod IP → veth pair → container's eth0.

### Practical Scenarios

**SRE:** When a service is unreachable, the failure could be at any layer — DNS resolution, iptables rules, overlay tunnel, or network policy. `kubectl exec` + `curl` tests L7; `tcpdump` on the veth or the host bridge tells you if packets are arriving at all. CNI misconfiguration (e.g., IPAM exhausted pod CIDR) shows up as pods stuck in `ContainerCreating`.

**DevOps:** CNI plugin choice (Calico, Cilium, Flannel) affects your networking model. Calico uses BGP to advertise pod routes without encapsulation overhead; Cilium uses eBPF to bypass iptables entirely. This matters for latency-sensitive workloads and at scale where iptables rule churn becomes a bottleneck.

**Backend:** Localhost is not shared between containers in the same pod — they share a network namespace, so `127.0.0.1:8080` in a sidecar reaches your app container. But two separate pods on the same node are fully isolated. A missed assumption here causes subtle "works on my machine" bugs when someone hardcodes localhost expecting a shared network.

Understanding this mechanism is the foundation for service mesh: Envoy sidecars intercept traffic by redirecting it via iptables (or eBPF in Cilium) before it ever leaves the pod's network namespace.
