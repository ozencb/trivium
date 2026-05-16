---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Synthetic Monitoring** is the practice of simulating user interactions against your production system on a schedule, so you detect failures and regressions before real users do. Unlike real-user monitoring (RUM), which tells you what happened, synthetic monitoring is proactive—it tells you what's happening right now, even at 3am with zero traffic.

## Core Mechanism

You write scripted "user journeys"—login, add to cart, checkout, whatever matters—and a monitoring agent executes them from external infrastructure (often multiple geographic locations) at fixed intervals. The agent measures wall-clock time for each step, captures screenshots on failure, and fires alerts when things break or degrade past a threshold.

The key distinction from uptime pings: a 200 from your server doesn't mean your app works. Synthetic monitoring actually runs your JavaScript, waits for renders, clicks buttons, and validates that the right content appeared. It catches a broken checkout flow that returns 200 with a blank modal just as well as a 500.

## Mental Model

Think of it as hiring a robot QA engineer who runs your smoke test suite against prod every five minutes. The robot doesn't care that it's 2am or that there's no traffic. It cares that the "Place Order" button is still clickable and the confirmation page loads in under 2s.

## Practical Scenarios

**Frontend:** You set a performance budget for LCP < 2.5s on your product listing page. Deploy goes out Friday afternoon. Synthetic monitoring catches that LCP jumped to 4.1s (a mis-configured lazy-load attribute shipped) within 10 minutes—before your weekend traffic surge hits.

**Fullstack:** Your API gateway occasionally returns stale cached responses that make the dashboard appear to load but show no data. Uptime checks pass, error rates look fine. A synthetic script that logs in, loads the dashboard, and asserts `document.querySelectorAll('.metric-card').length > 0` catches this in the next polling cycle.

**SRE:** You're running a multi-region deployment. Synthetic monitors from AWS us-east, eu-west, and ap-southeast give you per-region health as a baseline. During an incident, you immediately know whether it's a global outage or a regional routing issue—no need to wait for users to complain from specific regions.

## The Performance Budget Connection

Synthetic monitoring is how performance budgets get enforced in production rather than just in CI. You set the budget as a threshold, the synthetic runner measures against it continuously, and you get alerted the moment real production diverges from the contract you defined. Without synthetic monitoring, budgets tend to erode silently between releases.

Common tools: Datadog Synthetics, Checkly, New Relic Synthetics, or self-hosted Playwright scripts on a cron with a metrics sink.
