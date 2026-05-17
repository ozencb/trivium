---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Image Lazy Loading

The browser's default behavior fetches every `<img>` on page load regardless of whether the user will ever scroll to it. Lazy loading defers those off-screen requests until the image is near the viewport, cutting initial payload and speeding up LCP for content that actually matters.

### Core mechanism

There are two paths: the native `loading="lazy"` attribute and the manual Intersection Observer approach.

`loading="lazy"` is declarative and handled entirely by the browser. The browser maintains an internal distance threshold (typically a few hundred pixels, device and connection-speed dependent) and begins fetching images as the user scrolls toward them. Zero JS required.

The Intersection Observer path gives you explicit control: you observe a target element, fire a callback when it enters a root margin, then swap a `data-src` into `src` to trigger the fetch. This matters when you need custom thresholds, need to lazy-load background images (`background-image` in CSS isn't handled by native lazy loading), or need to support behavior in older browsers.

### Mental model

Think of it like virtualizing a list. Instead of rendering 500 rows into the DOM upfront, you render only what's visible plus a small buffer. Lazy loading does the same for network requests: the image slots exist in layout, but the actual bytes are fetched on demand.

### Practical scenarios

**Frontend:** An image-heavy editorial page or photo gallery is the canonical case. Native `loading="lazy"` on `<img>` tags takes 30 seconds to add and meaningfully reduces initial load time. One common pitfall: forgetting to set explicit `width` and `height` attributes. Without them, the browser can't reserve layout space and you get cumulative layout shift (CLS) as images load in—trading one performance problem for another.

**Fullstack:** When you're rendering product grids server-side, lazy loading pairs naturally with infinite scroll or paginated APIs. The images below the fold don't load until needed, but your SSR HTML still includes the `<img>` tags (with dimensions) so the layout is stable. If you're serving images through a CDN transform service (Cloudinary, imgix), lazy loading also reduces CDN egress costs—you stop paying for images users never reached.

### When to reach for it

Default to `loading="lazy"` on any image not in the initial viewport—hero images and above-the-fold content should be `loading="eager"` (or omit the attribute). Reach for Intersection Observer when you need background-image lazy loading, fine-grained threshold control, or custom analytics on image visibility. Avoid lazy loading small icons or sprites; the overhead isn't worth it and it can hurt perceived performance for UI elements users expect immediately.
