---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Port Binding

An application should be **self-contained and expose its functionality by binding to a port itself** — not by relying on an external runtime to inject a web server around it. This is what makes an app independently deployable and composable.

### The core mechanism

The old model: you write a WAR file, drop it into Tomcat, Tomcat handles HTTP. The app is not a server — it's a plugin into one. Port binding flips this. Your app imports an HTTP library (Express, Gin, Django, whatever), starts listening on a port at boot, and that's it. The app *is* the server.

The port itself is just a number. In development it's `localhost:8080`. In production, the platform (Kubernetes, Fly.io, Railway) maps an external address to that port — the app doesn't care. It just binds and listens.

This also means one process can consume another's port binding as a backing service. Your API talks to Redis on `localhost:6379` without knowing or caring whether that's a local process, a container sidecar, or a managed cloud service with a port-forwarded tunnel in front of it.

### Mental model

Think of your app as a vending machine. It doesn't need to be installed inside a department store to function — it brings its own coin slot. You plug it in anywhere (power = network), and it's ready. The "coin slot" is the port binding. The store's layout (platform routing) decides what address customers use to reach it, but the machine itself owns its interface.

### Practical scenarios

**Backend:** When you switch from running Flask behind Gunicorn-inside-uWSGI to just `uvicorn main:app --port 8000`, you're applying port binding. The app owns its concurrency model and network interface. This also means you can run two instances on different ports for local testing without any server config changes.

**DevOps:** Port binding is the contract between your app and the container runtime. `EXPOSE 8080` in a Dockerfile and `containerPort: 8080` in a Kubernetes pod spec are both expressing the same thing — "the app will bind here, route traffic to this address." Without this model, you can't do horizontal scaling cleanly: the orchestrator needs to know where each instance is listening to load-balance across them.

It's also why environment-based port injection (`PORT=8080 node server.js`) is the right pattern — the platform can assign any port it wants, the app reads it, binds there, and the platform handles the rest.
