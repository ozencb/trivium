---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Web Push Notifications

Web push lets servers send messages to users even when the browser tab is closed — achieved by routing messages through a browser vendor's push service rather than a direct server-to-client connection.

### The Core Mechanism

The architecture has three parties: your server, the browser's push service (FCM for Chrome, Mozilla's autopush for Firefox, APNs for Safari), and the service worker.

When a user grants notification permission, the browser generates a **push subscription** — an endpoint URL on the vendor's push service plus a pair of encryption keys (auth and p256dh). Your server stores this subscription. To send a push, your server makes an authenticated HTTP POST to that endpoint URL with an encrypted payload. The push service queues it and delivers it to the client when the browser is connected. The service worker's `push` event fires (even with no open tabs), and it calls `self.registration.showNotification()`.

The authentication part uses **VAPID** (Voluntary Application Server Identification): you generate a public/private key pair, include the public key when subscribing, and sign your push requests with the private key. The push service verifies this so only your server can send to your subscriptions.

### Mental Model

Think of it like email infrastructure: you don't deliver email yourself — you hand it to an SMTP server that handles delivery. Similarly, you hand your push message to the browser vendor's push service, which handles the actual "wake up that browser" work. You never have a persistent connection to users; you just POST to an endpoint and the vendor handles the rest.

### Practical Scenarios

**Frontend:** The subscription lifecycle lives in client code — requesting permission, calling `pushManager.subscribe()` with your VAPID public key, and sending the resulting subscription object to your backend. You also handle the `push` and `notificationclick` events in the service worker to display notifications and route clicks to specific URLs or open/focus a window.

**Fullstack:** Server-side you store subscriptions per-user (they're per-browser, so one user can have multiple), send pushes using a library like `web-push` (Node) or `pywebpush` (Python), and handle expired/invalid subscriptions — if the push service returns 404 or 410, delete that subscription. You'll also deal with payload size limits (~4KB) and TTL (how long the push service should retain undelivered messages).

### Key Gotchas

- Subscriptions are browser-specific and ephemeral — they change after certain browser updates or if the user clears site data
- Safari on iOS only added support in 2023, and requires a web app manifest with `display: standalone`
- The encryption is mandatory (payload isn't optional-plaintext) — the browser vendor never sees your message content
