---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Hexagonal Architecture (Ports and Adapters)

Organizes application logic around ports and adapters so that domain code has no dependencies on infrastructure, making it independently testable and swappable without touching business rules. The key shift: your domain *defines* the contracts; infrastructure *conforms* to them — not the other way around.

---

### The Core Mechanism

You already know the Repository Pattern. Hexagonal generalizes that idea to every infrastructure concern. Your domain declares a `PaymentGateway` interface (a *port*), and Stripe, PayPal, or a test double each implement it (an *adapter*). The hexagon — your domain and application logic — sits in the center. Nothing inside it imports a database driver, an HTTP library, or a queue client.

There are two sides:

- **Driving adapters** (primary) — things that *invoke* your application: HTTP controllers, CLI handlers, gRPC servers. They call into your domain through inbound ports (use-case interfaces).
- **Driven adapters** (secondary) — things your application *calls out to*: database repos, email services, event publishers. Your domain defines the outbound port; the adapter implements it.

Dependency Injection is the wiring mechanism. DI you already know — hexagonal just disciplines *what* gets injected and from which direction.

---

### Mental Model

Think of your domain as a USB hub. Ports are the slots — they define a contract with no knowledge of what plugs in. Adapters are the devices. You can swap a PostgreSQL adapter for an in-memory one in tests, or swap SendGrid for a no-op adapter in CI, without the hub caring at all.

---

### In Practice

**Backend:** You're building a fraud detection service. The domain contains complex rules — velocity checks, device fingerprinting, ML score thresholds. With hexagonal, you test all that logic with in-memory adapters. No test database, no HTTP mocks, no environment config. The domain just runs. When the ML model provider changes, you write a new adapter.

**Fullstack:** Your API sends notifications. The domain defines `NotificationPort`. Production wires in SendGrid. Tests wire in an in-memory capture adapter you can assert against. When the product team wants to add in-app WebSocket notifications alongside email, you add an adapter — the domain is untouched.

---

### Where Engineers Get It Wrong

The two most common mistakes: first, leaking infrastructure concerns into ports (a port that returns a `ResultSet` instead of domain objects isn't a port — it's a thin wrapper). Second, applying this to simple CRUD services where there's no real domain logic. The ceremony isn't free; it earns its keep when the domain is complex, long-lived, or needs isolation from volatile infrastructure.

---

### The Interview Signal

Most engineers understand layering (HTTP → Service → Repository → DB). Fewer can articulate *dependency direction* — why the domain should own the interfaces and infrastructure should depend on it, not vice versa. That distinction, and knowing when it's worth the overhead, is what separates architects from implementers.
