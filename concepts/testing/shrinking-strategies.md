---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Shrinking Strategies

When property-based testing finds a failing input, that input is usually a sprawling mess — a list of 847 elements, a string with random unicode, an integer in the millions. Shrinking is the engine's second job after finding the failure: systematically reduce that input to the smallest version that still breaks your property, so you can actually reason about the bug.

### The Core Mechanism

Shrinking isn't bisection or random guessing — it's guided search through an implicit "simpler" ordering defined per type. For integers, smaller means closer to zero. For lists, shorter and then element-wise simpler. For strings, fewer characters, then lower ASCII values. The engine takes the failing input, generates candidates "one step simpler," runs each against your property, and keeps the simplest one that still fails. It repeats this until no simpler candidate fails. The result is a local minimum — the smallest input the shrinker could find, not necessarily the globally smallest, but almost always illuminating.

The critical insight: this only works correctly if your property is *deterministic and pure*. If your test has side effects or depends on external state, shrinking will produce garbage — it'll simplify toward an input that fails for the wrong reason, or stop early because the state machine is now in a different position.

### Concrete Example

Say you're testing a serialization roundtrip: `deserialize(serialize(x)) == x`. Property-based testing finds a failure with a deeply nested object, 40 fields, several with null values, one with a 200-character string. Shrinking runs automatically and hands you: `{id: 0, name: ""}`. That's your bug — empty string serializes to something that deserializes differently. Without shrinking, you're staring at 40 fields and wondering where to start.

### Real-World Patterns

**Backend:** Invaluable when testing business logic that operates on complex domain objects — order processing, permission resolution, financial calculations. The failure case is almost never the full random object; shrinking exposes the one field or combination of fields that triggers the edge case. If you're testing a parser or state machine, shrinking will find the minimum token sequence that breaks invariants.

**Fullstack:** When testing API contracts or request/response consistency, shrinking cuts through the noise of randomized payloads. A property like "any valid request body produces a 2xx or 4xx, never 5xx" — when it fails, shrinking tells you exactly which field or combination is causing the server error, not a 50-field JSON blob you have to manually bisect.

### Common Pitfall

Custom types often need custom shrinkers. Most frameworks provide sensible defaults, but if you define a generator for a constrained domain (e.g., "a valid IBAN"), the default shrinker may produce values that violate your constraints, making shrinking terminate early or produce confusing results. When writing custom generators, always pair them with a shrinker that stays within the valid domain.
