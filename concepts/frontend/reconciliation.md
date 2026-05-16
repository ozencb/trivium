---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Reconciliation** is React's algorithm for deciding *which* DOM nodes to actually update when your component tree re-renders — the answer to "we have a new virtual DOM snapshot, now what's the minimum work to make the real DOM match?"

## The Core Mechanism

When state changes, React renders a new virtual DOM tree. Reconciliation is the diffing pass that compares the new tree against the previous one. React doesn't do a naive full diff (O(n³) for trees) — it uses two heuristics to make it O(n):

1. **Different element types produce different trees.** If `<div>` becomes `<span>`, React tears down the entire subtree and rebuilds. No comparison of children.
2. **Keys signal identity across renders.** For lists, keys let React match "this is the same logical item" even if its position shifted. Without keys, React matches by index — correct structure, wrong semantics.

The practical implication: React only diffs siblings of the same type at each level. It never tries to "move" a subtree from one parent to another — that's a destroy + create.

## Mental Model

Think of it like a document diff tool (`git diff`) but for component trees. The algorithm walks both trees in parallel. When it finds matching node types, it updates only the changed props. When types diverge, it replaces the whole branch. Keys are like stable IDs that tell the differ "track *this* item, not this *position*."

```jsx
// Without key — React diffs by index, item 0 updates in place
// even if you prepended a new item
{items.map((item) => <Row value={item} />)}

// With key — React tracks identity; prepending a new item
// creates one node, leaves the others untouched
{items.map((item) => <Row key={item.id} value={item} />)}
```

## Practical Scenarios

**Frontend:** Key misuse is the #1 cause of subtle list bugs. Using array index as key means React re-uses DOM nodes when items reorder — input state, focus, and animations all break silently. Stable keys (IDs, slugs) keep identity correct.

**Fullstack:** When you're rendering server-fetched data into a list and the server occasionally reorders results (by score, timestamp, etc.), wrong keys cause components to get stale props from the previous render's node rather than unmounting and remounting. This is especially painful with forms or controlled inputs inside list items.

## Why This Matters for What Comes Next

Reconciliation in the classic model is synchronous and blocking — once it starts, it runs to completion. React Fiber was built specifically to break this constraint: instead of a single reconciliation pass, Fiber lets React pause, prioritize, and resume diffing work across frames. Concurrent rendering features (Suspense, transitions) only become possible once reconciliation is incremental rather than a single synchronous sweep.
