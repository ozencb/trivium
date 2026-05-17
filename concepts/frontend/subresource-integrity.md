---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Subresource Integrity

When you load jQuery or a font from a CDN, your browser trusts whatever bytes arrive. SRI breaks that blind trust: you embed a hash of the expected file content in your HTML, and the browser refuses to execute or apply anything that doesn't match — even if it comes from the URL you specified.

**How it works**

The `integrity` attribute takes a base64-encoded cryptographic hash (SHA-256, SHA-384, or SHA-512) of the exact file content you're expecting:

```html
<script
  src="https://cdn.example.com/jquery-3.7.1.min.js"
  integrity="sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxaioMN/c5"
  crossorigin="anonymous"
></script>
```

The `crossorigin="anonymous"` is required — SRI needs the browser to perform a CORS fetch so the response body is readable for verification. Without it, SRI silently does nothing on cross-origin resources.

You generate the hash offline against the file you've vetted: `openssl dgst -sha384 -binary jquery.min.js | openssl base64 -A`. If the CDN serves a byte-for-byte different file — whether due to compromise, silent updates, or a misconfigured edge node — the browser blocks it and fires a CSP violation report.

**Where it breaks down**

SRI hashes are tied to exact byte content. CDNs that minify or compress on the fly, or files that include a build timestamp, will produce different hashes on every request. You also need to re-generate the hash whenever you intentionally upgrade a dependency version — easy to forget, especially in automated pipelines.

It also only covers the resource you've hashed. If `jquery.min.js` itself loads other scripts dynamically (and many analytics or ad SDKs do), those second-order fetches are invisible to SRI.

**Practical scenarios**

*Frontend:* SRI is most valuable for externally-hosted scripts where you're not in control of the server — CDN-distributed libraries, analytics tags, payment widgets. If you're self-hosting everything through your own origin, SRI adds friction for minimal gain since an attacker who can tamper with your files can also tamper with your HTML.

*Fullstack:* When your server-rendered templates reference versioned CDN assets, automate hash generation as part of your build step — not as a one-time manual step. Tools like `webpack-subresource-integrity` and Vite plugins handle this. The failure mode to avoid: shipping with a stale hash because someone bumped the CDN URL but forgot to regenerate.

**When to reach for it**

Reach for SRI when you're loading third-party scripts that handle sensitive user interactions (auth, payments, form submission) from a CDN you don't control. It's a cheap defense against CDN compromise and gives you auditable proof that the code users run matches what you reviewed. Skip it for first-party, self-hosted assets — the threat model doesn't warrant the maintenance cost.
