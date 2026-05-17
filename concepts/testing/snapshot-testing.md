---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Snapshot Testing

Snapshot testing lets you lock in the output of a component or function and automatically detect when it changes — without writing explicit assertions about every field or attribute. It's particularly useful when the output is large, deeply nested, or structurally complex enough that manually asserting every property would be brittle or unrealistic to maintain.

**The core mechanism**

On first run, the test framework serializes the output (a rendered React tree, a JSON API response, a generated SQL query, anything stringifiable) and writes it to a `.snap` file. On every subsequent run, it serializes the output again and diffs it against that stored reference. Match = pass. Diverge = fail. The snapshot file is committed to version control, so changes are auditable and deliberate.

The key insight: you're not specifying *what* the output should be ahead of time — you're capturing *what it is* and then asserting it stays that way. This shifts the testing contract from "I know the shape" to "I know it didn't change."

**Concrete example**

You have a `formatInvoice(order)` function that returns a complex object. Writing assertions for every field is tedious and fragile. Instead:

```js
expect(formatInvoice(mockOrder)).toMatchSnapshot();
```

First run creates the snapshot. Future runs catch accidental regressions — say, a refactor that drops a `discount` field or changes a date format.

When the change is intentional (you added a new field), you run `jest --updateSnapshot` to accept the new baseline.

**In practice**

*Backend*: Snapshot the serialized output of complex data transformations — GraphQL resolvers, report generators, email templates, or config builders. Good for catching unintended changes in serialization logic.

*Frontend*: Snapshot rendered component trees (shallow or full DOM). Widely used in React/Vue/Svelte to catch unintended UI regressions. Most effective on "dumb" presentational components with stable, deterministic output.

*Fullstack*: Snapshot API responses in integration tests to catch contract drift before it breaks clients. Particularly useful when the response shape is complex and consumers are external.

**When to reach for it, and when not to**

Snapshots shine when: the output is large and complex, the semantics are hard to assert manually, and you want regression coverage without investment in deep assertions.

They go stale fast when: the component changes often by design, the output contains non-deterministic values (timestamps, random IDs), or developers get in the habit of blindly updating snapshots without reviewing diffs. That last failure mode is the most common — snapshots become a rubber stamp instead of a safety net.

Treat snapshot failures like failing tests, not inconveniences. If you're reflexively updating them, the test isn't doing its job.
