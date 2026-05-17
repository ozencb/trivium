---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## HTTP Content Negotiation

Content negotiation lets a single endpoint serve multiple representations of the same resource — JSON for your API client, HTML for a browser, CSV for a data export tool — without multiplying routes. The client declares what it can handle; the server picks the best match and tells the client what it chose.

### The mechanism

Clients send `Accept` headers listing media types with optional quality weights (`q` values):

```
Accept: application/json;q=0.9, text/html;q=0.8, */*;q=0.1
```

The server scores its available representations against this list, picks the highest-weighted match it can produce, serves it, and declares the winner in `Content-Type`. If nothing matches and the server isn't willing to fall back to `*/*`, it returns `406 Not Acceptable`.

Beyond format, the same pattern applies to encoding (`Accept-Encoding: gzip, br`), language (`Accept-Language: en-US, fr;q=0.7`), and character set (`Accept-Charset`, though mostly obsolete now).

### The real-world shape of this

In practice, most APIs don't implement full server-driven negotiation — they just hardcode `Content-Type: application/json` and call it done. Full negotiation shows up in a few specific scenarios:

- **API versioning via media type**: `Accept: application/vnd.myapi.v2+json`. Keeps versioning out of the URL and makes it a representation concern rather than a routing concern. Rails and Django REST Framework both support this.
- **Multi-format APIs**: A `/report` endpoint that returns JSON for programmatic access and CSV for spreadsheet download. The alternative — `/report.json` vs `/report.csv` — works but conflates identity with format.
- **Content negotiation in reverse (request bodies)**: `Content-Type` on `POST`/`PUT` requests is the client telling the server what format it's *sending*. The server can reject with `415 Unsupported Media Type` if it can't handle it.

### Where it bites people

The common pitfall is ignoring the `Vary` response header. If your CDN or proxy caches a response, it needs to know the cache key includes `Accept`, or it'll serve the JSON response to a client that asked for HTML. Always return `Vary: Accept` (and `Vary: Accept-Encoding`, etc.) when you're actually doing negotiation.

The second pitfall: browsers send wildcard `Accept` headers that will match your JSON endpoint if you implement `*/*` fallback carelessly. Sniff the `Accept` header for `text/html` presence and weight before assuming the client is a programmatic consumer.

### When to reach for it

Reach for content negotiation when the *resource* is the same but the *representation* varies by consumer — not when the underlying data or behavior differs. If `/users/42` needs to return JSON for your mobile app and a rendered profile card for sharing previews, negotiation is the right tool. If the two responses require fundamentally different business logic, separate endpoints are cleaner.
