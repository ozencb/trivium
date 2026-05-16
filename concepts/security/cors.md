---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

CORS (Cross-Origin Resource Sharing) is a browser-enforced policy that lets servers declare which external origins can read their responses — it exists because browsers would otherwise let any page silently make authenticated requests to any server the user is logged into.

## The actual mechanism

The browser enforces the **Same-Origin Policy** by default: JS on `app.com` can *send* requests anywhere, but cannot *read* responses from a different origin (scheme + host + port triple). CORS is the server-side opt-in that relaxes this restriction.

Two request categories matter:

**Simple requests** (GET, HEAD, some POSTs with plain content types): The browser sends the request immediately with an `Origin` header. The server either includes `Access-Control-Allow-Origin` in its response or doesn't. If it doesn't match, the browser receives the response but blocks JS from reading it — the request already happened.

**Preflighted requests** (PUT/DELETE, custom headers, JSON body): The browser first sends an `OPTIONS` request to ask "will you accept this?". The server must respond with the right `Access-Control-Allow-*` headers before the browser proceeds with the actual request. This is the mechanism that protects against state-mutating cross-origin requests.

Critical nuance: **CORS is entirely browser-enforced**. The server just sends headers. `curl`, Postman, server-to-server calls — none of them see CORS. When you get a CORS error, the request usually *did* reach your server.

## The `credentials` gotcha

`Access-Control-Allow-Origin: *` is a wildcard, but it cannot be used alongside `Access-Control-Allow-Credentials: true`. If you need cookies or auth headers sent cross-origin, you must echo back the specific requesting origin, not `*`. Forgetting this causes confusing failures where CORS works for anonymous requests but breaks for authenticated ones.

## Practical angles

**Backend**: You configure CORS in middleware — Express's `cors()`, Django's `django-cors-headers`, Spring's `@CrossOrigin`. The decision is: which origins get access, which methods/headers are allowed, and whether credentials flow. Misconfiguring `allow-credentials: true` with `origin: *` opens you to CSRF-like attacks.

**Frontend**: You see the OPTIONS preflight in DevTools before your actual request. If you're debugging CORS, check whether the preflight succeeded separately from the real request. A 200 on OPTIONS but failure on the actual call points to a different problem than a 403 on OPTIONS.

**Fullstack**: The classic pain is local dev — React on `:3000` hitting an API on `:8080`. Different ports = different origin = CORS applies. The fix is either configuring CORS on the API for `localhost:3000`, or using a dev proxy (Vite's `server.proxy`, CRA's `proxy` field) to make requests appear same-origin to the browser.

The mental model that holds up: CORS is a *browser feature* for protecting users, not a server security layer. It prevents a malicious page from reading your bank's API response using your session cookie — not from making requests to your server.
