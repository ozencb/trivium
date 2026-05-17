---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## HTTP Compression

HTTP compression is a content-encoding negotiation between client and server that shrinks response bodies before transmission. You use it because network I/O is usually the bottleneck, not CPU, and 70% smaller payloads mean faster time-to-first-byte and lower egress costs at essentially no architectural cost.

**The mechanism**

The client sends `Accept-Encoding: gzip, br, deflate` in the request header, advertising what it can decompress. The server picks the best algorithm it supports, compresses the body, and responds with `Content-Encoding: gzip` (or `br`). The client decompresses transparently before handing the body to application code. Neither side has to do anything special after the initial negotiation — browsers handle decompression automatically, and HTTP libraries on the backend handle it too.

Gzip is the safe default (universal support). Brotli (`br`) gets 15–25% better compression than gzip, especially on text, and is supported by all modern browsers — but requires HTTPS and may not be available in older HTTP clients or some CDN edge configurations.

**What compresses well vs. poorly**

Compression works on repetition. JSON, HTML, CSS, and JavaScript all compress extremely well because they're verbose and repetitive by nature. A 500KB JSON API response commonly becomes 80–120KB. Binary formats (JPEG, PNG, already-compressed video, protobuf with high entropy) don't compress meaningfully and sometimes get slightly larger — don't compress those.

**Practical scenarios**

*Backend:* If you're serving a JSON API with large response bodies (think: list endpoints, bulk exports), compression should be on by default. In Express: `app.use(require('compression')())`. In nginx: `gzip on; gzip_types application/json`. The per-request CPU cost is low enough that you only need to think about it at very high RPS, and at that scale you're probably terminating TLS at a reverse proxy that handles compression anyway.

*Frontend:* You don't configure request compression (request bodies aren't typically compressed), but you do benefit from it. The real leverage is ensuring your build pipeline emits pre-compressed assets (`.gz` and `.br` files) so the web server can skip runtime compression entirely. Vite and webpack both have plugins for this.

*Fullstack:* The most common pitfall is compressing at multiple layers — your app server compresses, then your CDN recompresses, then your load balancer does something weird. Check `Content-Encoding` in production response headers and make sure compression happens exactly once. Also: don't compress very small responses (< ~1KB). The overhead of the gzip header exceeds the savings.

**When to reach for it**

It should already be on. If you're standing up a new service and not running behind nginx or a CDN that handles it, add a compression middleware on day one. If you're diagnosing slow API responses, check whether `Content-Encoding` is present in the response — its absence on large JSON payloads is a quick win.
