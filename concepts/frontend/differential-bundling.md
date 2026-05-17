---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Differential Bundling

Your bundler produces two output artifacts: a modern bundle targeting browsers that support ES modules natively, and a legacy bundle compiled down to ES5 with full polyfills. The browser decides at load time which one to fetch — capable browsers take the lean path, old browsers take the bloated one. The payoff is real: modern bundles can be 15–30% smaller because they skip polyfills for things like `Promise`, `fetch`, `Array.prototype.flat`, and class syntax that V8 already handles natively.

**The mechanism**

The HTML markup does the switching via the `module`/`nomodule` attribute split:

```html
<script type="module" src="/bundle.modern.js"></script>
<script nomodule src="/bundle.legacy.js"></script>
```

Browsers that understand `type="module"` ignore `nomodule` scripts. Browsers that don't understand `type="module"` skip it entirely and fall through to the `nomodule` script. No JS detection, no runtime branching — the browser's own parser handles it.

Your bundler (Vite, webpack, Rollup) runs two separate compilation passes with different `@babel/preset-env` targets or `esbuild` targets. The modern pass targets something like `['last 2 Chrome versions', 'last 2 Firefox versions', 'Safari >= 14']` with `useBuiltIns: false` — no polyfill injection. The legacy pass targets `> 0.5%, not dead` and pulls in core-js entries for everything that might be missing.

**Where this gets tricky**

The dual-build doubles your CI build time, which matters in monorepos. You also need to be careful about third-party dependencies: some packages ship only ES5, some ship only ESM, and if you don't tree-shake correctly you'll accidentally include duplicated polyfills in both bundles. Vite's `@vitejs/plugin-legacy` handles most of this automatically, which is why it's the path of least resistance for new projects.

Another pitfall: dynamic imports. If your modern bundle code-splits with `import()`, you need to make sure the legacy bundle does too — and that the chunk manifests don't cross-reference each other. Mismatched chunk hashes between the two compilation outputs cause runtime errors that are subtle to debug.

**When to reach for it**

- **Frontend (SPA/MPA):** Worth it if you have a meaningful percentage of legacy users (Safari < 14, older Android WebViews) but don't want everyone else to pay the polyfill tax. If you're already targeting modern-only (internal tools, developer tools), skip it — the complexity isn't worth it.
- **Fullstack (Next.js, Remix):** These frameworks handle differential bundling on the client automatically. What you're more likely to tune here is the `browserslist` config that feeds into their build pipeline, and whether to opt specific routes or components into more aggressive modern-only compilation.

The real value isn't just file size — it's parse and JIT compile time. A 200KB modern bundle parsed by V8 is meaningfully faster to execute than a 260KB ES5 bundle, especially on mid-range mobile hardware where the compile cost dominates.
