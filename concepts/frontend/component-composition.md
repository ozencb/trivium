---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Component composition patterns are techniques for sharing behavior and state between components without coupling them through inheritance or bloated prop interfaces. They matter because as UIs grow, the naive approaches — prop drilling or monolithic components — collapse under their own weight.

**The core mechanism**

The fundamental insight is that components are functions, and functions compose. Instead of a parent component knowing everything about its children, you invert the relationship: the parent provides a "slot" or callback, and children decide what to put there. This keeps the knowledge of *behavior* separate from the knowledge of *rendering*.

Three patterns operationalize this:

**Render props** — a component accepts a function as a prop and calls it with internal state. The component owns the behavior (scroll position, mouse coordinates, toggle state), and the consumer owns the rendering. Nothing is hidden; nothing is assumed.

**Compound components** — a parent component manages shared state and exposes child components that implicitly participate in it (e.g., `<Select>` + `<Select.Option>`). The children look like standalone elements but are wired together through context. The key invariant: the *structure* of the component tree carries semantic meaning.

**Slots** — a component defines named regions (via `children`, named props, or explicit slots in Vue/Web Components) that consumers fill. The parent doesn't care what goes in; the consumer doesn't care how the parent lays it out.

**Mental model**

Think of it like Unix pipes. Each stage does one thing, passes data along, and has no opinion about what came before or after. Component composition is the UI equivalent: behavior flows through the tree without any single component needing to understand the whole pipeline.

**Where this shows up in practice**

*Frontend:* Building a design system with a `<Modal>` that needs to work in dozens of contexts — confirmation dialogs, forms, media viewers. A compound component lets consumers control header, body, and footer independently without the Modal having 40 props. A render prop `<Tooltip>` can share hover logic while different consumers render entirely different popups.

*Fullstack:* When server components (Next.js App Router) and client components need to coexist, slots are the primary boundary mechanism — server components pass pre-rendered subtrees as children into client components, avoiding client-side re-fetching. Understanding slots as a deliberate inversion of control (not just "children") explains why this works without breaking hydration.

**Why it differentiates senior engineers**

Junior engineers reach for props. Mid-level engineers reach for context. Senior engineers recognize when the *structure* of the component tree should carry the abstraction, not runtime data. In design discussions, knowing which pattern to apply — and *why* a render prop beats a hook in some cases — is what separates people who can articulate tradeoffs from people who just copy patterns.
