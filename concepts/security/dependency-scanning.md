---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Dependency Scanning

Dependency scanning is automated auditing of your project's dependency tree against known vulnerability databases (primarily the NVD/CVE corpus), run as a CI gate so vulnerable packages are caught before they ship. Without it, you're essentially hoping your dependencies are clean — which is a bad bet given that most application code is 80-90% third-party.

**How it actually works**

Your package manager lockfile (or manifest) is a precise snapshot of every dependency, direct and transitive. Scanners parse this, resolve the full tree, and check each package+version tuple against databases like the NVD, GitHub Advisory Database, and vendor-specific feeds. The match is usually on CPE (Common Platform Enumeration) identifiers or package ecosystem records (npm, PyPI, Maven, etc.). A hit produces a finding with a CVE ID, CVSS score, affected versions, and often a fixed version to upgrade to.

The critical detail: transitive dependencies are where most real vulnerabilities hide. You depend on `express`, which depends on `qs`, which has a prototype pollution CVE — your scanner finds it even though you never wrote `require('qs')` anywhere.

**Mental model**

Think of it like a bill of materials audit. A manufacturer knows every component supplier, and regulatory compliance requires checking those suppliers against known-bad lists. Your lockfile is the BOM; the CVE database is the sanctions list. The scanner is the automated compliance check you run before the product ships.

**Practical scenarios**

*DevOps:* This is primarily a pipeline concern. The pattern is: scan on every PR, block merge if CVSS ≥ 7.0 (or whatever threshold your policy sets), and run scheduled scans on `main` to catch newly-disclosed CVEs against already-shipped code. Tools like Snyk, Trivy, OWASP Dependency-Check, and GitHub Dependabot all fit here. The tricky part is alert fatigue — if you scan everything and block on every low-severity finding, engineers start ignoring or suppressing the gate. Threshold tuning and suppression workflows matter.

*Backend:* When you're running Java/Go/Python services, the risk profile is high — these ecosystems have deep dependency trees and a long tail of unmaintained packages. A Log4Shell-style event (a critical CVE in a transitive dependency nobody realized they had) is exactly what scanning prevents, because you can query "which of our services has log4j in the tree?" in seconds rather than days.

*Fullstack:* Node-heavy stacks are especially noisy because `node_modules` trees are enormous. The common pitfall is treating `devDependencies` as safe to ignore — they can reach prod through bundlers or SSR setups. Scan both. Also watch for different lockfiles per workspace in monorepos; scanners need to cover all of them, not just the root.

**Where it falls short**

Scanning only catches *known* vulnerabilities — zero-days and logic flaws in dependencies are invisible. It also doesn't tell you whether a vulnerable code path is actually reachable. Reachability analysis (Snyk, Google's OSV-Scanner with call graph analysis) helps here, but adds complexity. Start with basic scanning, then layer in reachability once the baseline is solid.
