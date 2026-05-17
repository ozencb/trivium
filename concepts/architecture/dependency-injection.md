---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Dependency Injection** is about *who* constructs a component's collaborators. Instead of a class building its own dependencies, they're handed in from outside — which makes them explicit, substitutable, and testable without changing the component itself.

## The Core Inversion

The invariant DI enforces: a component must never reach out and grab its own dependencies. The moment it does (`new EmailService()`, `config.GetDatabase()`), it's coupled to that specific implementation. You've lost the ability to swap, mock, or compose differently.

DI flips this — components declare requirements at their boundary (constructor, method signature), and the *caller* decides what satisfies them. The component is coupled to a *contract*, not an *implementation*.

```python
# Tightly coupled — hardwired to SmtpMailer
class OrderService:
    def __init__(self):
        self.mailer = SmtpMailer()

# DI — caller decides what Mailer means
class OrderService:
    def __init__(self, mailer: Mailer):
        self.mailer = mailer
```

In tests, pass a `FakeMailer`. In prod, pass `SmtpMailer`. `OrderService` never changes.

**Mental model:** A restaurant chef doesn't go buy their own ingredients — they declare what they need and the supply chain delivers it. They're coupled to the *interface* of ingredients, not the source. You can swap suppliers without touching the chef's code.

## In Practice

**Backend:** DI containers (Spring, NestJS, .NET) wire up the entire object graph at startup. The real payoff is twofold: unit tests run without live infrastructure (no SMTP server, no real DB), and you can swap implementations (in-memory cache → Redis) without touching business logic. Watch for constructor bloat — a constructor taking 8 dependencies is a design smell, not a DI problem.

**Frontend:** React's version is often implicit. Hooks like `useContext` inject values; components receive data and callbacks via props. The principle is the same: a component shouldn't reach into global state or call `fetch` directly — it should receive what it needs. Pure prop interfaces are easier to test and compose precisely because dependencies are visible.

**Fullstack:** At architectural boundaries, DI is what keeps layers honest. Your HTTP handler shouldn't know how to query a database — it receives a repository interface. This is the foundation of hexagonal architecture: the domain declares what it needs via ports, infrastructure satisfies those ports, and DI wires it together. Without DI as the mechanism, "ports and adapters" is just a diagram.

## Common Pitfall

DI containers can become a black box that obscures what gets constructed and when. Prefer explicit constructor injection over field/property injection — the constructor forces you to confront complexity as it grows, which is a feature, not a bug. If injection is happening via reflection or annotation magic and you can't trace the wiring, you've traded one form of coupling for another.
