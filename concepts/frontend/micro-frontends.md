---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Micro-Frontends

The same autonomy that microservices gave backend teams — independent deploys, isolated ownership, tech-stack freedom — applied to the UI layer. Instead of a single frontend app that every team commits into, you slice the UI by business domain and let each team ship their slice on their own cadence.

**The core idea**

A traditional frontend monolith means the Checkout team can't deploy without coordinating with the Search team, because they share a build. Micro-frontends break that coupling. Each "micro-frontend" is a self-contained app (or component) with its own repo, CI pipeline, and deploy lifecycle. At runtime, a **shell app** (also called the app shell or host) composes them — pulling in each slice and stitching them into a coherent UI.

Composition can happen at different layers:
- **Build time** — each MFE is an npm package; the shell depends on them. Simple, but reintroduces coupling at deploy time.
- **Runtime via iframes** — true isolation, but terrible UX and DX. Mostly a dead end.
- **Runtime via Module Federation** (Webpack 5+) — the dominant pattern. Each MFE exposes a remote module; the shell loads it at runtime over the network. You can deploy a MFE without touching the shell.
- **Server-side composition** — an edge or server layer assembles HTML fragments from multiple origins (e.g., Zalando's Mosaic, or just an nginx `include`).

**Mental model**

Think of a news site: the header is owned by Platform, the article renderer by Content, the commenting widget by Community. Each team deploys independently. The shell knows where to fetch each piece; the user sees one coherent page.

**In practice**

*Frontend:* Routing usually splits teams cleanly — `/checkout/*` goes to the Checkout MFE, `/search/*` to Search. Shared state (auth, cart) lives either in a global event bus or a shared service, not in a component tree.

*Fullstack:* Each MFE typically owns its own BFF (backend for frontend). You end up with vertical slices of ownership from DB to UI — which is the real organizational payoff.

*DevOps:* Each MFE gets its own pipeline. This is where the complexity lands: you now have N deployment targets, N sets of infrastructure config, and cross-MFE integration testing becomes genuinely hard. Contract testing (Pact) and visual regression suites matter a lot here.

**When to reach for it**

Not before you have real org pain. A team of 15 engineers doesn't need this. The forcing function is when team coupling in the frontend is slowing deployments or causing coordination overhead that's visibly hurting velocity. At that point, the architectural complexity pays for itself. Doing it prematurely just adds infrastructure cost and cross-team API surface without the organizational benefit.

The senior-engineer signal in interviews: knowing that micro-frontends are primarily an *organizational* solution, not a technical one. The tech enables the org structure — Conway's Law, applied deliberately.
