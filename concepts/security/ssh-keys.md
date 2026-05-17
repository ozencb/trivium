---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

SSH key authentication is a challenge-response protocol that proves identity by demonstrating possession of a private key through cryptographic signature—the key itself is never transmitted. It replaces passwords for remote access because a stolen server database or network intercept yields nothing reusable.

## How it actually works

When you connect, the server sends a random challenge (a nonce tied to the session). Your SSH client signs it with your private key and sends back the signature. The server verifies that signature against the public key it has stored (in `~/.ssh/authorized_keys`). A valid signature proves you have the private key; forging one without it is computationally infeasible.

This is distinct from TLS/HTTPS certificate auth in one key way: there's no certificate authority chain. Trust is explicit—your public key lives in `authorized_keys` because someone with existing access put it there. No PKI, no OCSP, no revocation lists. Revocation is just deleting the line.

## Mental model

Think of it like a sealed envelope with a wax seal. The server knows what your seal looks like (public key). It hands you a document, you seal it, return it. If the seal matches, you're authenticated. The server never sees your signet ring (private key)—only its output.

## Where this matters in practice

**Backend:** Automated deployments and CI/CD pipelines use key auth to pull from private git repos or push to servers. A common pattern is generating a dedicated deploy key per service—narrow-scope, can be rotated independently, and the private key lives as a CI secret rather than a shared password.

**SRE:** Bastion/jump host setups rely on agent forwarding (`ssh -A`) so you can authenticate to internal hosts using the key from your laptop, without copying the private key to the bastion. This is convenient but the forwarded agent can be hijacked by root on the bastion—prefer `ProxyJump` (`-J`) instead, which creates a direct tunnel without exposing the agent socket.

**DevOps:** Configuration management tools (Ansible, Fabric) and infrastructure bootstrapping (cloud-init, Terraform provisioners) use key auth universally. The failure mode to watch: if your private key has a passphrase, unattended automation breaks unless you're using `ssh-agent` or a secrets manager to inject the key.

## Common pitfalls

- **Overly permissive `authorized_keys`**: Options like `command=` and `restrict` let you lock a key to a specific command—critical for automated access where you don't want full shell.
- **Key reuse**: Using one key everywhere means one compromise is total compromise. Service-specific keys are worth the operational overhead.
- **File permissions**: SSH will refuse to use a private key that's world-readable (`chmod 600` is required). Similarly, `~/.ssh` must be `700` or authentication silently fails.
