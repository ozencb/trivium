---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Software Supply Chain Security

Your running application is only as trustworthy as everything that went into building it. Supply chain security addresses the attack surface that exists *before* your code ever runs in production—the dependencies you pull, the build tools that compile them, and the pipeline that assembles the final artifact.

### The Core Mechanism

The threat model here is that an attacker doesn't need to compromise your codebase. They can compromise a library you depend on (SolarWinds, XZ Utils), inject malicious code into a build system, or hijack a package registry account. By the time the binary lands on your server, the damage is done.

The defenses form a chain of custody:

**Dependency pinning** locks exact versions (via lockfiles like `package-lock.json` or `Cargo.lock`) so `npm install` in CI gives you the same bytes every time, not "latest compatible." Without pinning, a patch release can silently introduce a backdoor.

**Artifact signing** (Sigstore, cosign) lets you cryptographically attest that an image or binary was produced by a specific pipeline from a specific commit—not just uploaded by whoever has registry credentials. You're not trusting the artifact; you're trusting the provenance chain.

**SBOMs (Software Bill of Materials)** are machine-readable inventories of everything in your artifact—direct and transitive dependencies. When a CVE drops, an SBOM lets you answer "are we affected?" in minutes instead of grepping through lock files.

**Provenance attestation** (SLSA framework) extends signing to the build process itself: who triggered it, what source commit, what build system ran it.

### Mental Model

Think of it like food safety. You don't just check the finished dish—you audit the supply chain: where ingredients came from, who handled them, the chain of custody. A signed artifact with provenance is like a product with a verified farm-to-table record. An unpinned dependency pulled at build time is like asking a stranger to add ingredients right before serving.

### Practical Scenarios

**DevOps/Platform:** Enforcing SLSA level 2+ means your CD pipeline rejects any image it can't verify was built from a known commit in your controlled CI system. This blocks "I'll just push a fixed image manually" as an emergency shortcut—which sounds annoying until someone abuses that same escape hatch.

**Backend:** When you take a dependency on an OSS library, pinning + Dependabot/Renovate for automated updates is the baseline. The XZ Utils backdoor (2024) was caught partly because the maintainer's behavior looked anomalous—a human signal—but reproducible builds would have caught the binary-level discrepancy automatically.

**SRE:** During an incident, knowing your artifact's exact SBOM and build provenance cuts investigation time dramatically. "Was this binary built from the commit we think it was?" becomes a signed verification, not a trust exercise.

The differentiating insight in interviews: most engineers think of security as runtime (WAF, auth). Recognizing that your blast radius includes compromised dependencies or CI pipelines—and knowing the tooling to close that gap—signals you've operated at a level where these attacks are realistic threats, not theoretical ones.
