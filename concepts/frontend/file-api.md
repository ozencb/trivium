---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## File API

The browser's File API gives JavaScript structured access to files the user selects or drags into the page — without a round trip to a server. It's the difference between immediately previewing an image the user picked versus uploading it blind and waiting for a response.

### Core mechanism

When a user interacts with `<input type="file">` or a drop target, the browser hands you `FileList` — a collection of `File` objects. A `File` is a `Blob` subclass, which matters: it means you get the full Blob interface (slicing, streaming) plus file-specific metadata (`name`, `size`, `type`, `lastModified`) that's available **synchronously** because the browser already read it from the filesystem's directory entry.

Reading the *contents* is always async. The modern path uses promise-based methods directly on the File object:

```js
const file = input.files[0];
console.log(file.name, file.size); // sync — no I/O needed

const text = await file.text();        // UTF-8 string
const buffer = await file.arrayBuffer(); // raw bytes
const stream = file.stream();          // ReadableStream for large files
```

The older `FileReader` API (`.readAsDataURL()`, `.readAsText()`, etc.) is event-driven and still common in legacy code, but you rarely need it for new work.

### The mental model

Think of `File` as a handle — a reference to bytes sitting on disk. Metadata is on the handle itself; the bytes are behind an async door. The browser controls when that door opens, which is why there's no synchronous content read: it protects the main thread from blocking on potentially slow disk I/O.

### Where this shows up

**Image preview before upload.** Read the file as a data URL or call `URL.createObjectURL(file)` (which creates a temporary object URL backed by the file's bytes, never touching your server) and drop it into an `<img>`. Instant preview with zero bandwidth cost.

**Client-side validation.** Check `file.type` and `file.size` before sending anything. Reject a 200MB video meant for a profile photo before the user waits through a pointless upload.

**Chunked uploads.** This is where `Blob.slice()` earns its keep. Large files can be split into fixed-size chunks and uploaded in parallel or sequentially with resume support:

```js
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
  const chunk = file.slice(offset, offset + CHUNK_SIZE);
  await uploadChunk(chunk, offset);
}
```

**CSV/JSON parsing.** Read the file as text, parse it, and render a table — common in internal tools where users import data without you needing an upload endpoint at all.

### Pitfalls

`file.type` is derived from the file extension, not the actual content — a renamed `.txt` file with image bytes will claim `text/plain`. For anything security-sensitive, validate magic bytes in an `ArrayBuffer` instead. Also, object URLs from `URL.createObjectURL()` leak memory until you call `URL.revokeObjectURL()` or the document unloads.
