---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Trusted Types** is a browser API that eliminates DOM XSS at the source by making it a type error to assign arbitrary strings to dangerous sink APIs like `innerHTML`. Where CSP restricts *what resources load*, Trusted Types restricts *what values reach the DOM*.

## Core Mechanism

The browser exposes a small set of "dangerous sinks" — `innerHTML`, `outerHTML`, `document.write`, `eval`, `src` on scripts, etc. Normally these accept any string. With Trusted Types enforced (via CSP header `require-trusted-types-for 'script'`), passing a plain string throws a `TypeError`. The only values those sinks will accept are objects of specific `TrustedHTML`, `TrustedScript`, or `TrustedScriptURL` types.

You create those objects only through a policy:

```js
const policy = trustedTypes.createPolicy('my-app', {
  createHTML: (input) => DOMPurify.sanitize(input), // sanitize here
});

element.innerHTML = policy.createHTML(userContent); // works
element.innerHTML = userContent;                    // TypeError
```

The critical insight: you're not adding sanitization everywhere — you're *centralizing* it. You define exactly one (or a few named) policies that know how to produce trusted values. All the other code just calls those policies. The browser enforces that nothing else can reach the sinks.

## Mental Model

Think of it like a type-safe DB query layer. Raw strings in SQL are injection-vulnerable. Parameterized queries are safe because the DB driver handles escaping. Trusted Types does the same for the DOM: your policy is the parameterized query layer, and the browser refuses raw string "interpolation" entirely.

## Practical Scenarios

**Frontend SPAs**: React/Vue/Angular largely protect you already via their virtual DOM, but you probably have escape hatches — `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`. Those still go through raw DOM APIs. Trusted Types catches violations from third-party scripts or legacy code that bypasses the framework, which is exactly where surprises live.

**Fullstack rendering**: If you server-render HTML and hydrate it, or use a CMS where content goes through `innerHTML` for rich text, Trusted Types enforces that *every* path through that content goes through your sanitizer policy. A new engineer can't add `element.innerHTML = data.body` without it immediately failing in development.

**Audit surface**: `createPolicy` calls become your security audit targets. Instead of grepping the whole codebase for `innerHTML`, you grep for policy definitions. That's a much smaller, intentional surface.

## Adoption Reality

Browser support is good (Chromium-based, Firefox behind a flag). The friction is third-party scripts — many violate Trusted Types and you can't fix their code. The practical path is report-only mode first (`Content-Security-Policy-Report-Only`) to identify violations, then migrate your own code, then decide how to handle third-party violations (usually via a liberal catch-all policy scoped only to their domain).
