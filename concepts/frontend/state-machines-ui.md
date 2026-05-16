---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## State Machines for UI

A state machine is a way to model UI as a finite set of named states with explicit rules for transitioning between them. The payoff: you eliminate entire classes of bugs that come from UIs being in contradictory or impossible conditions.

### The core idea

Most UI bugs aren't logic bugs — they're *state bugs*. The code allows combinations that should never co-exist: `isLoading && hasError && data !== null`. Without a state machine, you're implicitly managing state through booleans or flags that can drift out of sync. A state machine makes impossible states *unrepresentable*.

Instead of:
```js
isLoading: true
isError: false
data: null
```

You have a single `status` field with one value at a time: `'idle' | 'loading' | 'success' | 'error'`. The machine defines what events can fire in each state and what state they transition to. `FETCH` can only fire from `idle`. `RESOLVE` can only fire from `loading`. You can't accidentally render a loading spinner alongside error text.

### Mental model

Think of a traffic light. It has three states: green, yellow, red. It doesn't have a `isGreen` and `isRed` boolean — those could both be true, which is nonsensical. The light transitions: green → yellow → red → green. Each transition is an event. The machine enforces that yellow-to-green is not a valid transition, so it simply doesn't happen.

UI is the same. A modal is `closed`, `opening`, `open`, or `closing`. A form is `idle`, `validating`, `submitting`, `success`, or `error`. Defining it this way forces you to think through every state and every valid path between them — which surfaces edge cases before they become bugs.

### Practical scenarios

**Frontend:** A payment flow with a "Pay" button. Without a state machine, you add `isSubmitting`, `isDisabled`, `hasError`, `isSuccess` flags. Somewhere a race condition enables the button while a request is in-flight. With a state machine, the button is only enabled in the `idle` state. The `SUBMIT` event transitions to `submitting`. The button's enabled state is derived from the current state — it literally cannot be enabled while submitting.

**Fullstack:** Server-side state machines show up in order management (`pending → confirmed → shipped → delivered → refunded`). The same model can live on the backend enforcing transitions in the database, and on the frontend mirroring that state to drive UI. A refund button only renders if the order is in `delivered` state. The backend and frontend share a vocabulary, reducing bugs at the seam.

### In practice

Libraries like XState implement this formally. But even without a library, thinking in states — naming them explicitly and defining what events they accept — changes how you design components. It shifts you from "what flags do I need?" to "what states can this UI be in?" That mental shift alone is most of the value.
