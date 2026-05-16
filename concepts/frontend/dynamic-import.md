---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Dynamic Import** lets you load JavaScript modules on-demand at runtime rather than upfront at parse time — the key motivation being that you shouldn't pay the cost of loading code the user may never need.

## The Core Mechanism

Static `import` statements are resolved and executed before your module runs. The browser/Node has to fetch, parse, and evaluate every imported module synchronously as part of the module graph. Dynamic import — `import()` — is a runtime expression that returns a Promise. It defers that entire process until the call site executes.

```js
// Static: resolved at parse time, always loaded
import { heavyParser } from './parser.js';

// Dynamic: resolved at call time, only when needed
const { heavyParser } = await import('./parser.js');
```

The distinction matters because bundlers (Webpack, Vite, Rollup) treat dynamic imports as **split points**. A static import gets merged into the main bundle. A dynamic import gets emitted as a separate chunk that the browser fetches only when that `import()` call runs.

## Mental Model

Think of static imports as declaring dependencies at the top of a function signature — they're always there. Dynamic import is like lazy initialization: you instantiate the dependency the first time you actually need it, not before.

## Practical Scenarios

**Frontend — route-based code splitting:**
In an SPA, you don't need the `/admin` bundle when the user lands on `/home`. With dynamic import, your router only fetches each route's bundle when navigating to it:

```js
const AdminPage = React.lazy(() => import('./AdminPage'));
```

React's `lazy()` is just a thin wrapper around `import()`. The browser fetches `AdminPage.[hash].js` on first navigation to `/admin`, not on initial load.

**Frontend — feature gating:**
A rich text editor or data visualization library might be 300KB. If it's behind a button click, you can defer loading until the user actually opens that feature:

```js
button.addEventListener('click', async () => {
  const { Chart } = await import('./chart-lib.js');
  new Chart(canvas, data);
});
```

**Fullstack — Node.js conditional loading:**
In a Next.js API route or an Express server, you might only need a PDF generation library on specific endpoints. Dynamic import lets you avoid that module being loaded into every worker:

```js
export async function POST(req) {
  const { generatePDF } = await import('./pdf-generator.js');
  return generatePDF(await req.json());
}
```

## What This Unlocks

Dynamic import is the primitive that makes **code splitting** possible. Code splitting is the practice of deliberately breaking your bundle into chunks so the browser loads only what's needed for the current context — dynamic import is *how* you express those split boundaries to the bundler. Without it, you'd have one giant bundle regardless of what the user is actually doing.
