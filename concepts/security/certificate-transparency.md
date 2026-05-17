---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Certificate Transparency

The CA trust model has a fundamental flaw: any of the ~150 trusted CAs can issue a certificate for *any* domain, and historically there was no way to know it happened. Certificate Transparency (CT) closes that gap by requiring CAs to log every certificate they issue to public, append-only audit logs before browsers will accept the cert.

### The core mechanism

When a CA issues a certificate, it submits it to one or more CT logs (run by Google, Cloudflare, DigiCert, etc.). The log returns a **Signed Certificate Timestamp (SCT)** — a cryptographic promise that "this cert will appear in our log within 24 hours." The SCT gets embedded in the certificate itself (or delivered via TLS extension). Browsers verify the SCT is present and valid; if not, they reject the connection.

The logs themselves use a **Merkle tree** structure. Each new certificate becomes a leaf; the tree root is periodically signed and published. This makes tampering detectable: you can't insert, delete, or alter a past entry without invalidating the root hash, and independent monitors continuously verify consistency across log replicas.

### Concrete model

Think of it like a public ledger for cert issuance. If a rogue CA issues a cert for `yourcompany.com`, it *must* be written to the ledger or browsers reject it outright. Your monitoring tooling watches that ledger for your domains. You find the unauthorized cert within hours — before attackers can use it — rather than never.

Tools like [crt.sh](https://crt.sh) let you query this ledger directly. Try searching your own domain; you'll see every cert ever issued, including ones you may have forgotten about.

### Practical relevance

**For SREs:** CT monitoring should be part of your security runbook. Services like Facebook's `certwatch`, Cloudflare's CT dashboard, or open-source tools (e.g., `certspotter`) alert you when a new cert is logged for your domains. A cert you didn't issue means either a misconfigured automation, a compromised account at your CA, or active attack — all worth knowing immediately. Also: if your internal CA isn't logging to public CT logs, your certs won't work in modern Chrome/Firefox. This bites teams running internal HTTPS services that suddenly stop working after a browser update.

**For backend engineers:** If you're building anything that validates TLS programmatically — mutual TLS, webhook verification, certificate pinning — understand that SCT validation is part of what makes a cert "trusted." If you're operating your own CA (common in service meshes like Istio), you need to decide whether to integrate with public CT logs or run a private log, depending on your threat model.

The failure mode CT guards against — unauthorized cert issuance — is rare but catastrophic when it happens. DigiNotar (2011), Symantec (2017), and several others issued fraudulent certs that went undetected. CT makes that class of attack nearly impossible to hide.
