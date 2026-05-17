---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**CSS Modules** solves the global namespace problem in CSS by making class names locally scoped by default — you write `.button` and the build tool transforms it to something like `.button_3xk9a` so it can never collide with another component's `.button`.

## The Core Mechanism

CSS Modules is not a runtime library — it's a build-time convention. When you import a CSS file as a module, the bundler (webpack, Vite, etc.) does two things simultaneously:

1. Rewrites every class selector in the stylesheet with a generated hash suffix
2. Exports a JavaScript object mapping your original class names to the hashed ones

```css
/* Button.module.css */
.root { padding: 8px 16px; }
.primary { background: blue; }
```

```js
import styles from './Button.module.css';
// styles = { root: 'Button_root_3xk9a', primary: 'Button_primary_7mz2b' }

<button className={styles.root + ' ' + styles.primary}>Click</button>
```

The emitted CSS in your bundle contains the hashed names. Nothing in the browser knows about modules — it's all resolved at build time.

## What This Actually Eliminates

Without CSS Modules you have three bad options: global names that collide, BEM naming conventions that require discipline to maintain, or CSS-in-JS which pays runtime cost. CSS Modules gives you component-scoped styles with zero runtime overhead and no naming convention overhead. The hash is deterministic from the file path and class name, so builds are reproducible.

The `composes` keyword is the underused power feature — it lets you compose classes across files without copy-pasting:

```css
.primaryButton {
  composes: base from './shared.module.css';
  background: blue;
}
```

## Practical Scenarios

**Frontend (React/Vue component libraries):** The canonical use case. Each component owns its styles, you can refactor or delete a component without hunting for orphaned CSS, and you can name things `.wrapper`, `.title`, `.icon` in every component without thought.

**Fullstack (Next.js, Remix):** Both support CSS Modules out of the box. In Next.js specifically, the `.module.css` convention is built into the framework — no configuration needed. You get per-page and per-component scoping with zero setup cost.

## Common Pitfalls

- **Global styles still need a global stylesheet.** CSS Modules doesn't cover `body`, `a`, `:root` — you need a separate unscoped file for those.
- **`:global()` escape hatch is easy to abuse.** You can escape scoping with `:global(.some-class)`, which is useful for targeting third-party component classes but tempting to overuse.
- **Dynamic class composition gets verbose.** Conditionally joining multiple scoped classes pushes people toward `clsx` or `classnames` libraries — this is normal and expected.
- **The hashes make debugging harder** unless you configure your bundler to include the original name in development (most do by default).

Reach for CSS Modules when you want deterministic, zero-runtime scoping without adopting a CSS-in-JS solution. It's the lowest-friction option for component-based architectures.
