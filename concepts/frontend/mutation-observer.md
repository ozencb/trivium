---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Mutation Observer API

The MutationObserver API lets you watch for changes to the DOM tree and react to them asynchronously. It's the answer to "how do I know when something outside my code modifies the DOM?"

### Core mechanism

You create an observer with a callback, then tell it which node to watch and what kinds of changes to care about. The browser batches all DOM mutations that happen within a single microtask checkpoint and delivers them together as an array of `MutationRecord` objects.

```js
const observer = new MutationObserver((records) => {
  for (const record of records) {
    console.log(record.type);       // 'childList' | 'attributes' | 'characterData'
    console.log(record.target);     // the node that changed
    console.log(record.addedNodes); // NodeList of added nodes
    console.log(record.oldValue);   // previous value (if configured)
  }
});

observer.observe(document.body, {
  childList: true,   // watch for added/removed children
  subtree: true,     // watch entire subtree, not just direct children
  attributes: true,  // watch attribute changes
  attributeOldValue: true,
});

observer.disconnect(); // stop observing
```

The batching is the key design insight. The old `MutationEvents` API fired synchronously on every single change — catastrophic for performance when you're doing bulk DOM work. MutationObserver fires once per microtask boundary with everything that happened, so inserting 500 nodes triggers one callback with 500 records, not 500 callbacks.

### Mental model

Think of it like a git commit: you make many file changes, then git records them all at once when you commit. MutationObserver collects DOM changes within an execution window, then hands you the diff.

### Practical scenarios

**Frontend**

The classic use case is integrating with third-party scripts that manipulate the DOM directly — chat widgets, A/B testing tools, ad scripts. You can't hook into their code, but you can watch what they do. Another common pattern: waiting for lazy content to appear before running logic, without polling. Instead of `setInterval(() => document.querySelector('.thing'), 100)`, observe the parent and react when the element is added.

Custom rich text editors use it extensively — watching `contenteditable` nodes for `characterData` and `childList` mutations to implement undo stacks or sync state to a model.

**Fullstack**

In SSR frameworks (Next.js, Nuxt), hydration adds event listeners and reconciles server-rendered HTML with client state. Observing the document during hydration lets you detect when framework-injected attributes (like `data-hydrated`) appear, useful for timing-sensitive initialization that must run after the framework takes over the DOM. Also useful for building lightweight analytics SDKs that need to track dynamic content without access to the app's router.

**Disconnect when done.** Observers hold a reference to the target node and its subtree — forgetting to call `observer.disconnect()` is a common memory leak source, especially in single-page apps where components mount and unmount frequently.
