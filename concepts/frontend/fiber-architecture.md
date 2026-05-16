---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## React Fiber Architecture

Fiber is React's internal reconciliation engine, rewritten in React 16 to replace a recursive, uninterruptible call stack with a linked-list-based work loop that can pause, prioritize, and resume rendering mid-flight. The core motivation: the old reconciler had to finish a full tree update in one synchronous shot, which caused frame drops on complex trees.

### The Core Mechanism

Before Fiber, reconciliation was a depth-first recursive walk — once started, the JS engine owned the call stack until it finished. Fiber breaks that work into discrete units. Every component instance becomes a **fiber node**: a plain object that stores the component type, its props/state, a reference to its DOM node, and — crucially — pointers to its parent, first child, and next sibling. This gives React its own traversal structure that doesn't rely on the native call stack.

React's **work loop** processes one fiber at a time, then checks if there's higher-priority work or a deadline to yield. This is cooperative multitasking, not preemption — React voluntarily gives up control to let the browser paint or handle input.

Rendering is split into two phases:

1. **Render phase** (interruptible): React walks the fiber tree, diffs, and marks nodes with effect tags (insert, update, delete). No DOM mutations happen yet. This can be paused.
2. **Commit phase** (synchronous): React flushes all collected effects to the DOM in one pass. This cannot be interrupted — a half-applied DOM is worse than a delayed one.

React also maintains **two fiber trees**: the *current* tree (what's on screen) and the *work-in-progress* tree (what's being built). Once the render phase completes, React swaps them with a pointer flip — O(1) "commit."

### Mental Model

Think of it like a diff queue processed by a scheduler, not a function that runs to completion. Each fiber is a "resumable task". React can dequeue, process partway, and re-enqueue with preserved state — something impossible with a recursive call stack.

### Practical Relevance

**Frontend**: `useTransition` and `useDeferredValue` are direct products of Fiber's priority system. When you wrap a state update in `startTransition`, you're telling the scheduler this work is low-priority — the UI stays responsive while React builds the new tree in the background. Without Fiber, there's no "background" to work in.

**Fullstack**: In Next.js App Router with React Server Components, the server streams a fiber-compatible payload to the client. The client's Fiber scheduler can interleave hydration of that stream with user interactions — so a slow RSC payload doesn't block button clicks. The architecture only works because Fiber decouples "receiving work" from "committing it."

Understanding Fiber is what makes Concurrent Rendering and Suspense non-magical: Suspense just throws a Promise, Fiber catches it, parks that subtree, and resumes when the Promise resolves — all within the same scheduling primitives.
