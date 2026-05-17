---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Public Key Cryptography

Two mathematically linked keys — one public, one private — where anything encrypted with one can only be decrypted with the other. The breakthrough: two parties can establish a secure channel without ever exchanging a secret, solving the key distribution problem that plagued symmetric encryption.

### The Core Mechanism

The math rests on **trapdoor functions**: operations trivially easy to compute in one direction, computationally infeasible to reverse without special knowledge. RSA uses the fact that multiplying two large primes is instant, but factoring the result back into those primes takes longer than the age of the universe at sufficient key sizes. Elliptic curve variants (ECDSA, Ed25519) use a different trapdoor — point multiplication on a curve — with smaller keys and equivalent security.

The key pair relationship: anything encrypted with the public key can *only* be decrypted with the private key, and vice versa. These aren't two locks on the same key — they're mathematically inverse operations that only work together.

### Mental Model

Think of a padlock and key. You hand out unlocked padlocks (public keys) to anyone. They lock a box and send it to you. Only your key (private key) opens it. Crucially, having the padlock tells you nothing about how to make the key.

For signing, the metaphor reverses: you lock something with your private key, and anyone with your public key can verify you locked it — proving it came from you without revealing how to impersonate you.

### Practical Scenarios

**Backend:** When your service calls an external API using JWT authentication, the API provider publishes a public key. Your service uses it to verify the token's signature without the provider ever sending you the signing secret. No shared secret in your environment means no credential to rotate or leak.

**SRE:** SSH key auth works the same way — the server stores your public key, you prove identity by signing a challenge with your private key. If the server is compromised, attackers get your public key, which is useless for impersonation. This is why `~/.ssh/authorized_keys` leaking is not a disaster, but your private key leaking is.

**Fullstack:** TLS uses asymmetric crypto during the handshake to negotiate a symmetric session key. The server's certificate contains its public key; your browser encrypts a random value with it. Only the server can decrypt it. After that, both sides derive the same symmetric key and switch to faster AES for the actual data — asymmetric crypto is expensive, so you use it only to bootstrap trust.

### The Invariant to Internalize

The private key never travels. It proves identity and establishes secrets without ever being shared. The public key is genuinely safe to distribute anywhere. Security comes entirely from the computational hardness of reversing the trapdoor — which is why key length and algorithm choice matter, and why 1024-bit RSA is now considered broken.
