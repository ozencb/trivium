---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS and Audio Worklets

Worklets are a lower-level threading primitive than Web Workers — they let you inject custom code directly into the browser's internal rendering or audio pipelines, rather than communicating across thread boundaries via messages.

### The Core Mechanism

The browser has several specialized threads: a main thread, a compositor thread, an audio rendering thread, and others. Web Workers give you a general-purpose thread that can *talk to* these pipelines. Worklets give you a custom execution context that runs *inside* one of them.

This distinction matters for performance. Cross-thread communication introduces latency and scheduling unpredictability. When you need frame-synchronous rendering or sample-accurate audio, that overhead is the enemy.

**CSS Paint Worklet** (part of Houdini) hooks into the paint phase of the rendering pipeline. You register a class with a `paint()` method, and the browser calls it whenever it needs to draw that CSS property — similar to how `<canvas>` drawing works, but driven by the CSS layout engine and composited directly:

```js
// worklet.js
registerPaint('checkerboard', class {
  paint(ctx, geom, props) {
    const size = 20;
    for (let x = 0; x < geom.width; x += size) {
      for (let y = 0; y < geom.height; y += size) {
        ctx.fillStyle = (x + y) % (size * 2) === 0 ? '#eee' : '#fff';
        ctx.fillRect(x, y, size, size);
      }
    }
  }
});
```

```css
background: paint(checkerboard);
```

The browser repaints this automatically on resize or when CSS custom properties change — no JS event listeners needed.

**Audio Worklet** replaces the deprecated `ScriptProcessorNode`. You extend `AudioWorkletProcessor` and implement `process(inputs, outputs)`, which is called every 128 audio frames (~3ms at 44.1kHz) on the dedicated audio thread:

```js
class GainProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    outputs[0][0].set(inputs[0][0].map(s => s * 0.5));
    return true; // keep alive
  }
}
registerProcessor('gain', GainProcessor);
```

Returning `false` or throwing lets the node die. The 128-frame block size is why this must run on its own thread — any jitter would cause audible glitches.

### Practical Scenarios

**Frontend:** CSS Paint Worklets are ideal for complex procedural backgrounds, animated borders, or generative UI that would otherwise require Canvas elements or heavy CSS hacks. You can expose CSS custom properties as parameters and let designers control them without touching JS.

**Audio/media apps (fullstack adjacent):** Audio Worklets are essential for anything requiring real-time audio manipulation — custom synthesizers, live effects chains, audio visualization synchronized to actual playback, or WebRTC audio preprocessing before it hits the network. The `ScriptProcessorNode` predecessor ran on the main thread, which meant UI jank could kill audio continuity. Audio Worklets eliminate that.

The mental model: Workers are sidecars. Worklets are plugins you install into the browser's own processing stages.
