---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Source Maps

A source map is a file that encodes a bidirectional mapping between transformed output (minified/bundled JS, compiled TS, transpiled JSX) and the original source files. Without them, runtime errors in production point into unreadable one-liner bundles; with them, devtools reconstruct the original file, line, and column.

### The core mechanism

When a bundler like Webpack or esbuild produces `bundle.js`, it optionally emits `bundle.js.map` — a JSON file containing:

- `sources`: array of original file paths
- `sourcesContent`: (optional) the original file contents, inlined
- `mappings`: a VLQ (Variable-Length Quantity) encoded string that maps every position in the output back to a position in a source file

The `mappings` field is the dense part. Each segment encodes a tuple: `[generated column, source file index, original line, original column]`. VLQ encoding keeps it compact. A typical map file might have a `mappings` string like `AAAA,SAAS,IAAI` — each comma-separated group is a line; semicolons separate generated lines.

The output file references its map via a trailing comment:
```js
//# sourceMappingURL=bundle.js.map
```

Devtools detect this, fetch the map, and use it to remap stack traces and set breakpoints in original source.

### Concrete mental model

Think of it as a translation dictionary between two coordinate systems. The browser executes code at `bundle.js:1:4523`. The source map says: "column 4523 on line 1 of the output corresponds to line 47, column 12 of `src/auth/login.ts`." Devtools do this lookup transparently every time you see a stack trace or set a breakpoint.

### Practical scenarios

**Frontend:** You ship a React app minified and split into chunks. A user reports a runtime error. Sentry (or any error tracker) receives the minified stack trace, then uses your uploaded source maps to show you the exact component and hook where the throw originated — file name, line, even variable names if `sourcesContent` is included. Without maps, that stack trace is useless.

**Fullstack (Node.js):** If you compile TypeScript server code with `tsc` or bundle with esbuild, crashes in production reference `.js` output. With source maps enabled (`--enable-source-maps` in Node 12+), `Error.stack` is automatically remapped to the original `.ts` lines. Same principle, same format, different runtime.

### Things worth knowing

- **Inlined vs. external maps**: `sourceMappingURL=data:application/json;base64,...` inlines the map directly. Convenient for dev, wasteful for production — external maps are better.
- **Security tradeoff**: Uploading source maps to your CDN exposes your original source to anyone who looks. Most teams upload maps only to their error tracker, not the public origin.
- **`sourceRoot`**: Lets you rebase all source paths — useful when your CI build paths differ from what devtools expect.
