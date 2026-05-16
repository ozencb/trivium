---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Modules

CSS has always had a global scope problem: any class name you define in one file can silently collide with one in another. CSS Modules solves this at build time by making class names local by default.

**Core mechanism**

When you write a `.module.css` file, your bundler (webpack, Vite, Next.js, etc.) transforms each class name into a unique hash during compilation. `.button` becomes `.Button_button__3k9as` in the output. That mapping is exposed as a JavaScript object you import directly:

```css
/* Button.module.css */
.button {
  background: blue;
  color: white;
}
```

```jsx
import styles from './Button.module.css';

export function Button({ children }) {
  return <button className={styles.button}>{children}</button>;
}
```

You write simple, readable names in source. The build step makes them unique. Two components can both define `.button` in their own module files and they'll never interfere.

**How it compares to alternatives**

BEM solves collisions through naming discipline — `.ComponentName__element--modifier`. CSS Modules solves it structurally, so naming conventions become optional rather than load-bearing. You get flat, readable class names without trusting everyone on the team to follow a convention.

Versus CSS-in-JS (styled-components, emotion): modules keep CSS as real CSS files. No runtime parsing, no JavaScript overhead, full access to CSS tooling — linters, preprocessors, editor support. The tradeoff is that dynamic styles based on props require conditionally composing class names rather than interpolating values directly.

**Practical scenarios**

*Frontend (component library/design system):* Team members can work on separate components in parallel without namespace coordination. A `.card`, `.badge`, or `.container` class in one component file doesn't leak anywhere else. Refactoring a component's styles is fully contained.

*Fullstack (Next.js, Remix):* CSS Modules are the default recommendation in Next.js. Because the build step can statically analyze which modules each page uses, the server only sends the CSS actually needed for that page — no unused styles shipped to the client. It's also SSR-safe since there's no runtime style injection.

**One gotcha**

Global styles — resets, typography scales, utility classes — don't belong in modules. The usual pattern is a single global CSS file imported once at the app root, with modules handling everything component-specific.
