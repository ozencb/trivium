---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Houdini

CSS Houdini is a collection of browser APIs that expose the CSS rendering pipeline to JavaScript, letting you extend CSS itself rather than working around it. The core problem it solves: before Houdini, if you needed a visual effect the browser didn't natively support, you had to fake it with DOM hacks, canvas, or JS-driven style mutations — all of which either fight the render pipeline or live outside of it entirely.

### The core mechanism

The browser's rendering pipeline has discrete stages: style calculation, layout, paint, composite. Houdini gives you **worklets** — lightweight, sandboxed JS execution contexts — that hook into specific stages synchronously. This is the key difference from a `requestAnimationFrame` hack: your code runs *inside* the pipeline, not after it.

The main APIs:

- **Paint Worklet** (`CSS.paintWorklet`) — defines a custom `paint()` function you reference in CSS like `background: paint(my-thing)`. It gets a Canvas 2D-like context scoped to the element's dimensions.
- **Properties & Values API** (`CSS.registerProperty`) — gives custom properties a type, initial value, and inheritance behavior. This is what makes custom properties animatable (browsers can interpolate typed values).
- **Layout Worklet** — define custom layout algorithms (think: masonry, custom grid variants) that run at layout time.
- **Animation Worklet** — drive animations on a compositor thread, linked to scroll or time, without touching the main thread.

### Concrete mental model

Think of the Paint Worklet like writing a CSS `background-image` generator. You register a painter in JS, pass it parameters via custom properties, and use it in CSS:

```js
// my-painter.js (worklet)
registerPaint('ripple', class {
  static get inputProperties() { return ['--ripple-color', '--ripple-radius']; }
  paint(ctx, size, props) {
    ctx.arc(size.width / 2, size.height / 2, props.get('--ripple-radius').value, 0, 2 * Math.PI);
    ctx.fillStyle = props.get('--ripple-color').toString();
    ctx.fill();
  }
});
```

```css
.button {
  --ripple-color: rgba(0,0,0,0.2);
  --ripple-radius: 80;
  background: paint(ripple);
  transition: --ripple-radius 0.3s ease; /* animatable because it's typed */
}
```

### Practical scenarios

**Frontend:** Instead of maintaining a canvas overlay or complex pseudo-element chains for a custom border animation, you register a paint worklet once and ship it as a self-contained CSS primitive. Design systems benefit a lot here — you can expose parameterized, GPU-composited effects that consumers control entirely via CSS custom properties.

**Fullstack:** On the server side, Houdini itself is irrelevant, but understanding it matters for SSR performance decisions. Paint worklets load asynchronously and aren't pre-rendered — if you're using them for above-the-fold styling, you'll need a fallback strategy, because the worklet may not be registered by first paint.

The broader significance: Houdini is why the CSS Typed OM and `@property` syntax exist. Even if you never write a worklet, you're already using Houdini's foundational layer.
