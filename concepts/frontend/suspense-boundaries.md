---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Suspense Boundaries

Suspense boundaries let you declaratively define where a loading fallback renders while part of the component tree isn't ready yet — they're the structural contract between React's scheduler and async work happening in your component subtree.

### The core mechanism

When a component suspends, it throws a Promise (a "thenable"). Since you know Fiber, you can picture what happens next: React's reconciler walks up the fiber tree and finds the nearest `<Suspense>` ancestor. That boundary catches the thrown promise, renders its `fallback` prop instead of its children, and subscribes to the promise's resolution. When it resolves, React re-renders the subtree from that boundary downward.

This works cleanly with Concurrent Rendering because React can abandon and retry in-progress renders without the user seeing inconsistent UI. The boundary is the rollback point.

The critical insight: Suspense is a protocol, not just a component. A data library opts into it by throwing a promise when data isn't cached yet. React doesn't know or care whether the promise represents a network request, a lazy-loaded bundle, or a server component stream — it just catches and waits.

### Mental model

Treat it like an async analog to error boundaries. Error boundaries catch thrown errors and show error UI. Suspense boundaries catch thrown promises and show loading UI. The same tree-walking, nearest-ancestor resolution logic applies.

### Practical scenarios

**Frontend:** The canonical case is `React.lazy` for code splitting. Wrap a lazily imported component in `<Suspense fallback={<Spinner />}>` and React shows the spinner while the bundle chunk fetches. Placement is the real design decision — a boundary at the route level shows one spinner for the whole page; at the widget level you get independent loading states that can feel more responsive but visually chaotic if overdone.

**Fullstack:** With Next.js App Router (React Server Components), Suspense boundaries control *streaming SSR*. The server renders the shell immediately and streams it; sections wrapped in Suspense boundaries stream in as their async server components resolve. You can wrap a slow database-backed component in a Suspense boundary and let the rest of the page render without waiting for it — the browser progressively patches in the content. This is meaningfully different from the old `getServerSideProps` model where one slow query blocked the entire response.

### One thing to watch

Boundaries compose, so you can nest them — but the nearest boundary wins. If you have a global Suspense at the app root and nothing else, every async component in your app shares one fallback. Intentional placement is what separates a good loading UX from an accidental full-page spinner.
