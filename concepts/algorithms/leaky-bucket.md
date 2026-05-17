---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Leaky Bucket Algorithm

The leaky bucket enforces a **constant output rate** regardless of how requests arrive — bursty or steady. Unlike token bucket (which allows controlled bursts), leaky bucket is about traffic shaping: you accept that some requests will be dropped, and you prioritize uniformity at the output.

### Core Mechanism

Picture a bucket with a small hole at the bottom. Water (requests) pours in at any rate. Water leaks out at a fixed rate. When the bucket overflows, excess water is discarded.

Concretely: you maintain a queue (the bucket) with a fixed capacity. A background process drains it at a constant rate — say, 100 requests/second. Incoming requests either enter the queue or get rejected if it's full. The output side never exceeds your defined rate, period.

This is fundamentally different from sliding window or token bucket approaches. Those answer "is this request allowed right now?" Leaky bucket answers "when will this request be processed?" — it's a scheduler, not just a gate.

### Mental Model

Think of it as a conveyor belt with a fixed speed. You can pile items at the input end faster than the belt moves, but the belt doesn't speed up. Items fall off if the staging area fills up. What exits the other end is perfectly uniform — useful if the downstream system breaks under bursty load rather than sustained load.

### Backend Scenarios

If you're proxying to a third-party API that enforces rate limits based on time-averaged throughput (not burst capacity), leaky bucket on your side prevents you from overwhelming it during traffic spikes. A sudden flood of user requests becomes a smooth 50 req/s stream to the downstream service, rather than 500 req/s for one second that triggers a 429 cascade.

It also works well for protecting services with strict SLA requirements — database write endpoints, payment processors — where you'd rather queue and slow clients down predictably than let throughput spikes cause timeouts or deadlocks.

### SRE Scenarios

Leaky bucket is a traffic shaping primitive, not just rate limiting. In network infrastructure (where the name originates — RFC 2697), it's used to smooth egress traffic and prevent queue buildup inside the network. In service mesh configurations, you might use it to prevent a single misbehaving upstream from consuming all connection slots.

One gotcha: **latency silently increases under sustained load**. Unlike rejection-based approaches that fail fast, leaky bucket queues requests. If your bucket fills and drains at 100 req/s with 1000 queued requests, the last request waits 10 seconds with no indication to the caller. You need to pair it with queue depth monitoring and timeouts, or clients experience mysterious slowdowns instead of clean rejections.

### When to Reach For It

Choose leaky bucket when **output uniformity matters more than minimizing latency** — downstream service protection, traffic shaping to third-party APIs, or anywhere bursty throughput causes more damage than dropping requests. If you want to allow bursts while still bounding peak rate, token bucket is the better fit.
