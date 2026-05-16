---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## gRPC

gRPC is a typed RPC framework that uses Protocol Buffers as both the IDL and wire format, and HTTP/2 as the transport. The core motivation: REST gives you conventions, gRPC gives you a contract — one that's enforced by generated code on both sides of the wire.

### How it actually works

You define services in a `.proto` file — methods, request types, response types. The `protoc` compiler generates a client stub and a server interface in your target language. The client stub looks like a local method call; under the hood it serializes the request with protobuf, opens an HTTP/2 stream, and sends the binary payload. The server deserializes, runs your handler, and sends back a protobuf-encoded response over the same stream.

Because gRPC runs over HTTP/2, every call is a stream — even unary ones. This means a single TCP connection handles all concurrent RPCs via multiplexed streams, no head-of-line blocking, and HPACK header compression on repeated metadata. That's the HTTP/2 knowledge you already have cashing in directly.

gRPC also exposes all four call patterns the HTTP/2 stream model makes possible: unary (one request, one response), server streaming, client streaming, and bidirectional streaming.

### Mental model

Think of it as a remote function call where the compiler is your contract enforcer. If service A changes a method signature in the proto, service B's generated stub won't compile against the old definition. Compare this to REST, where a renamed field silently breaks things at runtime.

### In practice

**Backend (microservices):** This is gRPC's home turf. Internal service-to-service calls benefit from the low overhead (binary encoding is 3-10x smaller than JSON for most schemas), the strict interface contract, and streaming support for things like real-time telemetry or large data transfers. Generated stubs eliminate hand-rolled HTTP clients and manual deserialization.

**Fullstack:** gRPC-Web (with a proxy like Envoy or the `grpc-web` package's built-in proxy) lets browser clients call gRPC backends. More practically, even if you keep REST at the edge, you can share `.proto` files between your backend services and a BFF layer, giving you compile-time safety across service boundaries without OpenAPI drift. Teams using Buf Schema Registry take this further — central proto registry, breaking change detection in CI.

The real leverage is the contract-first workflow: define the interface, generate the code, and let the toolchain catch mismatches before they hit production.
