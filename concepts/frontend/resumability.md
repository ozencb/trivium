---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Resumability

Hydration's core problem is redundancy: the server renders HTML, ships the component tree and all its JavaScript to the client, then re-executes everything to reconstruct state and attach event listeners — work the server already did. Resumability eliminates that re-execution by serializing the *result* of that work into the HTML itself, so the client picks up exactly where the server left off.

### The core mechanism

In a resumable framework (Qwik is the main production example), the server doesn't just render HTML — it serializes three things into the document:

1. **Component state** — props, signals, reactive values, encoded into the HTML (often as `<script type="application/json">` or data attributes)
2. **Event listener locations** — instead of attaching handlers eagerly, it records *where* each handler lives as a URL-like pointer (e.g., `chunk-abc.js#onClick`)
3. **The component ownership graph** — which DOM nodes belong to which components

When the page loads, *no JavaScript runs*. If the user clicks a button, the framework fetches only that handler's chunk, deserializes the relevant state slice, runs the handler, and updates the DOM. Everything else stays dormant.

### Mental model

Think of it like a VM snapshot. A hypervisor can pause a running VM, write its full memory state to disk, and restore it on a different machine — the process has no idea it was ever paused. Resumability does the same thing with component execution: pause on server, serialize the snapshot, resume on client, zero re-run.

Compare this to partial hydration, which still re-executes component logic for the "active" islands — it reduces *scope* but not the fundamental redundancy. Resumability removes the re-execution entirely.

### Where this matters in practice

**Frontend:** If you're building a content-heavy page — marketing site, e-commerce product page, news article — most components never need interaction. With hydration, you pay JavaScript execution cost upfront anyway. With resumability, a user who reads and leaves costs you zero JS execution. Time-to-interactive drops dramatically because there's no hydration phase blocking it.

**Fullstack:** Resumability changes how you think about server/client boundaries. Instead of reasoning about "which components need to be islands," you reason about "which event handlers will actually be triggered." The framework handles lazy-loading exactly what's needed, when it's needed.

### The senior-engineer angle

In design discussions, the distinction to make is: hydration frameworks (including partial hydration) have a startup cost proportional to component count; resumable frameworks have a startup cost proportional to *user interaction*. For read-heavy apps this is a massive win; for highly interactive dashboards the difference shrinks.

The current limitation worth knowing: resumability requires that closures and component state be fully serializable, which constrains what you can do (no arbitrary closures over non-serializable values). That's the real architectural tradeoff — not "is it faster" but "what does it force you to give up."
