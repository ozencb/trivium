---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Virtual DOM

The Virtual DOM is an in-memory representation of the real DOM that a framework uses to batch and minimize actual browser DOM mutations. It exists because DOM operations are expensive — touching the real DOM triggers layout recalculation, repainting, and reflow, so doing it unnecessarily kills performance.

### The core mechanism

When your component state changes, the framework doesn't immediately touch the browser DOM. Instead, it re-renders your component into a new virtual DOM tree — a plain JavaScript object graph that mirrors the DOM structure. It then diffs the new tree against the previous snapshot (this is reconciliation), finds the minimal set of changes, and applies only those to the real DOM in one batch.

```
State change
  → new vDOM tree built (cheap, just JS objects)
  → diff old vDOM vs new vDOM
  → patch list: ["update text at div#3", "remove li#7"]
  → apply patch list to real DOM (expensive, minimized)
```

The key insight: building and diffing JavaScript objects is orders of magnitude faster than touching the DOM. The vDOM is a sacrificial layer that takes the hit of "re-render everything" so the real DOM only sees surgical changes.

### Mental model

Think of it like a database transaction log. Instead of writing every intermediate state to disk, you accumulate changes in memory and flush a minimal diff. The virtual DOM is that in-memory buffer — it's not the source of truth, it's the staging area.

### Practical scenarios

**Frontend (React app):** A user types in a search field. The input's `onChange` fires 60+ times per second. Without a vDOM, each keystroke could re-render an entire list. With vDOM diffing, React figures out only the input's value changed, updates one attribute, and skips touching the 200-item list that didn't change.

**Fullstack (SSR + hydration):** When your Next.js app ships HTML from the server, the client receives a real DOM already rendered. React then "hydrates" by building a virtual DOM from that same component tree and attaching event listeners — without blowing away what's already there. The vDOM is what makes this possible: React compares its expected tree against the real DOM to reconcile without a full re-render.

### What it doesn't solve

The vDOM isn't free. The diffing itself has cost — O(n) on the tree size. This is why React 18's concurrent features and frameworks like Svelte (which compiles away the vDOM entirely) exist: for highly dynamic UIs, even the diff overhead matters. The vDOM is a good default tradeoff, not a universal optimal.

Understanding the vDOM is the prerequisite for understanding why reconciliation heuristics (keys, component identity) exist and why hydration mismatches are hard to debug.
