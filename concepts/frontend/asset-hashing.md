---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Asset Hashing and Cache Busting

When you deploy updated JavaScript or CSS, browsers that cached the old files won't pick up the changes until their cache expires — unless the filename itself changes. Asset hashing solves this by embedding a hash of the file's content into the filename at build time, so a changed file gets a changed URL, which the browser treats as a new resource entirely.

**The core mechanism**

Your bundler (Webpack, Vite, esbuild) reads each output file's contents and produces a hash — typically a truncated SHA-256 or a content-dependent hash like xxHash. That hash becomes part of the filename: `main.a3f92b1c.js`. The key property is determinism: the same content always produces the same hash, and any byte-level change produces a different one. This lets you set `Cache-Control: max-age=31536000, immutable` — effectively telling browsers "this URL's content will never change, cache it forever." When you redeploy with updated code, the hash changes, the filename changes, and the browser fetches the new file cold.

The HTML (or server-rendered response) always references the latest hashes. That's the one thing that *cannot* be aggressively cached — it's the entry point that resolves everything else.

**Concrete example**

Before build: `app.js`  
After build: `app.3d9f2a.js`, `app.c71b44.js` (next deploy)

Your `index.html` contains a script tag pointing to `app.3d9f2a.js`. After deploy it points to `app.c71b44.js`. A returning user's browser has `app.3d9f2a.js` cached — it's still valid and is never re-fetched. The new `app.c71b44.js` gets fetched fresh. Zero stale asset problem, zero wasted bandwidth re-downloading unchanged files.

**Practical scenarios**

*Frontend SPA*: Most of your bundle is vendor code (React, lodash, etc.) that rarely changes. With code splitting and separate chunk hashing, vendor chunks keep their hash across most deploys — users only re-download the chunks that actually changed. This is the real performance win beyond just correctness.

*Fullstack (Next.js, Rails with Sprockets, Django + Webpack)*: The server controls `index.html` or the layout template, so it can inject the current asset hashes at render time or reference a manifest file the bundler produces. The manifest (e.g., `asset-manifest.json`) maps logical names to hashed filenames — your server reads this at startup or request time.

**Common pitfalls**

- **Caching `index.html` aggressively**: If your CDN or server caches the HTML with a long TTL, users get stale script/link tags pointing to old hashes. `Cache-Control: no-cache` on HTML is correct here.
- **Hash instability**: Poorly configured chunking causes unrelated hashes to change (module IDs shift, runtime chunk changes). Webpack's `runtimeChunk: 'single'` and stable module IDs exist specifically to minimize this.
- **Source maps**: Hashed filenames mean your error monitoring needs a sourcemap upload step at deploy time that correlates the hashed name back to original source.
