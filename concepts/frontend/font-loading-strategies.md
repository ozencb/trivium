---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Font Loading Strategies

Fonts are a late-discovered, potentially render-blocking resource — by default, the browser won't display text until the font file arrives, causing either invisible text or jarring layout shifts. Font loading strategies are the set of tools for controlling that tradeoff.

### The core problem

The browser discovers fonts *late* in the Critical Rendering Path. It must parse HTML, build the CSSOM, find `@font-face` declarations, then determine which fonts are actually used by visible elements — only *then* does it request them. This late discovery means even a fast network connection produces a noticeable delay.

Two failure modes emerge from this:

- **FOIT** (Flash of Invisible Text): text is hidden while the font loads
- **FOUT** (Flash of Unstyled Text): text renders in a fallback font, then reflows when the custom font arrives

### The main controls

**`font-display`** (in `@font-face`) is the primary lever. Think of it as setting a timeout policy:

| Value | Block period | Swap period | Behavior |
|---|---|---|---|
| `block` | ~3s | infinite | FOIT risk — hides text then swaps |
| `swap` | none | infinite | FOUT guaranteed — shows fallback immediately |
| `fallback` | ~100ms | ~3s | brief invisible, swap if font arrives quickly |
| `optional` | ~100ms | none | browser decides based on network — no layout shift |

`optional` is interesting: on slow connections the browser just uses the fallback and *never* swaps. Good for non-critical decorative fonts. Bad if the font carries meaning.

**Preloading** solves the late-discovery problem directly:

```html
<link rel="preload" as="font" href="/fonts/inter.woff2" type="font/woff2" crossorigin>
```

This pushes font fetching to the top of the waterfall — before CSSOM is even built — at the cost of a higher-priority network request that might compete with more critical resources.

**Font subsetting** reduces file size by stripping unused glyphs. Shipping only Latin characters instead of full Unicode can cut a font from 200KB to 20KB.

### Practical scenarios

**Frontend:** On a content-heavy site (blog, docs), `font-display: swap` with a carefully matched fallback stack (`font-family: 'Inter', system-ui, sans-serif`) minimizes FOIT while keeping layout shift acceptable. Pair it with a preload hint for the weight used above the fold.

**Fullstack:** Next.js `next/font` handles this automatically — it self-hosts Google Fonts at build time, injects the right `font-display` value, generates preload hints per-route, and subsets to only characters actually present in your content. The lesson: what used to require manual coordination across CSS, HTML `<head>`, and CDN config is now a build-time concern. When you're implementing SSR from scratch, you'd replicate this by generating route-aware preload hints in your `<head>` template.

The general heuristic: preload the font used for your largest contentful text, use `font-display: fallback` or `swap`, and invest in a fallback font stack that minimizes visual shift when the swap happens.
