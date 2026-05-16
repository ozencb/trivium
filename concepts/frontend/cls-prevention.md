---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Cumulative Layout Shift (CLS) prevention** is the practice of ensuring elements don't move unexpectedly after initial render — because when they do, users click the wrong thing, lose their scroll position, or just feel the page is broken.

## The Core Mechanism

CLS happens when the browser doesn't know an element's size before it loads, so it allocates zero space, renders surrounding content, then expands once the element arrives — shoving everything else around. The fix is almost always the same idea: **reserve space before content loads**.

The browser's layout engine is eager. It paints what it knows, then repaints when it learns more. Your job is to front-load that knowledge.

## Concrete Mental Model

Think of it like a newspaper layout. A print editor knows the photo will be 300×200px before it arrives from the photographer, so they block out that exact space. Web layouts often don't — the `<img>` tag arrives in HTML with no dimensions, the browser renders text around it, then the image loads and everything jumps.

The native fix for images is simple: set `width` and `height` attributes on the `<img>` element. Modern browsers use these to compute aspect ratio and reserve space even while the image is loading. No JavaScript needed.

```html
<!-- Bad: browser allocates 0px height until image loads -->
<img src="hero.jpg" />

<!-- Good: browser reserves 1200x630 aspect ratio immediately -->
<img src="hero.jpg" width="1200" height="630" />
```

## Practical Scenarios

**Frontend:** The most common CLS sources are images without dimensions, web fonts causing FOUT/FOIT that shifts text, and dynamic content injected above the fold (cookie banners, notification bars). For fonts, `font-display: optional` eliminates shift entirely by not swapping at all once the fallback has rendered. For dynamic UI like toasts or banners, always render them at the bottom or absolutely positioned — never inject them into the document flow above existing content.

**Fullstack:** Server-rendered apps have an advantage here — you know the content dimensions at render time. If your SSR template emits images from a CMS, pipe the image dimensions through to the template so you can set `width`/`height` statically. For skeleton screens (common in React/Next.js apps where data loads client-side), match the skeleton's dimensions as precisely as possible to the real content — a skeleton that's 10px shorter than the loaded card still causes shift.

One underappreciated case: **third-party embeds** (ads, iframes, social widgets). These are black boxes. Wrap them in a container with a fixed `aspect-ratio` or explicit height before they load, or you'll get CLS you don't control and can't predict.

The unifying principle: **make layout decisions once**. Any element whose size is unknown at paint time is a CLS risk.
