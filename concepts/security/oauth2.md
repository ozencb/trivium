---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

OAuth 2.0 is a delegated authorization framework — it lets a user grant a third-party application limited access to a resource they own, without handing over their credentials. The key insight is separation: the entity that *authenticates* the user and the entity that *holds* the resource can be different systems.

## Core Mechanism

OAuth 2.0 defines four roles: **Resource Owner** (the user), **Client** (your app), **Authorization Server** (issues tokens), and **Resource Server** (holds the protected data, e.g., a user's Google Drive files).

The most common flow is the **Authorization Code Flow**:

1. Your app redirects the user to the Authorization Server with a `client_id`, requested `scope`, and a `redirect_uri`.
2. The user authenticates *directly* with the Authorization Server and approves the scope.
3. The Auth Server redirects back to your app with a short-lived **authorization code**.
4. Your backend exchanges that code (plus a `client_secret`) for an **access token** and optionally a **refresh token** — this exchange happens server-to-server, never in the browser.
5. Your app uses the access token to call the Resource Server on behalf of the user.

The code-exchange step matters: the authorization code is visible in the browser redirect, but the actual token lives only in your backend. This is why the Authorization Code Flow exists — it keeps credentials off the front channel.

## Mental Model

Think of it like a hotel key card system. You (the user) check in with the front desk (Authorization Server), which gives you a key card (access token) scoped only to room 304 — not the master key. You hand that card to a bellhop (your app) to access your room. The bellhop never knew your identity, never touched the master credentials, and the card expires.

## Practical Scenarios

**Backend:** You're building an API that needs to read a user's GitHub repositories. You register your app with GitHub, implement the Authorization Code Flow, store the access token per-user in your database, and use it to call GitHub's API. When the token expires, you use the refresh token to get a new one without re-prompting the user.

**Fullstack:** You're building a dashboard that integrates Google Calendar. Your Next.js backend handles the OAuth dance — redirects, code exchange, token storage. The frontend never sees tokens directly. On subsequent requests, your backend reads the stored token, calls Google's API, and returns the shaped data. The user's Google password is never in your system at any point.

## What OAuth 2.0 Is *Not*

It's an authorization protocol, not authentication — it tells you what a user *can access*, not *who they are*. That gap is exactly what OpenID Connect fills by adding an identity layer on top.
