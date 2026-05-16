---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Fuzzing

Fuzzing is automated testing where you bombard a program with randomly generated, malformed, or unexpected inputs to find crashes, hangs, and security vulnerabilities that structured test cases miss. Unlike property-based testing (which you already know), fuzzing doesn't assert correctness — it hunts for failures.

### The core mechanism

A fuzzer generates inputs through one of two approaches:

**Mutation-based**: take valid inputs and mutate them — flip bits, truncate bytes, insert nulls, repeat chunks. Start with `{"user": "alice"}` and produce `{"user": null}`, `{"user": "alice\x00extra"}`, `{"user": "AAAA...AAAA"}` (8MB string), etc.

**Coverage-guided** (what modern fuzzers like libFuzzer and AFL do): instrument the binary to track which branches execute, then bias generation toward inputs that hit *new* code paths. This is the key insight — random mutation alone is dumb; mutation that explores new branches converges on edge cases fast. The fuzzer builds a corpus of "interesting" inputs that maximizes coverage, then mutates those.

This is meaningfully different from property-based testing. PBT generates structured valid inputs and verifies invariants. Fuzzing generates *anything*, including structurally invalid inputs, and just watches for the process to die.

### Mental model

Imagine your parser as a maze. Property-based testing walks the maze by following known corridors quickly. Fuzzing throws a ball at the walls repeatedly — every time it finds a new room, it adds that spot to its "interesting positions" list and keeps bouncing from there. Over millions of iterations, it finds rooms the corridor-walkers never reach.

### Backend scenarios

Your HTTP API parses multipart uploads. Fuzzing will find: the `Content-Length` header that claims 2GB but sends 10 bytes, the boundary string containing `\r\n` in the middle, the encoding that's valid per spec but your library chokes on. These aren't things you'd write unit tests for — you don't know to look for them. Fuzzing finds the inputs that make your parser allocate unbounded memory or panic.

JSON/XML/YAML parsers, binary protocol decoders, image processing, compression libraries — anything that deserializes external data is high-value fuzzing territory.

### SRE scenarios

Fuzzing is how you find the inputs that cause 100% CPU or OOM-kills in prod before attackers do. If you're operating a service that processes user-supplied data (which is almost everything), a fuzzer running against a staging environment catches denial-of-service vectors. It's also essential after patching — a regression fuzzing run validates the fix didn't introduce new crash paths.

Infrastructure tooling benefits too: config file parsers, log processors, anything that ingests operator-controlled or third-party input.

### Where to start

Go has `go test -fuzz` built in. For C/C++/Rust, libFuzzer with sanitizers (AddressSanitizer, UBSan) is standard. For APIs, `boofuzz` and RESTler handle protocol-level fuzzing. The corpus you build compounds over time — previous crash-triggering inputs become seeds for future runs.
