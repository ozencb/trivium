---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Multi-stage Docker builds let you use multiple `FROM` instructions in a single Dockerfile, where each stage is an isolated image environment. The key: you can `COPY --from=<stage>` artifacts between stages, so your final image ships only what the runtime needs — not the compilers, SDKs, or source code that produced it.

The mechanism matters because image layers are additive and permanent within a stage. If you install `gcc` and then `RUN rm -rf /usr/bin/gcc`, the layer with gcc still exists in the image history — it just gets shadowed. Multi-stage sidesteps this entirely: stage 0's filesystem simply never becomes part of stage 1's base.

A Go service makes this concrete:

```dockerfile
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN go build -o server .

FROM debian:bookworm-slim
COPY --from=builder /app/server /usr/local/bin/server
CMD ["server"]
```

The `golang:1.22` image is ~800MB. The final image is ~80MB. The toolchain never ships. `COPY --from=builder` is the seam — it extracts exactly one file from an otherwise-discarded environment.

**Backend:** This is standard practice for compiled languages (Go, Rust, Java). For Python or Node it's still useful: run `pip install` (including gcc for native extensions) in a build stage, then copy only `site-packages` into a `python:3.12-slim` final image. You avoid shipping compilers or devDependencies while still being able to build native wheels.

**DevOps:** Smaller images mean faster node pulls during deploys and autoscaling, a reduced CVE surface (fewer binaries that scanners flag), and cleaner CI caching — dependency layers can cache independently from source layers. You can also `docker build --target builder` to extract just the build stage for testing without rebuilding from scratch.

**Pitfalls to know:**

- `COPY --from` copies by filesystem path only — use absolute paths, not relative ones that depend on `WORKDIR` context from the source stage.
- Environment variables set in the builder (`ENV`, `ARG`) don't carry over. Only files do.
- Build args passed to the final stage need to be re-declared with `ARG` even if they were defined earlier.
- Don't reach for this in local dev Dockerfiles where image size is irrelevant and the added complexity slows iteration.

Default to multi-stage for any production Dockerfile building a compiled artifact. For interpreted runtimes, add it when native extensions or devDependency bloat becomes measurable.
