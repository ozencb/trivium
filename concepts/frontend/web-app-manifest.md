---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Web App Manifest

A Web App Manifest is a JSON file that tells the browser how to treat your web app when a user installs it — defining its name, icons, colors, and how it launches. Without it, "Add to Home Screen" is a glorified bookmark; with it, your app gets its own OS icon, splash screen, and a standalone window with no browser chrome.

**The core mechanism**

The manifest is linked from your HTML `<head>`:

```html
<link rel="manifest" href="/manifest.json">
```

The browser reads it when deciding whether to offer installation and how to render the installed app. The fields that actually matter:

```json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#1a1a2e",
  "background_color": "#ffffff"
}
```

`display: "standalone"` is the key field — it removes the browser's URL bar and nav buttons, making the app look native. `display: "minimal-ui"` keeps a thin browser strip; `"fullscreen"` drops everything.

`start_url` controls where the app lands on launch — set this intentionally. A common mistake is leaving it as `/` when you actually want users to land at `/dashboard` or `/app`. Also set a `scope` if you want to constrain which URLs count as "inside" the app versus opening in a real browser tab.

**Where it actually matters**

For a **frontend** engineer, the manifest is part of your PWA checklist alongside a service worker. Chrome's install prompt (`BeforeInstallPromptEvent`) only fires if the manifest is valid and a service worker is registered — so a missing or malformed manifest silently blocks installability. Use Lighthouse to audit it.

For a **fullstack** engineer, think about serving the manifest dynamically if your app is multi-tenant. A SaaS platform where each customer has their own subdomain can serve a different manifest per tenant — different names, icons, theme colors — from a single endpoint that reads tenant config.

**Common pitfalls**

- Icons missing the `192x192` or `512x512` sizes — Chrome requires both for install eligibility
- `start_url` not within `scope` — breaks navigation containment
- Forgetting to set `background_color` — causes a white flash on the splash screen before your CSS loads
- Serving the manifest with the wrong MIME type (`application/json` is fine; `text/plain` is not)

The manifest is a small file with outsized impact on perceived app quality. It's the difference between "this is a website" and "this is an app" in the user's mental model — and increasingly, in OS-level features like notification badges and app stores.
