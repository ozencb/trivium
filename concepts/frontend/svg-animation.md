---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

SVG animation lets you bring scalable vector graphics to life using the same DOM, CSS, and JS tools you already know — it's the backbone of icon micro-animations, data viz transitions, and animated logos that stay crisp at any resolution.

## Core mechanism

SVGs are XML embedded in HTML. Every shape (`<circle>`, `<rect>`, `<path>`) is a real DOM element with attributes like `cx`, `fill`, `stroke-dashoffset`, and `d`. Animation is just changing those attributes over time via three approaches:

1. **CSS** — `transition` and `@keyframes` work on SVG properties (`fill`, `opacity`, `transform`). But CSS can't animate the `d` attribute (path shape) in all browsers.
2. **JS / Web Animations API** — `element.animate()` or GSAP drive any attribute imperatively. Use this for sequenced or complex animations.
3. **SMIL** — declarative `<animate>` tags inside SVG markup. Chrome deprecated it; skip it.

## The canonical trick worth knowing

The "self-drawing path" effect powers most SVG animations you've seen on landing pages:

```js
const path = document.querySelector('path');
const length = path.getTotalLength();

path.style.strokeDasharray = length;
path.style.strokeDashoffset = length;

// Animate to 0 → path draws itself
path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
  duration: 1000, fill: 'forwards'
});
```

`stroke-dasharray` defines a dashed pattern; setting it equal to path length makes the whole path one "dash." `stroke-dashoffset` shifts that dash out of view. Animating offset to 0 reveals it.

## The `transform-origin` gotcha

SVG elements use the SVG coordinate system for `transform-origin`, not the element's own bounding box. `transform-origin: center` on an SVG `<rect>` doesn't mean what you think — it means center of the entire SVG viewport. GSAP corrects this automatically; vanilla CSS will surprise you.

For performance, same rules as HTML: only animate `transform` and `opacity` to stay compositor-only. Animating `fill` or `d` triggers repaint.

## Practical scenarios

**Frontend**: Checkmark/success animations (e-commerce, form validation), animated progress rings, skeleton loaders, D3 chart transitions (D3 operates directly on SVG attributes), interactive infographics.

**Fullstack**: SVG is just an XML string, so you can generate it server-side — useful for dynamic charts in transactional emails or PDF exports where canvas isn't available. Server-rendered SVG with client-side animation hydration is a common pattern in dashboard products.
