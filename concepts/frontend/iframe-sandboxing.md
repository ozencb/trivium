---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## iframe Sandboxing

When you embed third-party content via an iframe—ads, widgets, user-generated embeds—that content runs in your page's process with surprising reach by default. The `sandbox` attribute flips this: it starts from zero trust and you opt capabilities back in explicitly.

**The mechanism**

Without `sandbox`, an iframe inherits the same-origin policy but still gets full browser capabilities: JavaScript execution, form submission, cookie access, popups, top-level navigation (the embedded page can redirect your whole tab). With `sandbox=""`, all of that is stripped. The frame runs in a unique origin (breaking same-origin access even to itself), scripts are disabled, forms don't submit, plugins don't run, and it can't navigate the parent.

You restore capabilities selectively:

```html
<!-- Strip everything -->
<iframe sandbox src="..."></iframe>

<!-- Allow scripts and same-origin access, nothing else -->
<iframe sandbox="allow-scripts allow-same-origin" src="..."></iframe>

<!-- Typical ad/widget embed -->
<iframe sandbox="allow-scripts allow-popups allow-forms" src="..."></iframe>
```

**The `allow-scripts` + `allow-same-origin` trap**

This combination is the footgun everyone hits once. `allow-same-origin` lets the iframe treat itself as same-origin with the parent—and if it can also run scripts, it can just remove its own sandbox attribute via `contentDocument`. Only use `allow-same-origin` when the content is your own domain and you need cookie/storage access; never pair it with untrusted third-party content.

**When you actually reach for this**

- **Embedding user-generated HTML**: markdown previews, email renderers, rich-text editors that output raw HTML. Sandbox prevents XSS from escaping the frame.
- **Third-party widgets where you don't control the source**: payment buttons, social embeds, analytics snippets. Even if you trust the vendor, sandboxing limits blast radius if their CDN is compromised.
- **Isolation in micro-frontend architectures**: when independently deployed apps share a shell, sandboxing gives you a hard boundary that CSS-in-JS and module federation don't.

**Fullstack angle**

If you're serving user-uploaded HTML files (think Figma-style exports, email preview tools), a common pattern is serving them from a separate subdomain *and* sandboxing the iframe. The subdomain isolation handles same-origin network access; sandbox handles runtime capabilities. Both together is defense-in-depth—sandbox alone doesn't prevent the embedded page from making credentialed requests to your API if it shares your origin.

**The `allow-top-navigation` pitfall**

Skip this permission unless you have a specific reason. It lets the embedded content redirect the parent tab—a classic clickjacking vector used in phishing flows where a malicious ad sends users to a credential-harvesting page.

The mental model: `sandbox` is a capabilities allowlist, not a denylist. When in doubt, start with nothing and add permissions only when a specific feature breaks. The friction of debugging missing permissions is much cheaper than a supply-chain XSS.
