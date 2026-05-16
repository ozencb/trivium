---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Shrinking Strategies

When property-based testing finds a failing input, shrinking automatically reduces it to the *minimal* counterexample — the smallest input that still triggers the failure. Without it, you'd be handed a 500-element list to debug when a 2-element list would expose the same bug.

### The Mechanism

After a failure, the framework doesn't just stop. It enters a shrink loop:

1. Generate "smaller" candidates from the failing input
2. Run the property against each candidate
3. If a candidate still fails, it becomes the new baseline
4. Repeat until no further reduction fails

What "smaller" means depends on the *shrink strategy* for each type. Integers shrink toward zero. Lists shrink by dropping elements or shrinking individual elements. Strings shrink toward the empty string, then toward simpler characters.

For a custom type — say, a `Request` record — you define the strategy yourself: try removing optional fields, reduce numeric ranges, substitute enum variants with simpler ones first.

### Concrete Example

You're testing a custom sort comparator with the property `sort(sort(xs)) == sort(xs)`. The framework generates `[42, -3, 17, 8, 0, -1, 5, 99]` as the first failing input. Shrinking progressively removes elements and simplifies values until it lands on `[-1, 0]` — the minimal case that exposes your off-by-one in the negative-number branch. You get a signal in 2 numbers instead of 8.

### Where Strategies Actually Matter

**Backend (API / data processing):** When testing a JSON parser or request validator, the first failure might be a deeply nested 40-field object. A well-defined shrink strategy on your input type will reduce it to the exact field combination that breaks validation. Without a custom shrinker, you might get a minimal *size* but not a minimal *structure* — still too noisy to reason about.

**Fullstack (DB query builders, ORMs):** Testing filter combinations against a query builder benefits enormously from shrinking. If your ORM generates bad SQL for some filter predicate combination, the shrinker can reduce `[createdAt, status, userId, tags, limit]` down to `[status, tags]` — isolating the join logic that's broken.

### The Strategy Part

The "strategy" isn't magic — it's a function you write (or the framework infers) that, given a failing value, produces a list of "simpler" candidates to try. The key insight: **the order of candidates matters**. Prioritize structurally simpler values (empty containers, zero, null) before numerically smaller ones. A shrinker that tries `[]` before `[1]` before `[1, 2]` converges faster than one shrinking element-by-element.

Frameworks like Hypothesis and fast-check have built-in shrinkers that handle most cases automatically. When you're defining custom generators, defining the paired shrinker is what separates "found a weird test case" from "found the exact bug."
