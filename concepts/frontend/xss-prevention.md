---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## XSS Prevention

XSS (Cross-Site Scripting) lets attackers inject script into your page that runs in another user's browser — stealing sessions, hijacking actions, or exfiltrating data. Prevention is fundamentally about controlling what the browser treats as executable vs. inert text.

### The core mechanism

The browser has no concept of "intended" HTML vs. "injected" HTML. It renders whatever string ends up in the DOM. XSS exploits this: if user-controlled input flows into the DOM without transformation, the attacker controls markup, and markup can contain `<script>` tags, event handlers (`onerror`, `onclick`), or `javascript:` URIs.

The fix is **contextual output encoding** — transforming characters that have structural meaning in a given context so they render as text, not as code:

- In HTML body: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`
- In HTML attributes: additionally encode `"`, `'`
- In JavaScript strings: escape `\`, `"`, newlines
- In URLs: percent-encode everything outside safe chars

The "contextual" part matters. Encoding `<` as `&lt;` is correct inside HTML body but wrong inside a `<script>` block or a `href` attribute — different characters are dangerous in different positions. Mismatched context encoding is a common source of missed XSS.

### Concrete mental model

Think of a SQL injection analogy you likely know: raw string concatenation into a query is dangerous; parameterized queries fix it by separating structure from data. XSS is the same idea for HTML: when you concatenate user input into an HTML string, you're conflating structure and data. Encoding is the parameterization.

### Stored vs. reflected vs. DOM-based

- **Stored**: payload saved to DB, served to every visitor of that page. High impact.
- **Reflected**: payload in the URL/query, echoed back in the response. Requires phishing a link.
- **DOM-based**: no server involvement — client-side JS reads `location.hash` or `document.referrer` and writes to `innerHTML`. Often missed because the server response looks clean.

### Practical scenarios

**Frontend**: The main exposure is `innerHTML`, `outerHTML`, `document.write`, and framework escape hatches like React's `dangerouslySetInnerHTML`. Prefer text node APIs (`textContent`, `createTextNode`) or let your framework handle interpolation — React, Vue, and Angular all auto-encode by default. When you genuinely need to render user HTML (rich text editors, markdown), use a sanitizer like DOMPurify rather than rolling your own allowlist.

**Fullstack**: Server-rendered HTML (Jinja, ERB, Handlebars, etc.) requires the same contextual encoding, and most template engines handle it automatically when you use their default interpolation syntax. The bugs appear when you use "raw" or "unescaped" output helpers — often needed for trusted HTML, misused for untrusted data.

The next layers of defense — Content Security Policy and Trusted Types — assume XSS encoding is already in place and add restrictions on what the browser will execute even if an injection slips through.
