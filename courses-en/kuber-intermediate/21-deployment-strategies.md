# 21. Deployment strategies: blue-green and canary

In [lesson 19](19-pdb-and-rollouts.md) you saw that a Deployment ships with two strategies: **RollingUpdate** and **Recreate**. That covers most day-to-day releases — but not every release model teams use in production.

This lesson covers strategies you build **around** Deployments (and Services / Ingress), not inside `spec.strategy`.

## Recap: what a Deployment can do alone

| Strategy | Behaviour | Typical use |
|---|---|---|
| `RollingUpdate` | New pods come up while old ones drain (`maxSurge` / `maxUnavailable`) | Compatible image bumps, default |
| `Recreate` | All old pods die first, then new ones start | Apps that can't run two versions at once (exclusive lock, single writer) |

Neither gives you an **instant traffic flip** to a fully prepared new version, nor a **small fraction** of traffic for a risky change. For those you need blue-green or canary.

## Blue-green

**Idea:** keep two complete environments (or two Deployments) of the same app:

- **Blue** — currently serving production traffic.
- **Green** — the new version, fully started and checked **before** any user traffic hits it.

When green looks healthy, you **switch the pointer** (Service selector, Ingress backend, or load-balancer target) from blue to green. Rollback is the same switch in reverse — blue is still running.

```text
                    ┌── Deployment web-blue  (v1, Ready)  ◄── traffic
Service web ────────┤
                    └── Deployment web-green (v2, Ready)     idle

After the switch:

                    ┌── Deployment web-blue  (v1, Ready)     idle (rollback ready)
Service web ────────┤
                    └── Deployment web-green (v2, Ready)  ◄── traffic
```

### Minimal Kubernetes shape

1. Two Deployments with a **shared** label (`app=web`) and a **version** label (`version=blue` / `version=green`).
2. One Service whose selector is `app=web` **and** `version=<active>`.
3. Switch = change only the Service selector (or patch the Ingress backend).

```yaml
# Service currently pointing at blue
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
    version: blue   # flip this to green when ready
  ports:
    - port: 80
      targetPort: 80
```

Green must be **Ready** (probes passing, enough replicas) **before** you flip the selector. Otherwise you route traffic into empty Endpoints or failing pods.

### Pros and cons

| Pros | Cons |
|---|---|
| Instant cutover and instant rollback | ~2× capacity while both colours run |
| New version validated before any traffic | Schema / shared-state migrations still need a plan |
| Easy to reason about | Manual switch is easy to botch without automation |

## Canary (manual)

**Idea:** send a **small share** of traffic to the new version; grow the share if metrics look good.

With plain Service selectors (same labels on both Deployments), traffic share ≈ **replica count**:

```text
Deployment web-stable  replicas=9  image=v1   ← ~90%
Deployment web-canary  replicas=1  image=v2   ← ~10%
Service web  selector: { app: web }            ← matches both
```

This is coarse (kube-proxy / iptables / IPVS load-balance by endpoint, not by precise %). For real weighted routing you need Ingress annotations, Gateway API, a service mesh, or a progressive-delivery controller.

## When to use which

| Situation | Prefer |
|---|---|
| Routine, backward-compatible image bump | `RollingUpdate` |
| Must never run two versions together | `Recreate` |
| Need a dry run of the full new stack, then one flip | **Blue-green** |
| Risky change, want gradual exposure + metrics gate | **Canary** (ideally automated) |

## Beyond "out of the box"

Kubernetes does not ship blue-green / canary as first-class Deployment strategies. Common tooling:

- **[Argo Rollouts](https://argoproj.github.io/rollouts/)** — `Rollout` CRD, canary steps, analysis templates, blue-green cutover.
- **[Flagger](https://docs.flagger.app/)** — progressive delivery driven by metrics (usually with Istio / Linkerd / Contour).
- **Gateway API** — weighted backend refs for finer traffic splits than a single Service selector.

You will meet Argo more deeply in [`gitops-basic`](../gitops-basic/README.md) / [`kuber-advanced`](../kuber-advanced/README.md). Here the goal is to understand the **manual** blue-green pattern so those tools make sense later.

## Checklist

- How does blue-green differ from `RollingUpdate`?
- Why must green be Ready **before** you change the Service selector?
- How do you roll back a blue-green cutover without rebuilding anything?
- Why is "canary via replica counts" only an approximation of traffic share?
- What do Argo Rollouts / Flagger add on top of two Deployments + a Service?

In the lab [22-lab-blue-green.md](22-lab-blue-green.md) you will cut traffic from blue to green and verify the switch with the interactive panel.
