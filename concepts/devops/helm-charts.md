---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Helm Charts

Helm is the package manager for Kubernetes. Where raw K8s manifests are static files you copy-paste and mutate per environment, Helm charts are parameterized templates — the same chart renders into different manifests depending on what values you pass in. The "why" is straightforward: maintaining separate `deployment-dev.yaml`, `deployment-staging.yaml`, `deployment-prod.yaml` that are 95% identical is how configuration drift starts.

**Core mechanism**

A chart is a directory with a defined structure: `Chart.yaml` (name, version, dependencies), `values.yaml` (defaults), and `templates/` (Go-templated K8s manifests). The templating is genuinely Go's `text/template` with Helm extensions — `{{ .Values.image.tag }}`, `{{ if .Values.autoscaling.enabled }}`, etc.

When you run `helm install my-app ./chart --set image.tag=v1.2.3`, Helm merges your overrides with `values.yaml`, renders every file in `templates/`, and applies the result to the cluster. Critically, it also stores a record of that release as a Secret in the cluster. This is what enables `helm rollback my-app 2` — Helm has the previously rendered manifests and can re-apply them.

**Mental model**

Think of a chart as a function: `render(chart, values) → []KubernetesManifest`. The chart defines structure and defaults; values are arguments. A "release" is a named invocation of that function — you can have `my-app-prod` and `my-app-staging` as two separate releases from the same chart, each with their own history, each independently upgradeable.

**Practical application**

For DevOps workflows, Helm fits naturally into CI/CD: your pipeline passes `--set image.tag=$GIT_SHA` and Helm handles the rest. Environment-specific differences (replica counts, resource limits, ingress hostnames) live in per-environment `values-prod.yaml` files that are reviewable and version-controlled.

For SREs, the value is standardization. You publish an internal chart for "a typical web service" with sane defaults baked in — liveness probes, resource requests, PodDisruptionBudgets — and teams override only what they need. This enforces patterns without requiring platform team approval on every manifest.

**Where it breaks down**

Helm is the right tool when your variation between environments is value-level (image tags, replica counts, feature flags). It gets painful when your manifests structurally differ — when staging needs a Job that prod doesn't, or when conditional logic in templates starts resembling a programming problem. At that point, you're fighting Go templates and should consider Kustomize overlays or a higher-level abstraction.

The other common trap: `values.yaml` that exposes every field in every resource, trying to be maximally flexible. Charts should have opinions. Exposing everything makes the chart nearly as hard to maintain as raw manifests.
