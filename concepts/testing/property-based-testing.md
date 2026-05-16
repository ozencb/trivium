---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Property-based testing flips the authorship of test cases from you to the machine: instead of writing specific inputs and expected outputs, you declare *invariants* that must hold for any input, then let a framework generate hundreds of random cases to try to break them.

## The Core Idea

In example-based testing, you think of cases to cover. In property-based testing, you describe *what's always true* — and the framework tries to falsify it. If it finds a failure, it *shrinks* the input to the minimal reproducing case and hands it to you.

The mental shift: stop thinking "what output does this input produce?" and start thinking "what relationships always hold between inputs and outputs?"

## A Concrete Example

Say you're testing a `sort` function. Instead of:

```js
expect(sort([3, 1, 2])).toEqual([1, 2, 3])
```

You declare properties:

```js
// The output length equals the input length
// The output contains the same elements as the input
// Each element is <= the next element
forAll(arrayOfIntegers, (arr) => {
  const result = sort(arr);
  return result.length === arr.length
    && isSorted(result)
    && hasSameElements(arr, result);
})
```

The framework might run this 1000 times with random arrays — empty, single-element, duplicates, negatives, already-sorted. You didn't think of those; the generator did.

## Why This Catches Different Bugs

Example-based tests verify the cases you imagined. Property-based tests probe the cases you didn't. The bugs that slip through aren't usually the cases you wrote — they're the edge cases you didn't think of: empty strings, maximum integers, Unicode edge points, arrays with a single repeated element.

## Practical Scenarios

**Backend:** Testing a JSON serializer/deserializer pair. The property is `deserialize(serialize(x)) === x` for any valid object. Or testing a rate limiter: "if N requests are sent within the window, at most N should be allowed through." You'd never hand-write enough permutations to shake out off-by-one errors in sliding window logic.

**Fullstack:** Testing API input validation. Declare "any string with length > 255 must return a 400." The framework generates adversarial strings — Unicode, null bytes, whitespace-only — that your handwritten tests wouldn't include. Or testing a form parser: "any input that parses successfully must round-trip through the API unchanged."

## The Practical Cost

The main friction is writing good generators and identifying useful properties. Not every function has obvious invariants. But for pure functions, data transformations, encoders/decoders, and anything with inverse operations — the pattern is almost mechanical.

Libraries: `fast-check` (JS/TS), `Hypothesis` (Python), `QuickCheck` (Haskell, the original), `propcheck` (Rust).
