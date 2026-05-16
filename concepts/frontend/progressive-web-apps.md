---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Progressive Web Apps

A PWA is a web app that uses platform APIs — primarily Service Workers and the Web App Manifest — to close the gap between what a browser tab can do and what a native app can do. The "progressive" part means these enhancements layer on top of a working web app; users on unsupporting browsers still get the base experience.

### Core Mechanism

PWAs aren't a single API — they're a convergence of capabilities that browsers gate behind an "installability" check. The browser evaluates criteria (HTTPS, a valid manifest with required fields, a registered Service Worker) and, when met, surfaces an install prompt. Once installed, the app gets its own window, appears in the OS app launcher, and can run without a browser chrome.

The Service Worker is the real engine. It acts as a programmable network proxy sitting between your app and the network. This unlocks:

- **Offline support** — cache assets and API responses; serve them when the network is gone
- **Background sync** — queue writes made offline, flush them when connectivity returns
- **Push notifications** — receive messages even when the app isn't open

The manifest handles the "feels native" surface: name, icons, theme color, display mode (`standalone` hides browser UI), and start URL.

### Mental Model

Think of a PWA as a web app that has negotiated a lease with the OS. The browser is the landlord — it audits your credentials (manifest + SW + HTTPS), then grants you a key to run in a first-class slot alongside native apps. You still run in a sandboxed browser engine, but you're no longer a tab.

### Practical Scenarios

**Frontend:** You're building a dashboard that field technicians use on-site, often with spotty connectivity. A SW with a cache-first strategy for static assets and a stale-while-revalidate strategy for API data means the app loads instantly and degrades gracefully offline. Background sync queues any form submissions made offline and retries them transparently when signal returns — no user action needed.

**Fullstack:** Push notifications require a server component. When a user installs your PWA, the browser generates a push subscription object (endpoint + keys). Your frontend sends this to your backend, which stores it. When an event occurs server-side (order shipped, CI build failed), your server sends a push message via the Web Push protocol to the browser's push service. The SW receives it via the `push` event and displays a notification — even if the app isn't open. This is the same delivery mechanism native apps use, routed through the browser vendor's infrastructure rather than APNs or FCM directly.

### The Tradeoff to Know

iOS Safari has historically lagged in PWA support — push notifications only landed in iOS 16.4, SW storage limits are tighter, and some APIs (background sync, periodic background sync) are still missing. PWAs are a strong choice for Android-first or desktop-first apps; for iOS parity, you may still need a native shell.
