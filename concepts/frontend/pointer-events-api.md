---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Pointer Events API

The Pointer Events API replaces the fragmented world of `mousedown`/`touchstart`/`touchmove` with a single unified event model. The motivation is straightforward: device diversity exploded, and maintaining parallel event handler trees for mouse and touch became a maintenance burden that also introduced subtle behavioral inconsistencies.

### Core mechanism

The spec defines a set of events — `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerenter`, `pointerleave` — that fire regardless of input device. Each event carries a `pointerType` property (`"mouse"`, `"touch"`, `"pen"`) so you can branch on device when you actually need to, rather than by default.

Each pointer gets a unique `pointerId`, which is the key to multi-touch: a two-finger pinch gives you two simultaneous `pointermove` events with different IDs. You track them in a Map and diff positions to compute scale or rotation.

The events also expose `pressure`, `tiltX`, `tiltY`, and `twist` — metadata most input types leave at defaults (pressure 0.5 for mouse clicks) but stylus devices populate meaningfully.

### The one thing that matters most: `setPointerCapture`

The method `element.setPointerCapture(event.pointerId)` is the feature that makes drag interactions actually reliable. Normally, if the pointer leaves an element during a drag, `pointermove` stops firing on it. Capture locks all events for that pointer ID to that element until `pointerup` or explicit release. Without this, fast drag gestures break when the user moves quicker than the element can follow — a classic bug in home-rolled drag implementations.

```js
el.addEventListener('pointerdown', e => {
  el.setPointerCapture(e.pointerId);
});
el.addEventListener('pointermove', e => {
  // fires even if pointer is outside el
});
```

### When to reach for this

**Frontend**: Any custom drag-and-drop, resizable panels, sliders, or canvas drawing tools. You write the handler once and it works across desktop mouse, touchscreen, and stylus without branching. The ergonomics over `touch-action` CSS + separate touch event handlers are significant.

**Fullstack / embedded UIs**: Dashboard widgets with draggable panes, map interfaces, signature capture fields. These are the places where you'd otherwise maintain two code paths and discover a month later that touch cancels on scroll in iOS.

### Common pitfalls

- **Forgetting `touch-action: none`** on the element — the browser may intercept touch events for scrolling before they reach your handler.
- **Not handling `pointercancel`** — fires when the OS interrupts the gesture (e.g., notification pull-down). Treat it like `pointerup` or you'll leave state stuck.
- **IE/old Edge** had an older implementation (`MSPointerEvent`) — not relevant unless you're supporting genuinely ancient enterprise browsers, in which case there's a polyfill.

Browser support is universal at this point. If you're writing anything interactive that needs to work on touch, this is the current standard approach, not a progressive enhancement.
