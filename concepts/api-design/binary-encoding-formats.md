---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Binary Encoding Formats

You already know Protocol Buffers — binary encoding formats are the broader family that protobuf belongs to, each making different tradeoffs between schema strictness, self-description, and wire size.

**The core mechanism**

JSON wastes bytes on structure: field names repeat on every record, numbers are ASCII strings, booleans are 4-5 character literals. Binary formats eliminate this by encoding type information and structure as compact byte sequences rather than human-readable characters.

The interesting split is *schema coupling*:

- **MessagePack / CBOR**: Self-describing. Every message carries its own structure — field names, types, nesting — encoded as compact binary rather than ASCII. No schema file needed. Think "JSON with a tighter encoding." You gain ~30-50% size reduction and faster parsing with zero schema coordination.

- **Avro**: Schema is shared out-of-band (stored in a registry or embedded once in a file header), then stripped from every subsequent record. A 1000-field record uses zero bytes describing field names — just values in the agreed-upon order. This is the most compact option but requires schema coordination at read time.

- **Thrift**: Similar to protobuf — IDL-defined, field tags embedded in the message, schema-evolved via tag numbering. Facebook's origin gives it strong multi-language codegen.

**Mental model**

Imagine you're sending 10 million CSV rows. You could send column headers with every row (JSON-style), send headers once and assume readers know the schema (Avro), or embed compact field IDs that reference a shared schema (protobuf/Thrift). Each corresponds to a real format.

**Where this matters in practice**

*Backend services*: When your services already use protobuf, you don't need to reach for these. But if you're adding a websocket protocol or a mobile API where you don't control schema distribution, MessagePack is a drop-in JSON replacement that's faster to parse and smaller on the wire without requiring a build step.

*Data pipelines*: Avro is dominant here — Kafka's Schema Registry is built around it. The pattern is: schema lives in the registry, every message is just values. You get strong schema evolution guarantees (readers can handle writer schemas from different versions) while keeping per-record overhead near zero. If you're processing billions of events, this matters.

**Common pitfall**

Self-describing formats (MessagePack, CBOR) feel like "free wins" over JSON — same flexibility, better performance — but they don't give you schema enforcement. You lose the contract guarantees that make protobuf/Avro worth their setup cost. Teams often reach for MessagePack as an easy optimization and then hit schema drift bugs that protobuf would have caught at compile time.

Pick schema-coupled (Avro, Thrift) when you own both sides of the wire and schema evolution is a real concern. Pick self-describing (MessagePack) when you're replacing JSON in a dynamic or schema-flexible context and want the performance without the coordination overhead.
