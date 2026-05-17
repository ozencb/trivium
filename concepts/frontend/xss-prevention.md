---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## XSS Prevention

XSS (Cross-Site Scripting) happens when user-controlled data ends up in a browser context where it's interpreted as code instead of content. The consequence is an attacker's script running in a victim's browser session — with access to cookies, tokens, the DOM, and any API the user is authenticated against.

### The Core Mechanism

The browser has no idea where content "came from." It just parses what it receives. If you insert `<script>stealCookies()</script>` into the DOM via `innerHTML`, the browser executes it. The fix isn't filtering — it's **context-aware encoding**: transforming characters so the browser treats them as data, not syntax.

The critical insight is that "context" matters enormously:

- **HTML body**: `<` becomes `&lt;`, `>` becomes `&gt;`
- **HTML attribute**: `"` becomes `&quot;`, and the attribute must be quoted
- **JavaScript string**: `'` and `"` must be escaped, and you can't just HTML-encode here
- **URL parameter**: requires percent-encoding
- **CSS value**: its own encoding rules

This is why "just escape HTML" is insufficient. A string injected into a JS context (`var x = "<USER_INPUT>"`) needs JS escaping, not HTML escaping — they're different transforms for different parsers.

### Concrete Mental Model

Think of output sinks — places where data lands — and ask: *what parser will consume this?*

```js
// Dangerous: innerHTML is an HTML sink
element.innerHTML = userInput;

// Safe: textContent is not a parser sink
element.textContent = userInput;

// Dangerous: URL sink, can accept javascript: URIs
anchor.href = userInput;

// Safer: validate scheme explicitly
const url = new URL(userInput);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
anchor.href = url.toString();
```

The DOM APIs themselves are your primary defense. `textContent`, `setAttribute` for non-URL attributes, and `createElement` with proper construction are all safe by default. `innerHTML`, `outerHTML`, `document.write`, and `eval` are sinks that require scrutiny.

### Practical Patterns

**Frontend**: React, Vue, and Angular escape HTML by default in their template bindings — but they all have escape hatches (`dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`). Treat those as code-review red flags that require sanitization with a vetted library (DOMPurify is the standard).

**Fullstack**: Stored XSS is where backend engineers get caught — user content persisted to a database and later rendered. The correct position is: sanitize on *output*, not on input. Sanitizing on input corrupts data (what if it's rendered in a non-HTML context?) and creates a false sense of security when you add a new rendering path.

### Why This Matters at Senior Level

In design reviews, the question isn't "are we escaping inputs?" but "what are all our rendering paths and sink types?" Senior engineers recognize that a rich text editor, a PDF renderer, and an HTML template each require different sanitization strategies. This also directly precedes understanding Content Security Policy — a browser-enforced allowlist that limits damage even if injection occurs — and Trusted Types, which enforces safe DOM manipulation at the API level.
