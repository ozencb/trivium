---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Capacity Planning

Capacity planning is the practice of forecasting when your system will run out of headroom — before it actually does. Unlike reactive scaling, it gives you lead time to provision infrastructure, renegotiate vendor limits, or redesign bottlenecks before users feel it.

### The Core Idea

Start with a growth signal: requests/sec, active users, data volume, whatever drives your resource consumption. Fit a trend (linear, exponential, seasonal) to historical metrics, then project forward. The critical output isn't "we need more servers" — it's "at current growth, we hit 80% CPU on the auth service in ~11 weeks, and that's where p99 latency starts climbing." That 11-week horizon is what makes planning possible.

The subtle part: resources don't degrade linearly. A queue that's fine at 70% utilization often collapses at 85% because variance spikes. Database connection pools, thread pools, memory — they all have nonlinear failure modes. Capacity planning accounts for this by targeting a utilization ceiling (often 60-70%), not 100%, and working backward to when you'll breach it.

### Concrete Mental Model

You have a load test showing your service saturates at 10k RPS. Current peak is 4k RPS, growing ~15% month-over-month. Simple math says you have ~6 months. But: that assumes uniform load. Add seasonality (Black Friday, end-of-quarter spikes), and your effective ceiling might be breached much sooner under a 3x traffic spike. Capacity planning forces you to model both the baseline trend *and* the spike multiplier.

### Practical Scenarios

**SRE:** You own an autoscaling group, but autoscaling has limits — instance quotas, warm-up latency, downstream dependencies that don't scale as fast as your compute. Capacity planning tells you when autoscaling alone stops being sufficient and you need pre-provisioned capacity or architectural changes.

**Backend:** A new feature launches that changes query patterns. Instead of just running load tests, you project: if this feature gets 10% adoption in month one, 40% by month three, what does that do to your DB read replicas? Senior engineers build this projection into the launch plan, not as an afterthought.

**DevOps/Platform:** Managed service limits (RDS max connections, ElasticSearch shard count, Kafka partition limits) often can't be scaled instantly. Capacity planning surfaces these hard limits early enough to migrate or re-architect — not during an incident.

### Why It Differentiates Senior Engineers

Junior engineers think about "does it work now." Capacity planning is the discipline of asking "when does it stop working, and what's our runway?" In design reviews and interviews, the ability to quantify headroom — and identify *which* bottleneck will constrain you first — signals that you've actually operated systems under pressure, not just built them.
