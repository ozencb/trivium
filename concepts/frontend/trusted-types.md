---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Trusted Types

Trusted Types is a browser API that lets you lock down the specific DOM sinks where XSS lives — `innerHTML`, `document.write`, `eval`, `src` attributes on scripts — so that only objects produced by your own vetted policy functions can be passed to them. CSP tells the browser *what resources to allow*; Trusted Types tells it *who is allowed to construct dangerous strings at all*.

### The core mechanism

You define one or more "policies" — named factories that produce typed wrapper objects (`TrustedHTML`, `TrustedScript`, `TrustedScriptURL`). The browser enforces at the sink level that only these typed objects can be assigned. Raw strings are rejected. This moves XSS defense from "try to remember to sanitize before every dangerous assignment" to a structural constraint the runtime itself enforces.

```js
const policy = trustedTypes.createPolicy('sanitize-html', {
  createHTML: (input) => DOMPurify.sanitize(input),
});

// This throws a TypeError at runtime (and is blocked by CSP header):
el.innerHTML = userContent;

// This works — DOMPurify runs inside the policy, output is a TrustedHTML object:
el.innerHTML = policy.createHTML(userContent);
```

Pair it with the CSP header `require-trusted-types-for 'script'` and any raw-string assignment to a dangerous sink becomes a hard failure — not a missed lint warning, not a "we hope someone sanitized this upstream."

### Where it actually matters

**Frontend:** The common failure mode in SPAs isn't `eval` — it's `innerHTML` used for rich text, markdown rendering, or template interpolation. With Trusted Types, you force all such code through a single policy. Auditing your XSS posture becomes "find all policy definitions" rather than "grep the entire codebase for innerHTML and hope you didn't miss one."

**Fullstack:** Server-rendered apps often pass HTML fragments through template literals or string concatenation before hydration. Trusted Types is a meaningful backstop here, though the policy boundary matters — if your policy's `createHTML` just returns the string verbatim, you've built a bypass, not a defense.

### Common pitfalls

- **Permissive policies.** A policy that calls no sanitizer and just wraps the string is structurally identical to no policy. The type system is only as strong as what happens inside `createHTML`.
- **Third-party libraries.** Many older libraries assign to `innerHTML` directly. You'll hit violations immediately on adoption — expect a compatibility shakeout. The `default` policy (assigned to `trustedTypes.defaultPolicy`) is an escape hatch for migrating incrementally, but it's also a footgun if left too permissive.
- **Enforcement vs. reporting.** Start with `Content-Security-Policy-Report-Only` + Trusted Types in report mode to surface violations before flipping to enforcement.

Reach for this when you're hardening a mature frontend application or building a new one where XSS risk is real — user-generated content, rich editors, dynamic HTML rendering. It's not worth retrofitting a tiny internal tool, but for anything customer-facing it's one of the highest-leverage browser security primitives available today.
