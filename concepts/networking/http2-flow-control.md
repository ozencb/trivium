---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

HTTP/2 flow control lets each endpoint tell the other "here's how much data I'm willing to receive right now" — independently per stream and per connection — so a slow consumer doesn't get overwhelmed and fast producers don't waste bandwidth on data that gets dropped.

## Core Mechanism

You already know TCP congestion control, which handles network capacity. HTTP/2 flow control is a separate layer on top, handling *receiver* capacity — the application's ability to process data. TCP doesn't know anything about streams; HTTP/2 does.

Each side maintains two windows: one for the whole connection, one per stream. These start at 65,535 bytes by default (configurable via `SETTINGS` frames). When a sender transmits DATA frames, it decrements its local copy of the receiver's window. The receiver sends `WINDOW_UPDATE` frames to grant more quota. If the sender exhausts a window, it must block — even if TCP would happily send more.

The critical detail: both levels must have available quota simultaneously. You can have a stream window of 1MB but if the connection window is at zero, nothing moves. This two-level design lets you throttle a specific stream without affecting others on the same connection.

## Mental Model

Think of it as store credit. The receiver gives the sender a credit balance upfront. Each byte sent burns credit. The receiver issues new credit (via `WINDOW_UPDATE`) as it consumes data. A receiver that stops issuing credit effectively pauses the sender — no packet loss required, no TCP-level intervention.

Compare to TCP: TCP's receive window is also about buffer capacity, but it's single-channel and managed by the OS. HTTP/2 flow control is application-layer and multiplexed — you can freeze one stream's video download without touching another stream's API response.

## Practical Scenarios

**Backend:** If you're proxying to a slow upstream service, you want to apply backpressure upstream rather than buffer unboundedly in memory. An HTTP/2-aware proxy (like Envoy or Nginx) will shrink the window toward the upstream connection as its internal buffers fill, signaling the upstream to slow down. Without this, you either buffer gigabytes of data or drop connections. This is why `WINDOW_UPDATE` management matters in high-throughput streaming gRPC services.

**Frontend:** Browsers implement flow control to avoid being overwhelmed by server pushes or large streaming responses. If a browser's rendering pipeline is backed up, it can stop issuing window credit to the server. This is why you'll sometimes see network requests stall mid-transfer in DevTools even with a healthy connection — the browser is applying backpressure. For `fetch()` with `ReadableStream`, the browser only expands its window as your JS code reads from the stream, giving you a clean backpressure hook into the HTTP/2 layer.

The main gotcha: HTTP/2 flow control is opt-in from the application's perspective. If your server framework buffers everything before writing to the wire, you lose the benefit — the data is already in memory.
