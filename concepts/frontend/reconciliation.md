---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Reconciliation

Reconciliation is the diffing algorithm frameworks use to compare previous and next virtual DOM trees, producing the minimal set of real DOM mutations needed. Naive tree diffing is O(n³) — reconciliation is only tractable because frameworks accept heuristics that trade theoretical completeness for O(n) performance.

**The core mechanism**

React's algorithm operates on two key heuristics:
1. Elements of different types produce entirely different trees — no cross-type reuse
2. Keys signal stable identity across siblings

The algorithm walks both trees simultaneously, level by level. At each node it compares type (and key if present). Same type → update props in-place, recurse into children. Different type → unmount old subtree entirely, mount new one. This is why swapping a `<div>` for a `<span>` destroys all children even if they're identical — once types differ, the algorithm stops looking deeper.

**Mental model**

Think of it as diffing two JSON trees where you've declared: if two sibling nodes share the same `id`, they're the same entity; if the root of a subtree changes type, the entire subtree is a fresh entity with no history.

**Where keys matter**

Without keys on a dynamic list, adding an item to the front causes every subsequent sibling to appear "changed" — the algorithm compares by position, finds mismatches, and remounts everything. Keys give the algorithm a stable identity to track, so only the new item triggers a mount. This is also why index-as-key breaks things in reorderable lists: the index is positional, not identity-based.

**Frontend scenario**

You have filterable, reorderable cards. Without keys, filtering triggers full remounts — you lose local state like scroll position, input focus, or animation state. With stable entity IDs as keys, the algorithm can match old card A to new card A even if it moved positions, updating props while preserving state.

**Fullstack scenario**

Server components in Next.js go through reconciliation when the client receives a new RSC payload. If a server component wraps client components, React reconciles the client subtree against the new server-rendered shell. Mismatched keys or type changes here destroy client state — directly relevant when you're streaming updates to a page with interactive islands.

**The invariant to internalize**

Reconciliation makes identity explicit. The algorithm cannot infer that two nodes represent "the same thing" unless they share position and type, or share a key. Anything that breaks this — changing container element types for animations, using array index as key in mutable lists, conditionally wrapping with different element types — forces unnecessary unmount/mount cycles. This is one of the most common sources of subtle, hard-to-reproduce state loss bugs in React apps.

Understanding this sets you up for Fiber architecture, which builds scheduling and priority on top of the reconciliation model rather than changing it.
