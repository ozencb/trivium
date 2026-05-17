---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Modern CPUs speculatively execute instructions ahead of a branch by guessing the outcome — a misprediction flushes the pipeline, costing 15–20 cycles. In a tight loop over millions of iterations, that penalty compounds fast enough to dwarf the actual work being done.

The core idea: replace `if/else` control flow with arithmetic that deterministically produces the same result. Every instruction executes unconditionally; nothing to predict.

The canonical pattern uses boolean-to-integer coercion with bitmask selection:

```c
// Branching
int clamp(int v, int lo, int hi) {
    if (v < lo) return lo;
    if (v > hi) return hi;
    return v;
}

// Branchless
int clamp(int v, int lo, int hi) {
    int mask_lo = -(v < lo);   // 0xFFFFFFFF or 0x00000000
    int mask_hi = -(v > hi);
    return (lo & mask_lo) | (hi & mask_hi) | (v & ~mask_lo & ~mask_hi);
}
```

The comparison evaluates to 0 or 1; negating it in two's complement produces an all-ones or all-zeros mask; bitwise AND/OR selects the output. No branch exists for the predictor to get wrong.

**Backend scenarios where this pays off:**

*Sorting and filtering pipelines* — custom comparators in sort algorithms, or predicates applied to millions of rows in an analytics engine. Unpredictable data patterns make the branch predictor useless.

*Binary protocol parsing* — tight inner loops in Protobuf/FlatBuffer deserialization with many small conditionals. Branchless bit extraction can meaningfully cut parse latency at scale.

*Scoring/ranking systems* — recommendation or search ranking that evaluates millions of candidates per request. Branchless min/max/clamp in the scoring function is low-hanging fruit.

**The real pitfall**: branchless code is *slower* when the branch is highly predictable. If one path is taken 95% of the time, the CPU's branch predictor nails it almost always, and speculative execution is essentially free. Branchless eliminates that optimization while trading readability for nothing.

Also, don't assume the compiler isn't already there. With `-O2`/`-O3`, compilers frequently emit `cmov` (conditional move) instructions — branchless by nature — for simple comparisons. Check the assembly first (Compiler Explorer, `objdump`). Hand-rolling bitmask arithmetic when the compiler already generated `cmov` is pure noise.

The decision rule: profile, check branch predictor hit rate (via `perf stat`), and only reach for this when data is genuinely unpredictable and the loop is demonstrably hot.
