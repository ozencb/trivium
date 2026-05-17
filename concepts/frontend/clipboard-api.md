---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Clipboard API

The Clipboard API gives you async, permission-gated access to the system clipboard, replacing the old `document.execCommand('copy')` hack that required a selected DOM element and had no way to read structured data. The real shift is that it treats clipboard access as a first-class async operation with explicit user consent, not a side-effect of DOM manipulation.

**Core mechanism**

The API lives on `navigator.clipboard` and has four methods: `writeText`, `readText`, `write`, and `read`. The text variants are straightforward. The interesting ones are `write` and `read`, which work with `ClipboardItem` objects — wrappers that map MIME types to `Blob`s. This means you can write `image/png` or `text/html` alongside `text/plain`, and the OS clipboard understands all of them. When a user pastes into Word, they get formatted content; into a terminal, plain text.

```js
await navigator.clipboard.write([
  new ClipboardItem({
    'text/html': new Blob(['<b>hello</b>'], { type: 'text/html' }),
    'text/plain': new Blob(['hello'], { type: 'text/plain' }),
  })
]);
```

**The permission model**

Writing requires a transient user activation (button click, keypress) — no explicit permission prompt. Reading is more sensitive: the browser prompts the user, and the permission is `clipboard-read` in the Permissions API. This asymmetry trips people up. Copy works silently; paste requires either a user gesture *and* permission, or the browser will reject the promise.

**Practical patterns**

The most common use is "copy to clipboard" buttons — copy a code snippet, an API key, a URL. Use `writeText`, wrap in try/catch, update UI state on success. Don't forget: this only works in secure contexts (HTTPS or localhost).

For rich copy (spreadsheet cells, styled text, images), you need `ClipboardItem`. This shows up in design tools (Figma-style), rich text editors, or anywhere you want paste to carry structure rather than just characters.

For paste handling — reading clipboard on user action — you can do things like "paste image" upload flows where users paste a screenshot directly into a form field. Listen for the `paste` event on the document or a focused element, then pull from `event.clipboardData` (synchronous, works everywhere) or `navigator.clipboard.read()` (async, needs permission).

**Common pitfalls**

- `navigator.clipboard` is undefined in non-secure contexts and in some iframe sandboxes — always guard against it
- Firefox has historically lagged on `ClipboardItem` support for non-text types
- The `paste` event's `clipboardData` and `navigator.clipboard.read()` are two different systems; `clipboardData` is synchronous and available inside the event handler, while `navigator.clipboard.read()` is async and can be called anywhere (with permission)
- Permission state doesn't persist the way you might expect — users can revoke it

For most cases, `writeText` + `readText` covers everything you need. Reach for `ClipboardItem` when you're building anything that handles rich content.
