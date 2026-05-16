---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## iframe Sandboxing

An `iframe` embeds third-party or untrusted content in your page, and by default that content runs with nearly the same privileges as your origin. The `sandbox` attribute lets you strip those privileges down to exactly what you need.

### The Core Mechanism

Without `sandbox`, an embedded iframe can run scripts, submit forms, navigate the top-level window, access cookies via `document.cookie`, and even pop up new windows. If you're embedding something you don't fully control — a widget, an ad, user-generated content — that's a significant attack surface.

Adding `sandbox` with no value applies the most restrictive policy: scripts are blocked, form submissions are blocked, plugins are blocked, the content is treated as a unique origin (no same-origin access), and it can't navigate the parent frame. You then opt *back in* to specific capabilities with `allow-*` tokens:

```html
<iframe
  src="https://widget.example.com"
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

**Critical gotcha:** `allow-scripts` + `allow-same-origin` together largely defeats sandboxing, because a script running in the same origin can remove the `sandbox` attribute via the DOM. Use one or the other, rarely both.

### Mental Model

Think of it like a container with a whitelist of system calls. The iframe is a process that, by default, has no capabilities. You grant specific syscalls — `allow-forms`, `allow-popups`, `allow-top-navigation`, etc. — rather than revoking them after the fact.

### Practical Scenarios

**Frontend:** You're building a no-code editor that renders user-defined HTML previews. Without sandboxing, a user's preview could call `window.parent.localStorage` or redirect the main window. A sandboxed iframe with `allow-scripts` (but *not* `allow-same-origin`) lets JavaScript run inside the preview while keeping it isolated from your app's origin.

**Fullstack:** You're serving an analytics embed that customers paste into their sites. Sandboxing on the *consumer's* side isn't something you control — but knowing this pattern matters when you're on the other end: designing embeds that work within common sandbox policies means not relying on cookies (use `postMessage` instead), not requiring top-level navigation, and documenting exactly which `allow-*` permissions your embed needs.

**CSP interaction:** Sandboxing and Content Security Policy address different threat models. CSP controls what resources a page loads; `sandbox` controls what capabilities the page has after loading. They're complementary, not redundant.

### The `allow` Attribute vs. `sandbox`

Don't confuse `sandbox` with `allow` (which controls Permissions Policy — camera, geolocation, etc.). They coexist independently on the same `<iframe>` element and govern different privilege dimensions.
