---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## React Server Actions

Server Actions are async functions that run on the server but can be called directly from client components — no `fetch`, no route handler, no API contract. They're React's answer to the question: "what if a button click could invoke a server function without leaving the component model?"

**The core mechanism**

When you mark a function with `"use server"`, the bundler replaces it with an RPC stub on the client side. Calling the function triggers a POST to a framework-managed endpoint, the server executes the real function body (with full Node.js access — DB, env vars, secrets), and the response flows back. Crucially, Server Actions integrate with React's transition model: you can wrap them in `startTransition` or `useActionState`, giving you pending states, optimistic updates, and error handling without any custom hooks.

```tsx
// app/actions.ts
"use server";
export async function updateUsername(userId: string, name: string) {
  await db.users.update({ where: { id: userId }, data: { name } });
  revalidatePath("/profile");
}

// components/ProfileForm.tsx (Client Component)
import { updateUsername } from "@/app/actions";
export function ProfileForm({ userId }: { userId: string }) {
  return <form action={updateUsername.bind(null, userId)}>...</form>;
}
```

Notice `revalidatePath` — the action invalidates the cache and triggers a re-render of the RSC tree, so your UI updates without any client-side state sync.

**Where this changes the design conversation**

For **fullstack engineers**, Server Actions collapse a whole layer. Instead of `POST /api/users/:id` → validate → update → return JSON → update client state, you write one function. This is compelling for internal tools and CRUD-heavy apps where REST API design overhead isn't worth it.

For **frontend engineers**, the win is colocating the mutation intent with the component that triggers it. Form actions in particular get a clean model: the `action` prop accepts a Server Action directly, progressive enhancement works without JS enabled, and you get the same mental model as native HTML forms.

**Where it bites you**

The tight coupling is real. Server Actions are not a clean API contract — they're an implementation detail of your React app. If you need to expose mutations to mobile clients, third-party integrations, or multiple frontends, you still need a proper API layer. Reach for Server Actions when the caller is always your own Next.js app. Prefer API routes when the mutation surface is shared.

The other gotcha: error handling. Unhandled exceptions in Server Actions propagate to the nearest error boundary. `useActionState` gives you structured error returns, but it requires discipline — you need to define a return type that distinguishes success from validation failure from server error, otherwise you're flying blind.

**Senior signal in interviews**: knowing when *not* to use them — specifically, articulating the coupling tradeoff and how it interacts with your API surface requirements — is what separates someone who read the docs from someone who's made the call in production.
