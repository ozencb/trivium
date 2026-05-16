---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Subresource Integrity (SRI)

SRI lets you verify that files fetched from external servers haven't been tampered with before the browser executes them. It's your defense against a compromised CDN or a supply chain attack serving malicious JavaScript.

### The Mechanism

You compute a cryptographic hash of a file's exact byte content, then embed that hash in the HTML tag that loads it. When the browser fetches the resource, it hashes what it received and compares. If they don't match, the resource is blocked entirely — never parsed, never executed.

```html
<script
  src="https://cdn.example.com/lodash-4.17.21.min.js"
  integrity="sha384-ZvpUoO/+PpLXR1lu4jmpXWu80pZlYUAfxl5NsBMWOEPSjUcFLjZjeod4AbbDbdnZ"
  crossorigin="anonymous">
</script>
```

The `crossorigin="anonymous"` attribute is required — without CORS headers on the response, the browser can't read the body to hash it.

The supported algorithms are SHA-256, SHA-384, and SHA-512. SHA-384 is the current practical standard.

### Mental Model

Think of it like downloading software and verifying its checksum before installing. The difference is the browser does it automatically and refuses to proceed if verification fails. The threat isn't just a compromised CDN — it's also MITM attacks and library maintainers pushing silent updates to files you thought you'd audited.

### Where This Matters in Practice

**Frontend:** You're loading React, a charting library, or a UI toolkit from a CDN to avoid bundling it. If that CDN is breached and serves a modified script that skims form input, SRI blocks execution before any damage happens. You locked down the exact bytes you audited.

**Fullstack:** Server-rendered apps often inject third-party SDKs — payment processors, analytics, support widgets. These are high-value targets. With SRI on your Stripe.js or similar script tag, you get a hard guarantee that the version running in production is the one your security team signed off on — not a silently updated patch that happened at the CDN layer.

### What It Doesn't Cover

- **Dynamically generated assets** — if the CDN adds request-specific content or serves different compression variants, the hash will constantly mismatch
- **Version upgrades** — you regenerate the hash whenever you update the library; it's a workflow cost
- **fetch() / XHR / img / iframe** — SRI only applies to `<script>` and `<link rel="stylesheet">`

### Generating Hashes

```bash
openssl dgst -sha384 -binary lodash.min.js | openssl base64 -A
```

Or use the `sri-hash` npm package in your build pipeline, or `srihash.org` for one-offs.

SRI is most valuable when you don't own the asset server. For self-hosted assets, a strong Content Security Policy does more work with less overhead.
