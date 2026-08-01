# 5. Pods

## What a Pod is

A **Pod** is the **smallest deployable unit** in Kubernetes. A Pod holds one or more containers that:

- All run **on the same node**.
- Share a **network namespace** — one IP, shared ports, and they can reach each other over `localhost`.
- Share **volumes**, if any are declared on the Pod.

In 99% of cases a Pod has **exactly one container**. Multiple containers only get bundled together when they're tightly coupled — a sidecar, a proxy, a log shipper.

## The things worth understanding about Pods

1. **Pods are disposable.** If a node dies, or a Pod dies for good, nothing brings it back on its own. That job belongs to a controller (ReplicaSet/Deployment).
2. **A Pod generally doesn't have a "permanent" IP.** Recreate it, and it gets a different one.
3. **A "bare" Pod** (one with no controller) is almost never used in production. You normally create a **Deployment**, and it spins up Pods for you.

## Fields you'll see a lot

- `spec.containers[]` — the container list: `name`, `image`, `ports`, `env`, `resources`.
- `spec.restartPolicy` — `Always` (the default for Pods coming from a Deployment), `OnFailure`, `Never`.
- `spec.nodeSelector` / `affinity` — where the Pod is allowed to be scheduled.
- `spec.volumes` — shared volumes.

## Lifecycle phases

| Phase | Meaning |
|------|--------|
| **Pending** | The Pod exists, but its containers aren't running yet (waiting for a node, pulling an image). |
| **Running** | At least one container is running. |
| **Succeeded** | All containers finished **successfully** and won't restart. |
| **Failed** | All containers finished, and at least one ended in error. |
| **Unknown** | The state can't be determined. |

`READY` also shows whether the **readinessProbe** is passing: `1/1`, `0/1`, and so on.

## Commands you'll use constantly

```bash
kubectl get pods
kubectl get pods -o wide              # + IP and node
kubectl describe pod <name>           # events and the reason things broke
kubectl logs <name>                   # logs (works if there's one container)
kubectl logs <name> -c <container>    # logs for a specific container
kubectl exec -it <name> -- sh         # get a shell inside
kubectl delete pod <name>             # delete the Pod
```

## Spinning one up quickly (no YAML)

```bash
kubectl run nginx --image=nginx:1.27
kubectl get pods
kubectl delete pod nginx
```

`kubectl run` is great for a quick throwaway check; in real work Pods are described in a **YAML manifest** and applied with `kubectl apply -f`.
