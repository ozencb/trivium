---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Responsive images** let the browser download the most appropriate image for the current device, rather than forcing every device to download the same asset — the core problem being that a 4K hero image wastes bandwidth on a phone and looks terrible scaled up on a Retina display.

## The Core Mechanism

The browser knows two things you don't at markup-writing time: the user's screen resolution (device pixel ratio) and the rendered layout width of the element. Responsive images give the browser a *menu* of image variants and the rules to choose among them, deferring that decision to request time rather than compile time.

There are two orthogonal axes:

**Resolution switching** — same image, different sizes. You provide `srcset` with width descriptors (`w`), and `sizes` tells the browser how wide the `<img>` will render at various viewport widths. The browser multiplies: if the image renders at 600px on a 2x display, it looks for an asset ≥ 1200px wide.

```html
<img
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(max-width: 768px) 100vw, 50vw"
  src="hero-800.jpg"
  alt="Hero"
/>
```

**Art direction** — different images at different contexts (crop, aspect ratio, subject framing). Use `<picture>` with `<source media="...">` for this; the browser picks the first matching source.

```html
<picture>
  <source media="(max-width: 600px)" srcset="hero-portrait.jpg" />
  <img src="hero-landscape.jpg" alt="Hero" />
</picture>
```

## Mental Model

Think of it like a CDN serving the right cache tier. You pre-generate variants; the browser's layout engine calculates demand at request time and picks from your menu. `src` is the fallback, not the primary.

## Practical Scenarios

**Frontend:** A marketing site with a full-bleed hero. Without responsive images, a 2MB desktop image loads on mobile over 4G. With `srcset`/`sizes`, mobile gets a 200KB crop. The critical rendering path is shorter; LCP improves measurably.

**Fullstack:** When you control image uploads (e.g., user avatars, product photos), your server-side pipeline should generate variants on ingest — typically via Sharp, ImageMagick, or a service like Cloudinary/imgix. The backend concern is generating and storing variants; the frontend concern is expressing the selection hints correctly. If you're using Next.js, `<Image>` handles this automatically via its image optimization API, but understanding the underlying mechanism tells you *why* the `sizes` prop matters and why omitting it causes it to default to 100vw (and over-fetch).

## Connection to What's Next

Responsive images and lazy loading compose cleanly: `sizes`/`srcset` determine *which* asset loads, `loading="lazy"` determines *when*. Both are about deferring or reducing network cost — different levers on the same problem.
