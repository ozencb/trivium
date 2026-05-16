---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Chaos Engineering is the practice of deliberately injecting failures into a production system to surface weaknesses before they surface on their own. The core premise: a system that has never been stressed under real failure conditions isn't reliable—it's just untested.

## The Core Idea

Most reliability work is reactive: something breaks, you fix it, you add a test. Chaos Engineering flips this. You define a **steady-state hypothesis** ("p99 latency stays under 200ms and error rate stays below 0.1%"), then deliberately break something and observe whether the system holds. If it does, you've gained confidence. If it doesn't, you've found a gap before a real incident did.

The mechanism isn't random destruction—it's controlled experimentation. You vary one thing at a time: kill a pod, inject network latency, drop a percentage of requests, simulate a dependency timeout. You measure the blast radius. You stop if the system degrades beyond acceptable bounds.

This is where your circuit breaker and bulkhead knowledge matters directly: chaos experiments often *validate* that these patterns actually work as expected. You might have a circuit breaker configured in code, but have you verified it actually opens under load and that upstream services degrade gracefully? Chaos Engineering is the empirical test.

## Concrete Mental Model

Think of it like fire drills. A fire alarm going off in an actual fire is too late to find out that half the staff didn't know where the exits were. You run drills during normal hours, observe the gaps, and fix the process. Chaos Engineering is the fire drill for your distributed system.

Netflix's Chaos Monkey is the classic example—it randomly terminates EC2 instances in production during business hours. The goal wasn't destruction; it was forcing engineers to build systems that assumed instance death was normal.

## Practical Scenarios

**SRE:** You've defined SLOs, but how confident are you they hold during partial failures? A chaos experiment that kills one AZ while measuring your error budget gives you data, not assumptions. You can also use it to validate runbooks—does the on-call response actually recover the system in time?

**DevOps:** Chaos experiments integrate into deployment pipelines. After a blue-green cutover, you can run a lightweight chaos suite against the green environment before fully shifting traffic. If a new service version can't survive a Redis timeout without degrading, better to know before 100% rollout.

**Backend:** Dependency failures are the most common real-world cause of cascading issues. Injecting latency on your database connection pool or making an upstream API return 503s lets you verify your fallbacks, timeouts, and error budgets behave as designed—not just as coded.

## Starting Point

Don't start in production. Start in staging with a narrow, well-defined experiment. Define your steady state first. The value isn't in the chaos—it's in the measurement.
