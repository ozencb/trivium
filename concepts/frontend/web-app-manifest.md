---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Web App Manifest

A Web App Manifest is a JSON file that tells the browser how to treat your web app when installed to a device — its name, icons, colors, and how it should behave outside a browser tab. Without it, "Add to Home Screen" is a glorified bookmark; with it, your app launches in a standalone window, shows a splash screen, and looks indistinguishable from a native app.

### Core mechanism

The manifest is a declarative contract between your site and the browser's install infrastructure. When the browser detects a `<link rel="manifest" href="/manifest.json">` in your HTML and you meet a few thresholds (served over HTTPS, has a service worker), it becomes eligible for installation. The browser reads the manifest to construct the install experience — it doesn't just bookmark the URL, it creates an app entry in the OS with its own icon, display behavior, and identity.

The key fields that actually matter:

- **`display`** — `standalone` removes browser chrome so the window looks native; `fullscreen` goes further; `browser` is basically a fancy bookmark
- **`start_url`** — the URL that opens on launch (scope it correctly or clicking the icon opens wherever you last were)
- **`scope`** — defines the boundary; navigating outside this path drops back into the browser
- **`icons`** — multiple sizes needed; the browser picks the best fit for the platform
- **`theme_color`** / **`background_color`** — controls the OS title bar tint and the splash screen background before your app loads

### Concrete example

```json
{
  "name": "Expense Tracker",
  "short_name": "Expenses",
  "start_url": "/app",
  "scope": "/app",
  "display": "standalone",
  "theme_color": "#1a1a2e",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Without `scope: "/app"`, a user clicking an external link from within your app might stay in standalone mode on a page that looks broken without your nav chrome.

### Practical relevance

**Frontend:** The manifest is what makes "Install App" prompts appear and feel trustworthy. Chrome's `beforeinstallprompt` event lets you intercept and defer the prompt, so you can show your own "Install for offline access" button at the right moment rather than letting the browser decide.

**Fullstack:** If your app has auth, `start_url` matters a lot — you often want `/dashboard` not `/`, but you need to handle the case where the user isn't logged in and gets redirected. The manifest doesn't know about auth state; your server does. Pair it with a service worker that handles offline gracefully, and `start_url` becomes a contract you have to honor even without a network.

The manifest is the entry point to the Progressive Web App model — get it right and the rest of PWA capabilities (offline, push notifications, background sync) have a solid foundation to build on.
