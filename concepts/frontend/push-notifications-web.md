---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Web Push Notifications

Web Push lets a server send messages to a user's browser even when your site isn't open — the browser receives the message via a background service worker, which can then display a native OS notification or take action silently.

### Core mechanism

The flow has three parties: your server, a browser vendor's push service (Google's FCM, Mozilla's autopush, etc.), and the browser. When a user grants permission, the browser generates a unique **push subscription** — an endpoint URL on the vendor's push service plus a pair of encryption keys. Your server stores this subscription. To push a message, your server sends an HTTP POST to that endpoint, encrypted with the user's public key and signed with your **VAPID** key pair.

VAPID (Voluntary Application Server Identification) is what prevents anyone else from abusing the endpoint — you sign the request with your private key, the push service verifies it. Without this, anyone who obtained the endpoint URL could spam your users.

The push service queues the message and delivers it to the browser (waking it if needed). The browser hands it to your service worker's `push` event handler, which runs even with no tab open. From there, you control what happens: show a `Notification`, sync data, update a badge.

### Mental model

Think of it like a letter-drop system. Each user gets a mailbox (the push subscription endpoint) at a post office run by the browser vendor. Only you have the stamp (VAPID key) proving mail is from your app. The post office holds mail until the recipient's device is online, then delivers it. Your service worker is the person who checks the mailbox and decides whether to ring the doorbell.

### Practical scenarios

**Frontend**: Handle the `push` event in your service worker, parse the payload with `event.data.json()`, and call `self.registration.showNotification()`. Store the subscription in your backend when the user opts in via `PushManager.subscribe()`. The tricky part is permission UX — browsers block sites that immediately prompt on load; gate it behind a user action.

**Fullstack**: On the server side, use a library like `web-push` (Node) or `pywebpush` (Python) to handle the encryption and VAPID signing. You'll store subscriptions per user, handle `410 Gone` responses from the push service (subscription expired — delete it), and manage broadcast vs. targeted delivery. This integrates naturally with background jobs: a new order, a deployment finishing, a price alert.

### When to reach for it

Use it when you need to re-engage users outside your app — alerts that have time sensitivity or require no user presence. Avoid it for things better served by polling or SSE while the tab is open; push is heavier infrastructure for the asynchronous, out-of-tab case.
