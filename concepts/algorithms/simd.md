---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

SIMD (Single Instruction, Multiple Data) lets a CPU operate on multiple values in one clock cycle by treating a wide register as a vector of smaller elements. Instead of adding two floats, you add eight floats in the same time — the throughput multiplier is real, and it's why JSON parsers, compression codecs, and ML kernels can be 4–16x faster than naive scalar code.

**The core mechanism**

Modern CPUs have wide registers — SSE gives you 128-bit, AVX/AVX2 gives 256-bit, AVX-512 gives 512-bit. You load data into these registers and issue a single instruction that operates on all lanes in parallel. A 256-bit register holds eight 32-bit floats; `_mm256_add_ps` adds eight pairs at once. The CPU doesn't serialize them — it literally does all eight additions in parallel in the execution unit.

This maps directly to what you already know about cache effects: SIMD is most effective when data is contiguous in memory (cache-line friendly), because loading a vector register from scattered memory pointers kills the benefit.

**Mental model**

Think of it like a spreadsheet formula vs. a loop. `=A1:A8 + B1:B8` is conceptually one operation across a range; a loop is eight separate operations. SIMD is the hardware equivalent of the range operation.

**Backend patterns**

The places you benefit most aren't always obvious:

- **Parsing and scanning**: Finding newlines, quotes, or delimiters in a byte stream. simdjson processes JSON at 3+ GB/s by using SIMD to classify 32 bytes per instruction. If you've ever wondered why simdjson dominates benchmarks, this is it.
- **Encoding/hashing**: Base64 encoding, CRC32, SHA variants all have SIMD-optimized paths. Your standard library likely uses them transparently, but rolling your own naive version will be 4–8x slower.
- **Columnar data processing**: Filtering or aggregating a typed column (int32[], float64[]) maps perfectly — each row in the column is a lane.

**Data engineering patterns**

Parquet and Arrow are built around SIMD-friendly columnar layout precisely because batch operations over a single column type saturate vector units. When you write a pandas/Polars aggregation, the reason Polars is faster isn't just Rust — it's explicit SIMD use across Arrow buffers.

**When to reach for it**

You don't usually write SIMD intrinsics directly. The realistic interventions are: (1) use a library that already does it (simdjson, highway, BLAS); (2) write inner loops that the compiler can auto-vectorize — sequential access, no data dependencies between iterations, simple types; (3) check whether your bottleneck is actually compute-bound before optimizing (profile first).

The most common pitfall: unaligned memory access and branchy inner loops defeat auto-vectorization silently. The compiler generates scalar fallback code and you never notice.
