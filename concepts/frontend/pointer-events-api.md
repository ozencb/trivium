---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Pointer Events API

The Pointer Events API is a unified input model that handles mouse, touch, and stylus interactions through a single event interface, replacing the fragmented `MouseEvent`/`TouchEvent` split. It exists because "write once, handle all input devices" is genuinely hard without it.

### Core Mechanism

Every pointer device — mouse, finger, stylus, even certain gamepads — is abstracted into a `PointerEvent`. Each event carries a `pointerId` (stable for the duration of a gesture), `pointerType` (`"mouse"`, `"touch"`, `"pen"`), and pressure/tilt metadata for devices that support it.

The critical behavior difference from mouse events: pointers can be *captured*. When you call `element.setPointerCapture(event.pointerId)`, all subsequent events for that pointer are routed to that element even if the pointer moves outside it. Mouse events don't have this — you'd historically hack around it by attaching `mousemove` to `document` during a drag.

The event lifecycle is:
```
pointerdown → pointermove* → pointerup
                           ↘ pointercancel (e.g. browser gesture takes over)
```

`pointercancel` is the event that mouse-only code never handled correctly — it fires when the browser decides to take over (scroll gesture on touch, OS-level interruption), letting you clean up drag state gracefully.

### Mental Model

Think of it as a normalized hardware abstraction layer in the browser. The same drag-and-drop component works whether the user is on a MacBook trackpad, an iPad with Apple Pencil, or a Windows touchscreen — you write one event handler, not three with `if (isTouchDevice)` branches.

### Practical Scenarios

**Frontend:** Any interactive canvas, drag-and-drop UI, or custom slider benefits immediately. Instead of `mousedown + touchstart`, you write `pointerdown`. Pointer capture replaces the `document.addEventListener('mousemove')` pattern in drag implementations — call `setPointerCapture` on `pointerdown`, then `pointermove` on the element itself always fires, even if the mouse leaves the element.

**Fullstack:** If you're building a collaborative whiteboard, a signature pad, or a drawing tool, `pointerType === "pen"` plus `pressure` and `tiltX/tiltY` gives you real stylus data for free — no third-party SDK needed. On the server side, you might log or process this metadata to differentiate user behavior (e.g., analytics distinguishing touch vs. mouse sessions).

### One Practical Gotcha

Touch browsers fire `pointercancel` if you don't call `event.preventDefault()` on `touchstart` (or if you've set the element's `touch-action` CSS property incorrectly). Setting `touch-action: none` on draggable elements tells the browser to skip its native scroll/zoom behavior and let your code own all pointer events cleanly — without it, you'll get intermittent `pointercancel` firings mid-drag.
