---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

The Web Animations API (WAAPI) gives you programmatic control over animations that run on the browser's compositor thread — the same thread CSS animations use — without the main-thread jank of `requestAnimationFrame`-driven loops. The key insight: you describe *what* to animate (keyframes + timing), hand it to the engine, and the engine handles scheduling and compositing.

## Core mechanism

`element.animate(keyframes, options)` returns an `Animation` object backed by a native animation timeline. The browser runs this on the compositor thread, meaning it survives main-thread JS blocking. But unlike pure CSS, you get a live handle:

```js
const anim = el.animate(
  [{ transform: 'translateX(0)' }, { transform: 'translateX(200px)' }],
  { duration: 400, easing: 'ease-out', fill: 'forwards' }
);

anim.pause();
anim.currentTime = 200; // seek to midpoint
anim.playbackRate = 2;  // double speed
await anim.finished;    // Promise resolves on completion
```

That `finished` Promise is underused but critical for sequencing — replaces the `animationend` event listener dance.

## Mental model

Think of it as CSS animations with a remote control. CSS animations are "fire and forget" — you declare them, they run, you have no handle. `requestAnimationFrame` gives you full control but forces everything through JS. WAAPI sits in between: compositor-thread performance, but you can pause, seek, reverse, and chain.

## Practical scenarios

**Frontend:** Gesture-driven UI is the canonical use case. Swipe-to-dismiss, drag-and-drop snap-back, scroll-linked reveals. The ability to set `currentTime` directly lets you tie animation progress to scroll position or pointer coordinates without `rAF` loops that block layout. Also useful for orchestrating multi-step animations by chaining `finished` Promises rather than stacking `setTimeout` calls.

**Fullstack:** Less direct, but if you're building a component library or design system, WAAPI is the right foundation for motion primitives — you get deterministic, testable animations (you can manipulate `currentTime` in tests) rather than CSS class toggling with opaque timing. Also relevant if you're doing server-side rendering with hydration: WAAPI animations are applied imperatively after mount, so they don't conflict with SSR'd styles the way CSS-in-JS animation libraries sometimes do.

## When to reach for it

- You need to seek, pause, or reverse an animation based on user input
- You need to sequence animations without `setTimeout` fragility
- You're building something gesture-driven where animation progress maps to a continuous input value
- You want CSS animation performance without losing JS control

## Common pitfalls

`fill: 'forwards'` leaves the animation in a "finished but holding" state — it doesn't commit styles to the element. If you later remove the animation, styles revert. Commit them manually with `getComputedStyle` then cancel, or use the Waapi `commitStyles()` method. Also: keyframe `offset` values must be between 0–1, not percentages like CSS.
