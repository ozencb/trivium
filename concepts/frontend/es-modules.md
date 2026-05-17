---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## ES Modules

ES Modules (ESM) are JavaScript's native module system, defined in the ES2015 spec. The key property that distinguishes them from everything that came before: the dependency graph is **statically determinable** — fully knowable before a single line of code executes.

### The core mechanism

`import` and `export` statements are syntactically restricted to the top level of a file and must use static string literals as specifiers. You cannot write `import x from someVariable` or put an `import` inside an `if` block. This is not an oversight — it's a deliberate constraint that makes the module system analyzable at parse time.

When a bundler (or the browser's module loader) encounters an entry point, it can recursively resolve every `import`, build the full dependency graph, and know the complete set of exports for every module **without executing any code**. Compare this to CommonJS `require()`, which is just a function call — it can appear inside conditionals, loops, or callbacks, and its argument can be a runtime-computed string. A CommonJS dependency graph is only fully known at runtime.

ESM also introduces **live bindings**: when you import a named export, you don't get a copy of the value — you get a reference that updates if the exporting module modifies it. This is the mechanism behind patterns like re-exporting a mutable store value.

### Concrete example

```js
// math.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// app.js
import { add } from './math.js';
```

A bundler sees that `subtract` is never imported anywhere in the graph. Because ESM guarantees the export list is static and `subtract` has no side effects, the bundler can confidently eliminate it. This is tree shaking — it's only possible because the graph is fully known pre-execution.

### Frontend

Browsers implement ESM natively via `<script type="module">`. The browser fetches the entry point, parses it, discovers imports, fetches those in parallel, and so on — all before execution. The static graph enables parallel fetching and predictable execution order (depth-first, parent waits for children).

### Fullstack

Node.js supports both CommonJS and ESM, but they don't interop cleanly. An ESM file cannot synchronously `require()` a CommonJS module (and vice versa has awkward restrictions). This interop boundary is a real source of pain in libraries that need to support both ecosystems — which is why you see dual-package builds (`"main"` for CJS, `"exports"` for ESM) in most modern npm packages.

Understanding the static graph invariant is the foundation for grasping tree shaking, why dynamic `import()` is a separate escape hatch, and why bundlers can do sophisticated optimizations that were simply impossible in the CommonJS era.
