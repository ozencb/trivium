---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Performance Budget

A performance budget is a hard constraint — not a guideline — that defines the maximum cost a feature is allowed to impose on user-facing metrics like bundle size, LCP, TTI, or TBT. The key word is *enforced*: budgets that live in a doc nobody reads aren't budgets, they're aspirations.

### The Core Mechanism

Budgets work by integrating metric thresholds into CI so a build fails when a violation occurs. Tools like Lighthouse CI, Bundlesize, or webpack-bundle-analyzer can gate a merge. The budget lives alongside the code, not in someone's head.

What makes this non-trivial is deciding *what to budget and at what granularity*. You can budget at the route level (the checkout bundle can't exceed 150KB gzipped), the metric level (LCP ≤ 2.5s on a simulated Moto G4 at 4G), or both. The granularity matters: a global JS budget lets one lazy-loaded route silently bloat while the initial bundle stays clean.

### Concrete Mental Model

Think of it like a memory allocator with a fixed pool. Every feature request to ship is actually a request to spend from that pool. Without a budget, every team says "our feature is critical" and the pool overflows — death by a thousand cuts. With one, the conversation shifts from "should we ship this?" to "what do we cut to afford this?" That's a productive engineering conversation.

### Frontend

You're building a dashboard and product wants to add a rich charting library. Without a budget, it ships. With one, CI flags that it adds 80KB above the JS budget. Now you're evaluating lighter alternatives (uPlot vs. Chart.js) or splitting the chart behind a dynamic import — a concrete, actionable constraint rather than a vague "keep things fast."

### Fullstack

Server-side rendering complicates this because TTFB, hydration cost, and JS payload all interact. A fullstack engineer needs to budget the *total* cost of a feature: the serialized server state injected into HTML plus the client bundle that hydrates it. A 50KB server payload + 80KB hydration bundle can blow LCP even if neither alone seems bad.

### Why This Differentiates Senior Engineers

Junior engineers think about performance after the fact. Midlevel engineers profile and fix regressions. Senior engineers prevent them structurally. In a design discussion, proposing a budget — and knowing *how* to set one based on user demographics (device class, connection type) rather than arbitrary numbers — signals you're thinking about performance as a system property, not a one-time optimization pass.

The real pitfall: budgets that are too tight become ignored (constant CI failures train teams to bypass them), and budgets that are too loose catch nothing. Calibrate against your actual 75th-percentile user, not a MacBook on Wi-Fi.
