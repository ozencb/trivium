---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Font Loading Strategies

Browsers have to decide what to do when your CSS references a web font that hasn't loaded yet: show invisible text while waiting (FOIT), show a fallback font and swap later (FOUT), or something in between. Font loading strategies are how you control that decision explicitly rather than accepting browser defaults.

### The core mechanism

When the browser hits a `@font-face` rule with an external `src`, it starts a network request. Meanwhile, any text element using that font enters a "block period" — the browser holds rendering of that text. The `font-display` descriptor inside `@font-face` controls two variables: how long to block, and whether/when to swap to the real font once it loads.

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
```

The five `font-display` values map to different block/swap windows:
- `block` — long block period, indefinite swap (classic FOIT)
- `swap` — zero block, indefinite swap (FOUT, but text always visible)
- `fallback` — 100ms block, 3s swap window, then sticks with fallback
- `optional` — 100ms block, no swap (browser uses the font only if it arrives in time; good for non-critical fonts)
- `auto` — browser decides (usually `block`)

`swap` is the most common recommendation, but `optional` is underused — it's ideal for decorative fonts where fallback is acceptable, and it also lets the browser skip the download entirely on slow connections.

### Preloading

`font-display: swap` still means the font arrives late. To close that window, preload the font so it's in-flight before the stylesheet even parses:

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

The `crossorigin` attribute is required even for same-origin fonts — browsers make font requests in anonymous CORS mode.

### Subsetting

Font files are large. A full Latin typeface can be 200–400KB. Subsetting strips out glyphs you don't use — if your product is English-only, you don't need Cyrillic or Greek character ranges. Tools like `pyftsubset` or services like Google Fonts' `text=` parameter let you ship only the characters you actually render, often reducing file size by 70–90%.

### Where this matters in practice

**Frontend:** Landing pages and marketing sites are where FOIT/FOUT hurts most — content is what users came to read, and invisible or jumping text is jarring. Use `swap` + preload for your primary body font, `optional` for display/headline fonts.

**Fullstack:** If you're server-rendering, the HTML is ready immediately but fonts still arrive async. This makes the FOIT/FOUT problem *more* visible, not less — the user sees actual content sooner, which makes the flash more obvious. SSR doesn't fix this; you still need explicit font loading strategy.

**Common pitfall:** Preloading every font variant. If you preload bold and italic as well as regular, you've added 3 high-priority requests. Preload only the critical path font (usually your body regular weight) and let others load normally.
