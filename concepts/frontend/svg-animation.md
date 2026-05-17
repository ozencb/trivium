---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

SVG animation lets you animate vector graphics using CSS transitions/animations or the Web Animations API (WAAPI), keeping output resolution-independent and DOM-queryable — unlike canvas, which is a pixel buffer you can't inspect or style.

**Core mechanism**

SVG elements are DOM nodes, so the same animation primitives that work on `<div>` also work on `<circle>`, `<path>`, `<rect>`, etc. CSS `transform`, `opacity`, `fill`, `stroke-dasharray` — all animatable. WAAPI (`element.animate(...)`) gives you programmatic control with keyframes and timing options without managing `requestAnimationFrame` loops manually.

The interesting bit is `stroke-dasharray` / `stroke-dashoffset`. A stroked path has a measurable length (`path.getTotalLength()`). Set `stroke-dasharray` to that length and animate `stroke-dashoffset` from that length to 0, and the stroke appears to draw itself. This is the "line drawing" effect you see everywhere on landing pages.

```js
const path = document.querySelector('path');
const len = path.getTotalLength();
path.style.strokeDasharray = len;
path.animate(
  [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
  { duration: 1200, easing: 'ease-in-out', fill: 'forwards' }
);
```

**Path morphing** (animating `d` between two shapes) is where it gets painful. CSS can't tween paths natively in most browsers. You either need matching node counts between shapes, use a library like GSAP's MorphSVG, or reach for Lottie (which pre-bakes animation from After Effects). Don't assume `d` is animatable cross-browser without testing.

**Practical scenarios**

*Frontend:* Icon micro-interactions (hamburger → close, play → pause), progress rings using `stroke-dashoffset`, animated illustrations on scroll via `IntersectionObserver`. These are cases where CSS animation suffices — no JS overhead, GPU-composited transforms.

*Fullstack:* Data visualization dashboards where SVG is already your rendering layer (D3, Recharts). Animating bars, arcs, or line paths on data update is natural here — enter/update/exit transitions are well-established D3 patterns. The SVG is server-agnostic; just update the DOM and let WAAPI handle the visual transition.

**When to reach for this vs. alternatives**

- Use SVG animation when you already have vector assets or icon systems, or when you need crisp scaling at any DPI.
- Use CSS-only when animations are simple transforms/opacity — composited, no JS required.
- Use WAAPI when you need playback control (pause, reverse, seek).
- Reach for Lottie when designers are producing animations in After Effects.
- Reach for canvas/WebGL when you need thousands of animated elements — SVG DOM doesn't scale past a few hundred animated nodes without perf hits.

The main gotcha beyond path morphing: `transform-origin` behavior on SVG elements differs from HTML elements across browsers, and `clip-path` animations have edge cases especially on Safari. Test those early.
