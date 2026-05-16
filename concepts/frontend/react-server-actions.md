---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## React Server Actions

Server Actions are async functions that execute on the server but can be called directly from client-side code — they're the mechanism React provides for mutations (form submissions, data writes) without needing to build a separate API endpoint.

### The core idea

Normally, a client needs an API route to talk to the server: `POST /api/update-user` → handler → DB. Server Actions collapse that boundary. You define a function marked `"use server"`, and React handles the serialization/deserialization and HTTP transport under the hood. The client calls it like a local function; the runtime ensures it runs on the server.

```tsx
// actions.ts
"use server";

export async function updateUsername(userId: string, name: string) {
  await db.users.update({ where: { id: userId }, data: { name } });
  revalidatePath("/profile");
}

// ProfileForm.tsx (client component)
"use client";

import { updateUsername } from "./actions";

export function ProfileForm({ userId }: { userId: string }) {
  return (
    <form action={updateUsername.bind(null, userId)}>
      <input name="name" />
      <button type="submit">Save</button>
    </form>
  );
}
```

Notice `revalidatePath` — Server Actions integrate directly with Next.js's cache invalidation. After a mutation, you tell the framework which cached data is stale, and it refetches/re-renders the relevant RSC subtree.

### Mental model

Think of Server Actions as RPC, not REST. You're not designing resource-oriented endpoints — you're calling remote procedures with typed arguments. The serialization protocol is React's own wire format (same one RSC uses), so it handles complex types like `Date`, `FormData`, and `Error` objects natively.

### Where this matters in practice

**Frontend:** Forms become much simpler. Instead of `useEffect` + `fetch` + optimistic state + error handling scattered across a component, you wire the form's `action` attribute to a server function. Progressive enhancement is free — it works without JS enabled.

**Fullstack:** This changes where you draw the API boundary. For internal mutations (user profile updates, settings, admin actions), you often don't need a public API at all — the action *is* the API. You still want explicit API routes for mobile clients, third-party integrations, or anything that needs to be versioned separately.

### What to watch for

Server Actions run in a trusted server context, so they have direct DB/service access — which means they need their own auth checks. The calling component being authenticated doesn't make the action authenticated. Treat each action like a standalone endpoint: validate inputs, verify permissions, don't trust arguments.

They also don't replace RSC data fetching — Server Actions are for writes. Reads still belong in Server Components.
