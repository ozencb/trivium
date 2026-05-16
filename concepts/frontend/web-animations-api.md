---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

The Web Animations API (WAAPI) is a JavaScript interface that exposes the browser's animation engine directly, giving you programmatic control over animations with the same performance characteristics as CSS animations — without the CSS.

## Core Mechanism

CSS animations and transitions already run on the compositor thread (hence their performance advantage over JS-driven `requestAnimationFrame` loops). WAAPI doesn't bypass that — it *integrates with it*. When you call `element.animate()`, the browser schedules the animation through the same internal pipeline that handles `@keyframes`. You're not polling a frame loop; you're handing work to the rendering engine and getting back a handle (`Animation` object) to control it.

That handle is the key difference from CSS. You get:
- `animation.pause()` / `animation.play()` — runtime control
- `animation.currentTime` — scrub to any point
- `animation.playbackRate` — reverse or slow-motion in one line
- `animation.finished` — a Promise that resolves on completion

```js
const anim = element.animate(
  [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }],
  { duration: 300, easing: 'ease-out', fill: 'forwards' }
);

anim.finished.then(() => element.classList.add('visible'));
```

## Mental Model

Think of it as CSS `@keyframes` + `animation-*` properties, but constructed at runtime and returned as a controllable object. You get the perf of CSS with the dynamism of JS.

## Practical Scenarios

**Frontend:** Gesture-driven UI (drag to dismiss, pull to refresh) needs animations that track user input mid-flight. WAAPI's `currentTime` scrubbing lets you tie animation progress directly to a scroll offset or pointer position — something CSS alone can't do cleanly without `animation-delay` hacks or JS recalculating styles every frame.

**Fullstack (data-driven UIs):** When rendering list updates from a server (new items, reordering), you often need staggered entrance animations keyed to dynamic data. WAAPI lets you loop over elements and animate each with a computed `delay` without injecting `animation-delay` into inline styles or maintaining a stylesheet per-component. The animation logic stays in JS where the data already lives.

## Where it fits vs. alternatives

Use CSS transitions when the trigger is a class toggle and you don't need runtime control. Use `requestAnimationFrame` when you need per-frame custom calculations (physics, canvas). Use WAAPI when you need keyframe-based animation *with* runtime control — seeking, pausing, reversing, chaining via `.finished`.

Browser support is solid (all modern browsers). The main gap historically was `KeyframeEffect` compositing options, but that's largely resolved.
