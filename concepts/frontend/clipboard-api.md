---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Clipboard API

The Clipboard API gives JavaScript programmatic read/write access to the system clipboard — the same clipboard your OS exposes to native apps. It replaced the older, janky `document.execCommand('copy')` approach with an async, permission-based interface.

### Core mechanism

The API lives on `navigator.clipboard` and has four methods: `writeText`, `readText`, `write`, and `read`. The text variants handle plain strings; `write`/`read` handle `ClipboardItem` objects that can carry multiple MIME types simultaneously (text, HTML, PNG, etc.).

The critical design decision: **all reads are async and gated by permissions**. Writing is usually auto-permitted when triggered by a user gesture (click, keypress). Reading requires explicit user permission via the Permissions API — the browser will prompt the user. This asymmetry exists because silently reading clipboard contents is a privacy risk (passwords, sensitive data), while writing is less dangerous.

```js
// Write — works with a user gesture, no prompt
button.addEventListener('click', async () => {
  await navigator.clipboard.writeText('copied!');
});

// Read — may trigger a browser permission prompt
const text = await navigator.clipboard.readText();
```

For rich content, you construct a `ClipboardItem`:

```js
const html = new Blob(['<b>hello</b>'], { type: 'text/html' });
const plain = new Blob(['hello'], { type: 'text/plain' });
await navigator.clipboard.write([
  new ClipboardItem({ 'text/html': html, 'text/plain': plain })
]);
```

When the user pastes this in Word, it picks `text/html`. In a plain text editor, it falls back to `text/plain`. You're writing to the clipboard the same way native apps do.

### Mental model

Think of it like writing a file with multiple extensions. The clipboard holds a "clipboard item" that bundles several representations of the same data. The consuming app picks whichever MIME type it understands.

### Practical scenarios

**Frontend:** "Copy to clipboard" buttons on code blocks (GitHub, documentation sites) — one click copies the raw code. You also see this in color pickers that copy hex values, or share flows that copy a pre-built URL.

**Fullstack:** Rich text editors (Notion, Google Docs) use `write`/`read` with `text/html` to preserve formatting across copy-paste within the same app. They intercept `paste` events, read the clipboard HTML, sanitize it server-side or client-side, then insert it into their own document model — avoiding the lossy plain-text round-trip.

### Gotcha worth knowing

The API only works in secure contexts (HTTPS or localhost). In iframes, you need the `clipboard-read`/`clipboard-write` permissions policy set on the frame. And Safari has historically lagged on `ClipboardItem` support, so check caniuse if you need the rich-content variant.
