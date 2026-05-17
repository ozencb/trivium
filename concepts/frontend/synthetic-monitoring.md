---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Synthetic Monitoring** is the practice of running scripted, automated interactions against your production (or staging) environment on a schedule—before real users hit a problem. Unlike Real User Monitoring (RUM), which captures what actually happened to real visitors, synthetic monitoring tells you what *would* happen to a user right now, giving you a ground truth that's fully under your control.

## Core Mechanism

A synthetic monitor is essentially a headless browser (Playwright, Puppeteer, or a managed service like Datadog Synthetics or Checkly) executing a script: navigate to URL, wait for element, click button, assert response. This runs from multiple geographic locations every N minutes. The result is a time-series of latency, availability, and assertion pass/fail—indexed against *your* infrastructure state, not user variance (device, network, browser cache).

The key insight is that you own the signal. RUM is noisy—users have slow phones, flaky 4G, browser extensions. Synthetic runs eliminate that variance. If your synthetic monitor degrades, it's your stack.

## Concrete Mental Model

Think of synthetic monitoring as a canary that flies your most important user journeys around the clock. You script the checkout flow, the login sequence, the dashboard load. Each run is a data point: did it complete? How fast? The moment a deploy breaks the add-to-cart button at 3am, your pager fires—not because a user complained, but because the canary died.

## Practical Scenarios

**Frontend**: You set a [performance budget](performance-budget) of 2.5s LCP on the product detail page. A synthetic monitor measures LCP on every deploy. When a new image carousel ships and LCP jumps to 4.1s, the monitor catches it before the feature flags roll out to 100% of users. This is the feedback loop that keeps performance budgets enforceable rather than aspirational.

**Fullstack**: You have an API-backed search feature. The synthetic script queries the endpoint directly and asserts p95 < 300ms. When a bad query plan sneaks in via a migration, the synthetic catches the latency spike within one polling cycle—before any user session is affected and before it shows up in your slow-query logs.

**SRE**: Multi-region synthetic checks running from us-east, eu-west, ap-southeast give you a global availability map. A CDN misconfiguration that only affects APAC users is invisible to US-based on-call engineers checking their browser—but the synthetic monitor in Singapore fires immediately.

## Why This Differentiates Senior Engineers

Junior engineers reach for synthetic monitoring reactively—after an outage. Senior engineers treat scripted journeys as first-class artifacts owned by the team, versioned alongside code, and mapped to SLOs. In design discussions, the question isn't "should we monitor this?" but "what's the minimum synthetic coverage that lets us deploy confidently at any hour?" That framing—monitoring as a deployment gate, not a dashboard—is what separates operational maturity from operational theater.
