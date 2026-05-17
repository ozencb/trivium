---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Module Federation

Module Federation lets independently-deployed applications share live JavaScript modules at runtime — a remote app exposes a component or utility, and a host app imports it dynamically without either app knowing about the other at build time.

**The core mechanism**

Each app is configured with a `ModuleFederationPlugin` (Webpack 5, or equivalents in Vite/Rspack). Remotes declare what they `expose`; hosts declare which `remotes` to load and what `shared` libraries to negotiate (React, etc.). The remote's build emits a `remoteEntry.js` — a small manifest and async loader. At runtime, the host fetches that file from the remote's deployed URL, resolves the exposed module graph, and dynamically imports the code. Webpack's chunk-loading mechanism handles the rest.

The `shared` config is where most complexity lives: if both apps depend on React, the runtime negotiates which version to use based on semver ranges, loading only one copy. Get this wrong and you get multiple React instances, breaking hooks silently.

**Mental model**

Think of it as npm packages that are live URLs instead of installed artifacts. The remote is a running package that you can update independently without the host rebuilding. The contract is just: a URL and an agreed export name.

```js
// host webpack config
remotes: { checkout: 'checkout@https://checkout.company.com/remoteEntry.js' }

// host code — fetched at runtime, not bundled at build time
const CheckoutPage = lazy(() => import('checkout/CheckoutPage'))
```

**Practical scenarios**

*Frontend:* Large orgs where 3 teams own 3 product areas — each deploys independently, the shell app composes them. No release trains. Also useful for design systems: update a component in one place, all consumers get it without rebuilding.

*Fullstack:* A BFF team can own their API and their UI slice end-to-end. The coupling surface becomes a URL + module contract rather than a shared package version.

*DevOps:* Each remote has its own CI/CD pipeline. The real gotcha: `remoteEntry.js` must be aggressively cache-busted (no-cache headers), but the chunks it references can be long-cached with content hashing. Get this backwards and users see stale UIs.

**Where engineers miscalibrate**

- **Version negotiation failures**: unconstrained semver ranges in `shared` can cause two React instances to load — no warnings, just broken hooks
- **Type safety gap**: remotes have no TypeScript types at the host's build time; you need `@module-federation/typescript` or manually maintained type packages
- **Runtime errors need fallbacks**: if the remote is down, the dynamic import throws — most teams underplan this
- **LCP cost**: fetching `remoteEntry.js` is a serial roundtrip after initial parse; it adds measurable latency if the remote is slow

**When to reach for it vs. when not to**

Module Federation earns its complexity when teams need independent deploy cadences and the integration surface is stable (a routed page, a widget). It's overkill for small teams or when a monorepo with proper code splitting gets you 90% of the benefit with none of the distributed coordination overhead. The senior-level take in design discussions: lead with "what's the team topology?" before proposing the architecture.
