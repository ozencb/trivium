---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Kubernetes Networking Model

Every pod in a Kubernetes cluster gets its own IP address, and any pod can reach any other pod at that IP directly — no NAT, no port mapping, no "what host is this running on." This flat network model is the foundational contract Kubernetes makes, and everything else (Services, Ingress, NetworkPolicy) is built on top of it.

### The core mechanism

Kubernetes doesn't implement networking itself — it delegates to a CNI (Container Network Interface) plugin via a spec. When a pod is scheduled onto a node, the kubelet calls the CNI plugin, which is responsible for:

1. Assigning the pod an IP from a pre-allocated block (often per-node CIDR ranges)
2. Wiring up routing so traffic to that IP reaches the right node
3. Bridging the pod's network namespace to the host

How CNI plugins accomplish step 2 varies dramatically. Flannel uses a VXLAN overlay — it encapsulates pod-to-pod packets inside UDP, sending them between nodes' physical IPs. Calico instead programs host routing tables directly (BGP or kernel routes), so packets travel without encapsulation overhead. Cilium uses eBPF to intercept and route packets in the kernel, bypassing iptables entirely.

### Mental model

Think of every node as a router with a dedicated subnet (`10.244.0.0/24` for node A, `10.244.1.0/24` for node B). Pod IPs are addresses within those subnets. The CNI plugin's job is to make sure the inter-node routing table knows which physical node owns which subnet. A packet from pod A to pod B hits the host's routing table, gets forwarded to node B's IP, and node B delivers it to the right network namespace.

### Where this matters in practice

**For SREs:** When pod-to-pod latency spikes, the CNI layer is often the culprit. Overlay networks add measurable overhead (VXLAN encapsulation adds ~50 bytes per packet, plus encap/decap CPU cost). On high-throughput services, switching from Flannel to Calico in BGP mode or Cilium in eBPF mode can cut latency meaningfully. Also, MTU mismatches between the overlay and the underlying network are a classic silent killer — packets get fragmented, TCP performance degrades, nobody immediately suspects the CNI.

**For backend engineers:** The flat IP model means service discovery doesn't require port coordination across hosts. You can bind to the same port in every pod without conflicts. It also means network debugging feels closer to local debugging — `curl <pod-ip>` from another pod just works, which is useful when tracing issues that only manifest in-cluster.

**For DevOps:** CNI choice affects NetworkPolicy support (not all plugins enforce it), IPv6 support, and integration with cloud provider load balancers. On managed clusters (EKS, GKE, AKS), the default CNI integrates with VPC routing — pod IPs are routable from outside the cluster, which simplifies direct pod access from other VPC resources but consumes more IP addresses.

The most common pitfall is exhausting IP space: if each node gets a `/24` and your VPC CIDR is small, you hit limits faster than expected.
