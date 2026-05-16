---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Resumability

Resumability is a rendering strategy where the browser picks up execution exactly where the server left off — without re-running any framework code or re-executing component logic. The problem it solves is the redundant work in traditional hydration: the server renders HTML, ships it, and then the client throws away all the server's work and reconstructs the same component tree from scratch.

### The Core Mechanism

You already know partial hydration defers or skips hydration for components that don't need interactivity. Resumability goes further: it eliminates the *concept* of hydration entirely.

The key insight is that hydration is expensive because the client doesn't know the application's state — it has to re-derive it by executing JavaScript. Resumability sidesteps this by **serializing execution state into the HTML itself**. The server encodes event listeners, component state, and the reactive graph into the document (typically as `<script>` tags or attributes). The client doesn't replay anything; it just reads that serialized state and resumes from it.

Think of it like a save file in a video game. Traditional hydration is replaying the entire game from the start to reach level 10. Resumability is loading a save file at level 10.

### Concrete Mental Model

In a standard React SSR setup:
1. Server renders HTML
2. Client downloads JS bundle
3. Client re-runs all component render functions to rebuild the virtual DOM
4. Client attaches event listeners

In a resumable framework (Qwik is the canonical example):
1. Server renders HTML + serializes state into it
2. Client downloads *almost no* JS initially
3. A tiny loader script reads the serialized state
4. JS for a specific component only downloads when that component's event fires

The critical difference: **JS is lazy-loaded per interaction, not pre-loaded per page**.

### Practical Scenarios

**Frontend:** On a content-heavy page with one interactive widget (say, a comment form buried at the bottom), resumability means zero JS executes on load. The user reads the article, and only when they click "Reply" does the comment form's JS download and activate. Time-to-interactive drops dramatically because you're not paying the cost of components the user never touches.

**Fullstack:** In a Next.js or Remix app you manage bundle splitting manually — route-based, component-based, with `React.lazy`. Resumability makes this automatic at the component/event level. A fullstack engineer building a product page doesn't need to reason about which components need JS upfront; the framework defers everything and hydrates on demand. The tradeoff is that you need a framework that's designed for this from the ground up (Qwik) — retrofitting resumability onto React's model isn't practical, which is why it remains a distinct ecosystem rather than a React feature.
