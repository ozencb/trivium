---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Port Binding

Port binding means the application itself owns and opens its network listener — it doesn't get plugged into an external web server at deploy time. The app reads a port from the environment and binds to it directly, making the network interface part of the application artifact, not the infrastructure configuration.

### The Core Idea

Traditional deployment models (PHP behind Apache, Ruby behind Passenger, Java WAR files in Tomcat) inverted this: the web server process managed the socket, and your code was loaded as a plugin or module into it. Port binding flips this. Your app starts an HTTP server internally — Express, Gunicorn, Jetty — and owns the socket from line one of boot. The port number itself comes from `PORT` in the environment, following 12-Factor's config principle.

This isn't just aesthetic. When the app owns its port, it has no runtime dependency on external server infrastructure. You can run it anywhere a port is available — laptop, container, VM — without configuring an Apache virtualhost or an nginx `location` block just to get started.

### Concrete Model

Think of it as: **a service is a process + a port**. That process can be anything that listens — HTTP, gRPC, raw TCP. The port is its public address. Route traffic to `localhost:3000` during dev, to `10.0.1.5:3000` in staging, to an internal load balancer in prod — the app code doesn't change.

This is also why services can chain: Service A's `DATABASE_URL` is just `http://service-b:5432`. Service B is itself port-bound, so it's composable as a backing service for others.

### Backend Reality

In practice this means your Go service calls `http.ListenAndServe(":"+os.Getenv("PORT"), handler)` and that's the whole server setup. No external process manager wires up the socket. The tradeoff: you're now responsible for graceful shutdown, TLS termination decisions, and connection limits — things a dedicated web server used to abstract. Most teams push TLS termination to a sidecar or load balancer and keep the app speaking plain HTTP internally.

### DevOps Perspective

Port binding is what makes containers composable. Docker's `-p 8080:3000` is just mapping the host port to the container's self-bound port. Kubernetes `containerPort` is documentation of the same thing. Without port binding, you'd need a web server installed in every image and configured per-deploy. With it, the image is self-sufficient — deploy it anywhere, expose whatever port you want externally, the app doesn't care.

The common pitfall: hardcoding port `8080` instead of reading from the environment. Fine locally, breaks in orchestrators that assign ports dynamically or run multiple instances on the same host.
