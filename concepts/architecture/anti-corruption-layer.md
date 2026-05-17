---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Anti-Corruption Layer

When two bounded contexts need to communicate, their domain models rarely align cleanly. An Anti-Corruption Layer (ACL) is a dedicated translation component that sits at that boundary, converting concepts from one model into the native language of the other — preventing external semantics from bleeding in and distorting your domain.

### The core mechanism

An ACL is not a proxy or a thin wrapper. It actively maps between two conceptually different representations of what might be the "same" thing. It owns the translation logic: it knows how the external model works and how your model works, and it bridges them without either side knowing about the other's structure.

The key insight is that the translation is *lossy by design*. You don't preserve every field from the external system — you extract what your domain actually cares about and express it in your own terms. This is different from serialization, which aims for fidelity. An ACL aims for semantic correctness within your model.

Structurally, an ACL typically contains:
- **Translators/Mappers** — convert types, field names, enum values, relationships
- **Facades** — present a clean interface to the external system, hiding its API shape
- **Adapters** — handle protocol or transport differences if needed

### Concrete example

You're building an order fulfillment service. The warehouse system you integrate with has a concept of `ShipmentRequest` with fields like `carrier_code`, `priority_flag`, and `warehouse_zone`. Your domain has `Delivery` with `shippingMethod`, `isExpedited`, and `fulfillmentRegion`.

Without an ACL, your domain objects start sprouting `carrier_code` references. Developers start thinking in the warehouse system's terms. A bug in the warehouse API forces changes throughout your domain layer.

With an ACL, a `WarehouseAdapter` translates outbound `Delivery` objects into `ShipmentRequest` format before calling the external API, and translates inbound responses back into your domain's `ShipmentConfirmation`. The warehouse model never touches your domain layer.

### When to reach for this

- **Legacy system integration** — the most common case. Old systems have models that made sense in their era but are conceptually different from your current domain.
- **Third-party vendor APIs** — payment processors, CRMs, ERPs. Their data models reflect their domain, not yours.
- **Merging bounded contexts** — after an acquisition or major refactor, where two systems must coexist before full migration.

### Common pitfalls

The biggest trap is building an ACL that's too thin — essentially just field renaming. If you find yourself mapping `external.carrier_code` directly to `internal.carrier_code`, you've copied the concept, not translated it. The ACL should produce types that would exist even if the external system didn't.

The second trap is letting the ACL grow into a God Object that encodes business logic. Translation logic only — business rules belong in your domain.

An ACL has a cost: it's another layer to maintain, and it can become stale when the external system changes. That cost is justified when the external model is genuinely incompatible with your domain or when the external system is volatile enough that you want to isolate your core from its churn.
