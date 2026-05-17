---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Property-based testing flips the script: instead of writing specific inputs and asserting specific outputs, you describe *invariants* — properties that must always hold — and let the framework generate hundreds of random inputs to try to break them. The payoff is that computers are creative at finding the weird edge cases you wouldn't think to write.

## The Core Mechanism

With example-based tests, you cover the cases you imagine. With property-based testing, you define a *contract* and a *generator*, and the framework does the rest.

A property looks like: "for all valid inputs X, this function must satisfy condition Y." The framework then generates 100 (or 1000) instances of X, runs your function, and checks Y each time. When it finds a failure, it *shrinks* the input — systematically simplifying it to find the minimal failing case so you're not debugging a 500-element list when a 2-element list also triggers the bug.

## Concrete Example

Say you're writing a `serialize`/`deserialize` pair. The invariant is: `deserialize(serialize(x)) === x` for all valid `x`. A handwritten test might check a few cases. A property test generates hundreds of values — including empty strings, unicode, nested objects, max-safe integers — and verifies round-trip fidelity across all of them. You'd likely catch a bug with `null` or `undefined` that you never manually thought to include.

Another classic: sorting. "The output must have the same elements as the input, in non-decreasing order, with the same length." That's a stronger specification than `sort([3,1,2]) === [1,2,3]`.

## Where It Earns Its Keep

**Backend:** Parsing, serialization, and data transformation functions are ideal candidates. Any function with a mathematical inverse (`encode`/`decode`, `encrypt`/`decrypt`, `compress`/`decompress`) should have a round-trip property test. It also shines for validating business rules — "total price must always equal sum of line items regardless of discount combination" catches bugs in discount logic that you'd never enumerate manually.

**Fullstack:** API contracts are a natural fit — properties like "any valid request body that passes schema validation must not return a 500" or "pagination must be consistent: page 2 offset must never contain items from page 1." State machine logic (think shopping cart, checkout flow) is another strong candidate: "applying then removing an item leaves the cart unchanged."

## When to Reach For It

Reach for property testing when the function's correctness is better described as a *relationship* than as specific input-output pairs. It's most valuable at boundaries: parsers, serializers, data pipelines, and anywhere your domain has invariants you can actually articulate. It complements, rather than replaces, example tests — use both.

The main pitfall: weak or trivially-true properties. "The output is not nil" isn't a useful invariant. The discipline is in writing properties that would actually *catch something*.
