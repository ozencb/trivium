---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CORS (Cross-Origin Resource Sharing)

Browsers enforce a same-origin policy by default: a script loaded from `app.example.com` cannot read responses from `api.example.com`. CORS is the negotiation protocol that lets servers opt specific origins back in — without it, the modern web's split between frontend hosts and API hosts would be impossible.

### The Mechanism

Two request paths matter:

**Simple requests** (GET/POST with standard headers and form-encoded/plain-text bodies): the browser sends the request with an `Origin` header, the server responds normally, and the browser checks `Access-Control-Allow-Origin` before exposing the response to your JavaScript. If the header is missing or doesn't match, the response is silently dropped — the request *did* reach the server.

**Preflighted requests** (anything with custom headers, JSON content-type, or non-standard methods): the browser fires an OPTIONS request first. The server must respond to that preflight with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` before the browser sends the real request. This is the one that trips people up — an API that handles POST but ignores OPTIONS will break preflight silently.

The critical mental model: **CORS is enforced by the browser, not the server.** A `curl` or Postman request sees nothing. Your API is not "protected" by CORS — a malicious server-side script still hits it freely. CORS only governs what browser-loaded scripts can read back.

### Common Pitfalls

`Access-Control-Allow-Origin: *` breaks the moment you add `credentials: 'include'` to a fetch. Browsers explicitly forbid wildcard + credentials — you must echo back the specific requesting origin and set `Access-Control-Allow-Credentials: true`. This combination frequently leads to the "fix": dynamically reflecting whatever `Origin` header arrives. That's a security hole — always maintain an allowlist.

Forgetting OPTIONS handling is probably the most common backend bug. Your framework's CORS middleware handles this; rolling it by hand is where things go wrong.

### Practical Angles

**Backend:** Configure CORS at the framework level (Express `cors()`, FastAPI `CORSMiddleware`, etc.) rather than manually on each route. Treat your allowed-origins list like an allowlist — don't be lazy with `*` on APIs that handle auth.

**Frontend:** A CORS error in the browser console means the response was blocked, not that the request failed to send. Check the Network tab — you'll likely see the response sitting there with a 200. In local dev, use your bundler's proxy (`vite.config.ts` → `server.proxy`) to route API calls through the same origin, bypassing CORS entirely during development.

**Fullstack:** The canonical case — React on `app.example.com`, API on `api.example.com` — requires explicit origin config on the API. If you're behind a CDN or reverse proxy, confirm the CORS headers aren't being stripped or cached incorrectly; this is where preflight caching via `Access-Control-Max-Age` also matters for performance.
