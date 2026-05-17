---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS and Audio Worklets

Worklets are intentionally crippled Workers — they run in browser-internal threads that are *inside* the rendering or audio pipeline, not alongside it. The value is that certain things (custom paint logic, audio DSP) need to execute *within* the browser's own tight loops, not asynchronously fed into them from outside.

### The core mechanism

The browser's render pipeline (style → layout → paint → composite) and audio pipeline (128 samples every ~2.67ms at 48kHz) are loops the browser owns. Normal JS runs on the main thread and hands off to these loops. Worklets let you register callbacks that execute *inside* specific stages:

- **PaintWorklet**: called during paint, receives a canvas-like `ctx` to draw into element backgrounds/borders
- **LayoutWorklet**: called during layout, lets you define custom CSS layout algorithms
- **AudioWorklet**: called on the audio rendering thread with raw `Float32Array` sample buffers

The constraint is the point. Worklets have no DOM access, no arbitrary async, no fetch — precisely because they share threads with renderer/audio internals. You can't block those threads with general-purpose code, so the API surface is locked down.

**Mental model**: the difference between a plugin running *inside* a DAW's audio thread vs. one running in its own process and streaming samples across IPC. Worklets are the former.

### Concrete pattern: PaintWorklet

```js
// worklet file
registerPaint('noise-bg', class {
  static get inputProperties() { return ['--noise-seed']; }
  paint(ctx, size, props) {
    const seed = props.get('--noise-seed').value;
    // draw noise pattern using seed
  }
});
```

```css
background: paint(noise-bg);
transition: --noise-seed 0.3s;
```

Now `--noise-seed` animates via CSS transitions — which run on the compositor thread — and your draw code runs in the paint stage. Main thread load is irrelevant to the animation.

### Practical scenarios

**Frontend**: Animating custom background patterns (moving gradients, noise fields, procedural borders) via PaintWorklet is zero-jank regardless of main thread pressure. This is the primary real-world use case — anywhere you'd have reached for a `requestAnimationFrame` canvas draw on the main thread.

**Fullstack/app context**: If you're building a web-based DAW, real-time instrument, or collaborative whiteboard — AudioWorklet replaces the deprecated `ScriptProcessorNode`, which ran on the main thread and crackled under any load. AudioWorklet is the fix for that. For whiteboards, PaintWorklet keeps your WebSocket state-sync from competing with rendering frame budget.

### When to reach for it

PaintWorklet: when you want CSS-driven visual effects that'd otherwise require main-thread canvas animation. The CSS custom properties bridge (animation → worklet input) is the pattern that makes it compositeable.

AudioWorklet: any time you're writing DSP — reverb, synthesis, compression — that needs sample-accurate timing. If you've seen audio crackling under load in a web audio app, this is why.

**Common pitfall**: Worklets don't share memory with Workers or the main thread by default — you pass data in via CSS properties (PaintWorklet) or `AudioParam`/`MessagePort` (AudioWorklet). Expecting a shared closure or mutable state across calls will burn you.
