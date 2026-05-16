---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Module Federation

Module Federation lets separately deployed JavaScript applications share code at runtime — without bundling it together at build time. It's the missing infrastructure that makes micro-frontends practical rather than theoretical.

### Core mechanism

Webpack 5 introduced Module Federation as a first-class plugin. The idea: any application can declare itself a **host** (consumer), a **remote** (provider), or both. A remote exposes specific modules — components, utilities, even full routes — and publishes a `remoteEntry.js` manifest. A host declares which remotes it depends on and at what URL to fetch them. At runtime, the host fetches that manifest, then lazily loads only the specific modules it needs, directly from the remote's own deployment.

The critical detail: shared dependencies (React, lodash, etc.) can be configured as **singletons**. If both host and remote depend on React 18, only one copy loads. Webpack negotiates this at runtime via a shared scope object, preventing the duplicate-React problem that breaks hooks and causes subtle version conflicts.

Contrast this with npm packages: those are resolved at build time and bundled in. Module Federation resolves at runtime, meaning a remote can be redeployed independently and the host picks up the new version on next load — no host rebuild required.

### Concrete mental model

Imagine a shell app (host) that owns the nav and routing. It knows that `/checkout` belongs to the checkout team's app (remote). When a user navigates there, the shell fetches `https://checkout.internal/remoteEntry.js`, resolves the `CheckoutPage` module, and renders it — same process as a dynamic import, but crossing deployment boundaries. The checkout team ships independently; the shell just needs the URL to stay stable.

### Practical scenarios

**Frontend:** The obvious one — micro-frontends. Each product domain owns its bundle, ships on its own cadence. You get team autonomy without iframes or full-page navigations.

**Fullstack:** A Node.js SSR app can act as a host that federates modules from client-side remotes during hydration. You can also federate server-side rendering utilities between services if you're running Node — though this is less common and requires careful runtime environment matching.

**DevOps:** This is where it gets interesting. Each remote is just a static asset bundle on a CDN. You version it by content hash, feature flag which `remoteEntry.js` URL the host points to, and you've got runtime A/B testing or canary deployments of individual micro-frontends — without touching the host. Rollback is a URL swap. The tradeoff is that you now have a distributed runtime dependency graph, so you need observability around remote fetch failures and version compatibility.

The main footgun: implicit coupling through shared state or non-singleton dependencies. Federation solves the deployment boundary problem, not the design boundary problem.
