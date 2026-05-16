---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Certificate Pinning

Certificate pinning is a defense against CA compromise: instead of trusting any certificate signed by any trusted CA, a client hardcodes the specific certificate (or public key) it expects from a server and rejects anything else.

### Why the normal TLS model isn't enough

After a TLS handshake, you know the connection is encrypted and the server's cert was signed by *some* trusted CA. But your OS and browser trust hundreds of CAs. A compromised or rogue CA can issue a legitimate-looking cert for `api.yourcompany.com` — and a MITM attacker using that cert passes normal validation just fine. This has happened: DigiNotar (2011), Comodo (2011), Symantec (2017).

Pinning sidesteps this entirely. The client says: "I don't care what any CA says — I only accept this specific cert or public key."

### The mechanism

Two variants:

**Certificate pinning** — store the exact DER-encoded cert (or its SHA-256 hash). Reject anything that doesn't match.

**Public key pinning (SPKI pinning)** — store just the hash of the `SubjectPublicKeyInfo` from the cert. This is almost always preferred because the public key survives cert renewals as long as you keep the same key pair. Full cert pinning breaks on every renewal.

At connection time the client extracts the public key from the server's presented leaf cert (or sometimes an intermediate/root), hashes it, and compares against the stored pin. No match → connection refused, no fallback.

Most implementations also define backup pins — hashes of keys you *haven't* issued yet but control, so you have a rotation path if your primary is compromised.

### Mental model

Think of it like SSH's `known_hosts`. The first time you SSH into a server, it stores the host's public key fingerprint. Next time, if the fingerprint changes, SSH screams at you. Pinning is the same idea, applied to TLS server certs in application code rather than interactively.

### Practical scenarios

**Backend (service-to-service):** Internal microservices calling each other — or your service calling a critical third-party API (payment processor, identity provider) — can pin the remote's cert. Even if someone poisons DNS or intercepts traffic inside your infrastructure, a forged cert gets rejected. Combine with mTLS for mutual verification.

**SRE:** Pinning is a deployment and rotation minefield. A cert rotation that doesn't update pins simultaneously breaks clients hard — no graceful degradation, just connection failures. You need coordinated rollouts: push new pins *before* rotating the cert, keep the old pin valid during the window, then remove it after. Monitoring pin validation failures separately from TLS errors is essential — otherwise you won't know you're broken until users complain. Mobile apps that ship pins in binaries are especially dangerous: you may have a 6-week window before a forced cert rotation bricks an unupdated app version in the wild.

The tradeoff is real: pinning raises your MITM attack floor significantly, but operational complexity and rotation risk are non-trivial costs.
