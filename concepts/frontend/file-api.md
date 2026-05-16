---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## File API

The File API lets browsers read files from the user's filesystem entirely client-side — no upload required. It's the machinery behind image previews, CSV parsers, and any UI that processes files before (or instead of) sending them to a server.

### Core mechanism

When a user selects a file via `<input type="file">` or drops one onto a drop zone, you get a `FileList` containing `File` objects. A `File` is just a `Blob` with metadata (name, size, lastModified, MIME type) bolted on.

Reading the actual contents is done through `FileReader` — or more cleanly today, through the Blob methods that return Promises:

```js
const file = input.files[0];

// Modern approach
const text = await file.text();           // UTF-8 string
const buffer = await file.arrayBuffer(); // raw bytes
const url = URL.createObjectURL(file);   // in-memory object URL
```

`URL.createObjectURL` is underused: it creates a temporary `blob:` URL that points directly to the file in memory. You can drop this into an `<img src>` or `<video src>` for instant preview without reading the whole file into a JS string.

### Mental model

Think of `File` as a read-only file handle. The browser has sandboxed access to the file the user explicitly chose — you can't browse the filesystem freely (that's the separate File System Access API). What you get is a snapshot: the file contents at selection time, loaded into memory only when you ask for them.

### Practical scenarios

**Frontend:** Image upload workflows almost always use this. Read the file as an object URL for the preview, read it as an ArrayBuffer if you need to validate magic bytes (checking it's actually a PNG, not just named `.png`), then POST the original `File` object directly in a `FormData` — no re-encoding needed.

**Fullstack:** Client-side CSV/JSON import features. Parse the file in the browser, validate structure and data types before hitting the API, then send only the processed payload. This catches 90% of user errors without a round-trip and avoids storing malformed uploads on the server.

**Edge case worth knowing:** Large files. `file.text()` loads everything into memory at once. For files over ~50MB, stream through a `ReadableStream` via `file.stream()` instead — same interface as the Fetch body API, so the mental model transfers directly.

The API surface is small, but the key insight is that `File` being a `Blob` means it composes cleanly with Fetch, WebSockets, canvas, and audio/video — anywhere that accepts binary data.
