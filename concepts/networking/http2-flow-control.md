---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## HTTP/2 Flow Control

HTTP/2 flow control is a credit-based backpressure mechanism that lets receivers control how much data senders push at them — independently per stream and per connection. It exists because TCP's own flow control operates at the connection level, but HTTP/2 multiplexes many streams over one connection, so you need a second layer to prevent one fast stream from overwhelming a slow consumer on another.

**The core mechanism**

Each side maintains two receive windows: one for the connection, one per stream. These start at 65,535 bytes by default (adjustable via `SETTINGS_INITIAL_WINDOW_SIZE`). The sender tracks these window sizes and can only transmit DATA frames up to the available credit. When the receiver processes data and frees buffer space, it sends a `WINDOW_UPDATE` frame granting more credits. If the window hits zero, the sender stalls — completely halts — until it gets more credits.

Crucially, the connection window and stream window are consumed independently. Sending 64KB on stream 1 drains the stream-1 window *and* the connection window. Both have to be replenished.

**Mental model**

Think of it as a token bucket, but managed by the receiver. The sender starts with N tokens. Every byte sent burns a token. The receiver mails back new tokens as it processes data. If the receiver is slow (slow disk write, slow downstream service), it stops mailing tokens, and the sender pauses. This is deliberate: it's backpressure propagated upstream rather than letting buffers blow up.

**Backend scenarios**

The most common pitfall is a gRPC streaming handler that reads from a slow source (database cursor, external API) without explicitly managing flow control. The client sends requests faster than the server can process them; the server's receive window drains; the client stalls; latency spikes. Libraries like grpc-go let you call `RecvMsg` which implicitly sends `WINDOW_UPDATE` — but if you're batching or delaying reads, you can accidentally starve the sender.

Another real one: proxy servers that buffer entire responses before forwarding. If the downstream client has a tiny window and your proxy isn't forwarding `WINDOW_UPDATE` frames from the client back to the origin, the origin stalls mid-response.

**Frontend scenarios**

Large file downloads or chunked streaming responses from a server. If the browser's networking stack is processing a response slowly (e.g., doing expensive work per chunk in a ReadableStream), it may delay WINDOW_UPDATE frames. The server stalls. From the user's perspective this just looks like a slow download, but the server is actually idle waiting for permission to send more.

**The practical takeaway**

HTTP/2 flow control is usually invisible until it isn't. When you see connections stalling at exactly 64KB or multiples thereof, or gRPC streams timing out under load, flow control exhaustion is the first thing to check. The fix is almost always either increasing initial window size in your server config, or ensuring your application reads from streams promptly so `WINDOW_UPDATE` frames go out in time.
