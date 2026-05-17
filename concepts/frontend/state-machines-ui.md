---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## State Machines for UI

UI components have behavior, not just appearance. A state machine is a formal model of that behavior: a finite set of states, the events that trigger transitions between them, and guards that determine whether a transition is allowed. The payoff is that impossible states — like a button that's simultaneously loading and disabled and errored — become structurally unrepresentable rather than defensively guarded.

**The core idea**

Most UI bugs aren't logic bugs — they're *state coordination* bugs. You have `isLoading`, `isError`, `isSuccess` as three separate booleans. Combinatorially, that's eight possible states. Most are nonsensical (`isLoading && isSuccess`), but nothing in your code prevents them. You end up with guards like `if (!isLoading && !isError && isSuccess)` scattered everywhere, and bugs that appear only under specific interaction sequences.

A state machine replaces this with a single value: `state ∈ { idle, loading, success, error }`. Transitions are explicit: from `idle`, a submit event moves you to `loading`. From `loading`, only a success or failure response can move you forward. There's no transition from `idle` to `success` — it's not that it's guarded, it literally doesn't exist.

**Concrete example**

A payment form has this shape naturally: idle → validating → submitting → success | error. Each state determines what's rendered (spinner, error message, confirmation), what events are accepted (retry only from error, not from success), and what side effects fire. When a PM says "can we add a timeout state?", you add one state and two transitions — you don't audit a dozen conditional branches.

**Where this matters in practice**

*Frontend*: Multi-step forms, drag-and-drop interactions, modals with async confirmation, media players, and any component with polling all benefit. XState is the canonical library, but the pattern doesn't require a library — even a `useReducer` with an explicit `status` field is a partial state machine.

*Fullstack*: Order workflows, document editing with autosave, optimistic updates — these are state machines on both ends. When your backend exposes status as an enum and your frontend mirrors it, debugging across the stack becomes mechanical: find which state you're in, check which transitions are valid, trace the event that triggered the wrong one.

**Why this differentiates senior engineers**

Junior engineers reach for booleans because they're immediate. Mid-level engineers notice the combinatorial mess and add defensive checks. Senior engineers ask "what are the valid states?" before writing any code. In a design discussion, modeling the state machine on a whiteboard forces product and engineering to agree on what's *actually* possible — which surfaces requirements gaps early. In interviews, reaching for state machines when asked to design a complex component signals that you reason about behavior systematically, not reactively.

The skill is knowing when it's worth the formalism. A toggle button doesn't need XState. A checkout flow with async payment, address validation, and coupon codes probably does.
