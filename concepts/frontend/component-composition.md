---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Component Composition Patterns

Components in a UI library or app need to share behavior, state, and rendering without becoming tightly coupled. Composition patterns are the set of architectural techniques that let you express *what* a component does separately from *how it looks* — and they're the difference between a component library that's pleasant to use and one that requires forking every time product needs something slightly different.

### The Core Mechanism

The fundamental tension: a component has some logic or state that multiple callers need, but each caller wants to control the rendered output differently. Naive solutions (boolean props, `renderX` props, conditional branches) accumulate and become unmaintainable. Composition patterns solve this by inverting control — the component provides the logic/state; the consumer decides the structure.

Three patterns dominate:

**Compound components** share implicit state through context. `<Select>` and `<Option>` don't pass data via props — they communicate through a provider/consumer relationship the user never sees. The consumer gets a declarative, HTML-like API.

```jsx
<Tabs defaultIndex={0}>
  <TabList>
    <Tab>Overview</Tab>
    <Tab>Details</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>...</TabPanel>
    <TabPanel>...</TabPanel>
  </TabPanels>
</Tabs>
```

**Render props / children-as-function** expose internal state to the consumer so they can render whatever they want:

```jsx
<DataFetcher url="/api/users">
  {({ data, loading }) => loading ? <Spinner /> : <UserTable rows={data} />}
</DataFetcher>
```

**Slot pattern** (passing components as props): instead of `showHeader={true}`, accept `header={<CustomHeader />}`. This is increasingly common with the `children` prop and React's composition model — it completely decouples rendering from behavior.

### Why It Matters in Practice

**Frontend:** Design systems are the clearest use case. A `<Modal>` that owns open/close state but accepts a `trigger` prop and `content` slot handles 90% of product requirements without change. When you see a component with 15 boolean props, that's composition patterns not being applied.

**Fullstack:** Server components (Next.js App Router) formalize this — server components handle data fetching and pass server-rendered content as children to client components that own interactivity. This is the slot pattern at the architecture level, not just component level.

### The Mental Model

Think of it as separating the "smart" part (state, data, behavior) from the "dumb" part (pixels). Composition patterns are the contracts that let these two halves snap together in different configurations. The consumer owns the shape; the component owns the logic.

The practical rule: if you're adding a prop to make a component render differently in two places, consider whether the consumer should own that rendering instead.
