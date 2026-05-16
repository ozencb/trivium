---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## iframe Performance Patterns

Each iframe is a full browsing context — its own document, layout tree, and script execution environment. This isolation is powerful but has a real cost: an eager iframe competes for network bandwidth, triggers its own parse/execute cycle, and can delay your page's `load` event even though it appears visually contained.

### Core Mechanism

The browser treats an iframe almost like a nested tab. When you set `src`, it initiates a full navigation: DNS lookup, TCP connection, HTML parse, subresource fetches, JS execution. The iframe's JS runs on its own event loop, so it won't block your main thread's JS — but painting and compositing are still shared, and heavy iframe rendering can cause jank.

The key insight is that most iframes are not needed immediately. Deferring their lifecycle is the highest-leverage optimization.

### The Three Main Patterns

**1. Native lazy loading**
```html
<iframe src="https://maps.example.com/embed" loading="lazy"></iframe>
```
Simple and effective for below-the-fold iframes. The browser defers loading until the iframe is within a threshold of the viewport.

**2. Deferred `src` injection**
For more control — or cross-browser coverage — you hold `src` empty and inject it via IntersectionObserver:
```js
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    entry.target.src = entry.target.dataset.src;
    observer.disconnect();
  }
});
observer.observe(document.querySelector('iframe[data-src]'));
```

**3. Facade pattern**
Don't render the iframe at all until user interaction. Show a screenshot or thumbnail, swap to the real iframe on click. YouTube's lite-embed approach does exactly this — the video player iframe is never loaded if the user doesn't click play. For ad-heavy pages, this alone can cut LCP and TBT significantly.

### Mental Model

Think of it as "tabs inside a tab." You wouldn't open 15 background tabs on load and expect snappy UX. An eager iframe grid on a page is exactly that. The facade pattern is the equivalent of not opening the tab until someone actually wants it.

### Practical Scenarios

**Frontend:** Third-party embeds — chat widgets, maps, video players, payment forms — are the primary use case. The facade pattern shines here because these are interactive triggers (user clicks "Start Chat"), so the lazy swap feels invisible.

**Fullstack:** In micro-frontend architectures where teams deploy independently as iframes, the concern shifts. You still want lazy loading for non-critical micro-frontends, but you also need to think about duplicate dependency loading (React loaded 4 times across 4 iframes) and coordinating hydration order. Module federation or shared import maps can help, but the iframe isolation itself means you can't fully deduplicate — it's a tradeoff between team autonomy and bundle efficiency.

The `sandbox` attribute is worth considering for both security and performance: restricting capabilities (`allow-scripts` only vs. full sandbox off) lets the browser make better optimization decisions and reduces the attack surface of third-party content.
