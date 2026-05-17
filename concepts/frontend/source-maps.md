---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Source Maps

When your bundler ships minified JavaScript, every error trace points to line 1, column 43291 of `bundle.js` — meaningless. Source maps fix this by providing a separate `.map` file that encodes a precise mapping from each position in the output back to the original file, line, and column in your source.

**The core mechanism**

A source map is a JSON file with a `mappings` field containing [VLQ-encoded](https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit) segments. Each segment encodes four numbers: generated column → source file index → original line → original column. Browsers and Node decode these at runtime when you open DevTools or when a source-map-aware error reporter (Sentry, for example) processes a stack trace. The map itself never runs — it's metadata consumed by tooling.

The file reference is embedded as a comment at the bottom of your bundle:

```js
//# sourceMappingURL=bundle.js.map
```

Or via an HTTP header (`SourceMap: /bundle.js.map`) if you don't want the URL in the file itself.

**Concrete mental model**

Think of it as a translation dictionary. Your bundler ran `webpack` or `esbuild`, took 300 files, and collapsed them into one. The map is the index that says: "the function at byte offset 12,847 in `bundle.js` came from `src/utils/debounce.ts`, line 14, column 3." DevTools reconstructs your original file tree from this — that's why breakpoints "just work" in the Sources panel despite the browser only loading the bundle.

**Practical patterns**

*Frontend:* The typical production setup is `hidden-source-map` (webpack) or `external` (esbuild) — maps are generated and uploaded to your error monitoring tool (Sentry, Datadog) but not publicly served. This gives you readable stack traces in your dashboard without exposing source to end users. If you serve maps publicly, anyone can recover your unminified code.

*Fullstack (Node/SSR):* Node doesn't load source maps automatically — you need `--enable-source-maps` (Node 12.12+) or a library like `source-map-support`. Without this, unhandled exceptions in your SSR layer show bundled positions even in development. This bites teams that SSR with esbuild or tsup and forget to enable it.

**Common pitfalls**

- **Mismatched maps**: CI builds must upload maps atomically with the deploy. If your CDN serves `bundle.js` from deploy N but your error tool has maps from deploy N-1, every stack trace is wrong.
- **Inline source maps in production** (`eval-source-map`): convenient for dev, but each module is base64-encoded into the bundle — dramatically increases payload size and exposes source.
- **TypeScript path aliases not resolving**: source map paths are relative to where the bundler wrote them. If you move artifacts, the `sourceRoot` field needs to compensate or paths break.

Source maps are largely invisible when working correctly — you only notice them when they're wrong, which is usually a build pipeline misconfiguration rather than a concept misunderstanding.
