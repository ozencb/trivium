---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Script Loading Strategies

When a browser encounters a `<script>` tag, it has to decide when to fetch it and when to execute it — and those choices directly determine how fast your page renders. Script loading strategies give you control over that timing.

### The core mechanism

The HTML parser is single-threaded. By default, hitting a `<script>` tag blocks parsing entirely: fetch the resource, execute it, then resume. This is why scripts in `<head>` used to be notorious for blank-screen delays.

Three attributes change this behavior:

- **`defer`**: fetches in parallel with parsing, executes after the DOM is fully parsed, preserves document order. The script runs before `DOMContentLoaded`.
- **`async`**: fetches in parallel, but executes *immediately* when downloaded — interrupting parsing if it's still happening. Order is not guaranteed.
- **`type="module"`**: deferred by default, always strict mode, supports static `import`. Inline module scripts also defer.

There's also the runtime layer: `import()` (dynamic import) lets you split code and load it on demand — no `<script>` tag at all, just a Promise that resolves to a module.

### Mental model

Think of the parser as a chef and scripts as trips to the pantry. Default scripts: chef stops cooking, walks to pantry, grabs ingredient, returns, then continues. `defer`: sous-chef makes the pantry run, chef keeps cooking, ingredient arrives before service. `async`: sous-chef runs, but the chef has to stop and use the ingredient the *moment* it arrives, even mid-dish. Dynamic import: chef decides mid-recipe to add something optional — goes and gets it only if needed.

### Practical implications

**Frontend:** Third-party analytics or ad scripts are classic `async` candidates — you don't care about execution order and don't want them blocking render. Your own application bundle typically wants `defer` so it can safely touch the DOM. For heavy features that aren't needed on initial load (modals, chart libraries, rich text editors), dynamic `import()` lets you load them on interaction.

**Fullstack (SSR context):** When server-rendering, you're often injecting scripts into the response stream. `defer` is almost always the right default for app chunks — it won't block the browser from progressively rendering streamed HTML. Frameworks like Next.js or Remix abstract this, but they're making these decisions under the hood: Next's `<Script strategy="afterInteractive">` maps to deferred loading, `"beforeInteractive"` injects blocking scripts in `<head>`.

The real trap is mixing strategies incorrectly — `async` on a script that depends on jQuery being available, or forgetting that inline scripts are always parser-blocking and can't be deferred without dynamic injection.
