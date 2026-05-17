---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Webhooks

Instead of your client asking "anything new?" on repeat, webhooks flip the model: the upstream service calls you when something happens. You register a URL, they POST to it. That's the entire contract.

### The core mechanism

When an event fires on the provider's side — a payment completes, a repo gets pushed to, a user signs up — they serialize the event payload and make an HTTP POST to your registered endpoint. Your server receives it, returns a 2xx, and the provider considers it delivered. Non-2xx or a timeout triggers retries, typically with exponential backoff.

This surfaces two non-negotiable requirements immediately:

**Idempotency on your end.** Retries are a feature, not a bug — the provider can't know whether your 500 meant "I processed it and crashed" or "I never touched it." You'll receive duplicates. Your handler must be safe to call multiple times with the same event. The standard approach: store the event ID on first receipt and short-circuit if you see it again.

**Signature verification.** The provider signs the payload (commonly HMAC-SHA256 with a shared secret) and sends the signature in a header. You recompute it server-side and reject anything that doesn't match. Without this, your endpoint is an open door for spoofed events — anyone who discovers the URL can trigger your payment fulfillment logic with a crafted body.

### Concrete mental model

Think of it like a restaurant buzzer. You don't stand at the counter asking "is my order ready?" — you leave your number and the kitchen calls when it's done. Webhooks are that call. The implicit cost: you have to be reachable when they call, and if you drop the buzzer in the toilet (your server is down), you need a way to catch up later.

### Backend

You're integrating Stripe. On checkout completion, Stripe POSTs to `/webhooks/stripe` with the payment intent payload. Your handler verifies the `Stripe-Signature` header, checks the event ID against your `processed_events` table, and if unseen, marks the order as paid and kicks off fulfillment. The whole thing should complete and return 200 within a few seconds — offload heavy work to a queue.

### Fullstack

You're building a CI/CD dashboard. GitHub posts push and PR events to your backend, which writes to the DB. Your frontend subscribes via SSE or WebSocket and shows live build status. Webhooks feed the data layer; your real-time transport handles the last mile to the browser.

### When to reach for this

Webhooks are the right tool when you need near-real-time event notification from a third party and polling would be wasteful or add unacceptable latency. They're not great when you need guaranteed exactly-once delivery without building infrastructure around it, or when your consumer can't expose a public HTTPS endpoint (in which case, look at a pull-based queue instead).
