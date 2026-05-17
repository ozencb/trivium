---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Container Networking

Containers get network isolation through Linux kernel namespaces — each container has its own network stack (interfaces, routing table, iptables) invisible to others. But isolation alone doesn't help; containers need to reach each other and the outside world. That's where virtual interfaces and overlay networks come in.

**The core mechanism:** When a container starts, the runtime creates a virtual ethernet pair (veth pair) — two ends of a virtual cable. One end lives in the container's network namespace, the other in the host's. A bridge (like `docker0` or a CNI-managed bridge) connects all host-side veth ends, acting as a software switch. Each container gets an IP from a private subnet. Traffic between containers on the same host traverses this bridge; traffic leaving the host gets NAT'd through the host's real interface.

Cross-node traffic is harder. When container A on Node 1 needs to reach container B on Node 2, packets have to travel through the actual network — but the container IPs are private and meaningless to the underlying network. Overlay networks (VXLAN, Geneve) solve this by encapsulating the container-addressed packet inside a UDP packet addressed to the destination node. The receiving node unwraps it and delivers it. This is what Flannel, Calico in overlay mode, and Weave do.

**CNI plugins** are the glue. Kubernetes calls the configured CNI plugin whenever a pod starts, and the plugin is responsible for: creating the veth pair, assigning an IP from the cluster's pod CIDR, and programming the routes so other nodes know how to reach that pod. Different plugins make different tradeoffs — Calico in BGP mode avoids overlay overhead entirely by advertising pod routes to your actual network fabric, which is why it's preferred in bare-metal or cloud environments where you control routing.

**kube-proxy** handles Service IPs. A Service's ClusterIP isn't assigned to any real interface anywhere — it's a virtual IP that kube-proxy programs into iptables (or IPVS) rules on every node. When your app connects to `10.96.0.1:443`, the kernel intercepts it pre-routing and rewrites the destination to a real pod IP. DNS resolution (`my-svc.namespace.svc.cluster.local`) gives you the ClusterIP; iptables gives you load balancing and failover.

**Where this matters in practice:**

- **SRE:** Mysterious timeout between services often traces to a missing iptables rule (kube-proxy fell behind), MTU mismatch (VXLAN adds ~50 bytes overhead, breaking packets on networks assuming 1500 MTU), or a NetworkPolicy silently dropping traffic.
- **DevOps:** CNI plugin choice directly affects your cluster's network performance ceiling and security posture. Switching later is painful — it typically requires node drains.
- **Backend:** If your service does anything with source IPs (rate limiting, audit logs), understand that NodePort services SNAT by default, so you see the node IP, not the client IP. `externalTrafficPolicy: Local` fixes this at the cost of uneven load distribution.

Understanding this layer is the prerequisite for Service Mesh — which adds a sidecar to intercept exactly the same traffic flows you now understand.
