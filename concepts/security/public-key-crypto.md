---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Public Key Cryptography

Two mathematically linked keys — one public, one private — let strangers establish trust and exchange secrets without ever sharing a password. It's the foundation of nearly every secure communication on the internet.

### The core idea

Symmetric crypto (shared secret) breaks down when two parties have never met: how do you share the secret without a secure channel to share it over? Public key crypto solves this with a **trapdoor function** — a math operation that's trivially easy in one direction and computationally infeasible to reverse.

In RSA, for example, multiplying two huge primes is fast. Factoring their product back into those primes is practically impossible at sufficient key sizes. Your private key is those primes; your public key is their product. The math binds them, but you can't derive one from the other in reasonable time.

This asymmetry gives you two distinct primitives:

- **Encryption**: anyone encrypts with your public key; only your private key decrypts it.
- **Signing**: you sign with your private key; anyone with your public key can verify it was you, and the message wasn't tampered with.

### Mental model

Think of a physical padlock. You manufacture it, keep the key, and hand out unlocked copies to anyone. They can lock a box for you — only you can open it. Signing flips this: you lock something with your key, and the open padlock (public key) proves it came from you.

### Where you'll hit this

**Backend** — JWT signing with RS256 means your auth service signs tokens with its private key, and every downstream microservice verifies with the public key. No service needs the private key except the issuer — a breach of a resource server doesn't compromise signing authority.

**SRE** — SSH key auth is exactly this. `ssh-keygen` generates a keypair; you put the public key in `~/.ssh/authorized_keys` on the server. When you connect, the server challenges you to prove you hold the private key (via a signature), never requiring you to transmit it.

**Fullstack** — HTTPS relies on this during the TLS handshake. The server's certificate contains its public key. Your browser uses it to encrypt a session key (or verify a signature, depending on cipher suite), so only the server can read the establishment of the shared secret — after which you switch to symmetric encryption for speed.

The key insight: asymmetry separates identity verification from secret-sharing, which is what makes decentralized trust possible at internet scale.
