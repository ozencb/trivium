---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## SSH Key Authentication

SSH key authentication replaces passwords with a cryptographic challenge-response protocol — you prove possession of a private key without ever transmitting it, which eliminates an entire class of credential-theft attacks.

### The Core Mechanism

When you connect to an SSH server, the handshake goes roughly like this:

1. Your client advertises which public key it wants to authenticate with.
2. The server checks `~/.ssh/authorized_keys` — if your public key is there, it generates a random challenge and sends it back, encrypted with your public key.
3. Your client decrypts it using your private key, signs the result (combined with the session identifier) using that same private key, and sends the signature back.
4. The server verifies the signature against your public key. A valid signature proves you hold the private key, without you ever revealing it.

The critical invariant: the private key never leaves your machine. The server only needs to know your public key, and even if the server is compromised, attackers gain nothing they can use to authenticate elsewhere.

### Mental Model

Think of it like a padlock protocol. You give everyone a copy of your open padlock (public key). When a server wants to verify you, it locks a box with your padlock and sends it to you. Only you have the key that opens it. If you can open the box and prove its contents, you're authenticated — no secret ever crossed the wire.

### Practical Scenarios

**Backend:** When your application servers need to pull code from GitHub or communicate with a bastion host, you deploy a dedicated keypair. The private key lives in a secret manager (AWS Secrets Manager, Vault), injected at runtime. If the key is rotated or revoked, you change one authorized_keys entry — no password resets across dozens of services.

**SRE:** Jump hosts / bastions rely on SSH keys for audit trails. Because each engineer has a unique keypair, you can trace exactly which key authenticated a session, then revoke individual access without disrupting others. Certificate authorities (like HashiCorp Vault's SSH secrets engine) take this further — they sign keys with a short TTL, so compromised keys expire automatically.

**DevOps:** CI/CD pipelines (GitHub Actions, GitLab CI) use SSH deploy keys — a keypair where the public key is scoped to a single repo with read-only access. This is safer than giving the pipeline a personal access token with broader permissions. The private key is stored as an encrypted CI secret and injected into the runner's `~/.ssh/` at build time.

### One Gotcha

Key management is the real operational burden. `authorized_keys` files scattered across servers don't scale — which is why teams move to centralized SSH certificate authorities or tools like Teleport, where you're not managing individual key distribution but trusting a CA that signs short-lived certificates.
