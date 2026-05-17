---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## SSRF Prevention

SSRF (Server-Side Request Forgery) happens when your server fetches a URL that an attacker controls, turning your server into a proxy for their requests. The danger isn't someone hitting your API with bad data — it's someone using your server's internal network position to reach things your server can reach but they can't.

**The core problem**

Your server often has privileges an external client doesn't: access to `169.254.169.254` (AWS/GCP metadata endpoint that hands out IAM credentials), internal services on `10.x.x.x`, or localhost ports running unauthenticated admin interfaces. When you take a URL from user input and fetch it — for link previews, webhooks, PDF generation, image proxying — you inherit that trust boundary unless you explicitly close it.

The naive fix is blocklisting known bad IPs. That's insufficient. Attackers use DNS rebinding (the hostname resolves to a public IP at validation time, then a private IP at fetch time), redirect chains (`http://evil.com/redir` → `http://169.254.169.254/`), IPv6 representations of private ranges, or decimal/octal IP encoding. Blocklists lose this arms race.

**What actually works**

The reliable defense is an allowlist of destinations, combined with post-DNS-resolution validation:

1. Resolve the hostname to IPs *before* making the request
2. Reject if any resolved IP is in private/loopback/link-local ranges (RFC 1918, `::1`, `169.254.0.0/16`, etc.)
3. Disable follow-redirects, or re-validate after each redirect
4. Make the request, binding to a network interface that can't reach internal services if your infra supports it

The DNS step matters: validate the *resolved IP*, not the hostname. Libraries like `ssrf-req-filter` (Node) or `pycurl` with `CURLOPT_RESOLVE` give you hooks to do this.

**Backend context**

This bites webhook handlers, image resizers, link unfurlers, and any "import from URL" feature. A common mistake: validating the URL format client-side or checking the hostname against a regex, but doing the actual fetch server-side without re-checking. The fetch is the attack surface, not the form input.

**SRE context**

Cloud metadata endpoints are the highest-value target — a successful SSRF against `169.254.169.254` can yield instance credentials that allow lateral movement across your entire cloud account. IMDSv2 (AWS) mitigates this for the metadata service itself by requiring a PUT-then-GET with a token, but it doesn't help if your SSRF hits an internal Jenkins or Consul instance instead.

**The pattern to internalize**

SSRF is the server-side analog of CORS — where CORS restricts what *external scripts* can request on behalf of a user, SSRF prevention restricts what *your server* will fetch on behalf of a user. Both exist because trust boundaries are asymmetric and attackers exploit the gap between "who made the request" and "who the network trusts."
