# 22. Troubleshooting

"What to do when it doesn't work." 90% of debugging starts with `describe` + `events` + `logs`. This lesson turns those three into an actual system.

## Step 1. Figure out where in the chain it broke

The path from user to container:

```
DNS / Ingress -> Service -> Endpoints -> Pod -> Container
```

Work **top to bottom**: does the Service respond, does it have Endpoints, what state is the Pod in, what do the logs say.

```bash
kubectl get ingress
kubectl get svc
kubectl get endpoints <svc>
kubectl get pods -l <label>
kubectl describe pod <name>
```

## Common Pod statuses and what they mean

| Status | Meaning | Where to look |
|--------|--------|----------------|
| `Pending` | Not scheduled yet — no node fits, or a PVC is missing | `kubectl describe` → `Events` |
| `ContainerCreating` | Pulling images / mounting volumes | `describe` → events; `kubectl get events --sort-by=.lastTimestamp` |
| `ImagePullBackOff` / `ErrImagePull` | The image won't pull | check the image name, registry reachability |
| `CrashLoopBackOff` | The container keeps crashing after starting | `kubectl logs <pod> --previous` |
| `OOMKilled` (in `Last State`) | Exceeded its memory limit | `describe`; raise the limit or fix the leak |
| `Running 0/1` | The container's alive, but **readinessProbe** keeps failing | check the probe, the endpoint, init timing |
| `Completed` | The container exited normally | expected for a Job; for a Deployment, usually means a broken `command` |
| `Evicted` | The node evicted the Pod (resource pressure) | check `describe`, the reason is in `Status` |
| `Terminating` (stuck) | A finalizer or volume is blocking cleanup | `kubectl describe`; sometimes `--force --grace-period=0` |

## The core diagnostic commands

```bash
# a full rundown of an object plus its events
kubectl describe pod <name>
kubectl describe deploy <name>
kubectl describe svc <name>

# every event in the namespace
kubectl get events --sort-by=.lastTimestamp
kubectl get events --field-selector type=Warning

# logs
kubectl logs <pod>
kubectl logs <pod> -c <container>
kubectl logs <pod> --previous          # after a crash
kubectl logs deploy/web --tail=100 -f

# get a shell inside
kubectl exec -it <pod> -- sh

# a throwaway Pod for testing from inside the cluster
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh

# forward a port to your host
kubectl port-forward pod/<name> 8080:80
kubectl port-forward svc/<name> 8080:80
```

## Networking problems ("the Service isn't responding")

1. **Are the Endpoints empty?**
   ```bash
   kubectl get endpoints <svc>
   ```
   Zero endpoints usually means the Service's selector doesn't match the Pods' labels, or none of the Pods are `Ready`.

2. **Is the Pod actually `Ready`?**
   ```bash
   kubectl get pods -l <selector>
   ```
   `0/1 Ready` means the readinessProbe isn't passing.

3. **Can a neighboring Pod reach it?**
   ```bash
   kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- \
     wget -qO- http://<svc>:<port>
   ```

4. **Does the name even resolve?**
   ```bash
   kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- \
     nslookup <svc>
   ```

## Images that won't pull

```bash
kubectl describe pod <name>
```

Look at `Events` for:

- `Failed to pull image "..."` — a typo in the name, a tag that doesn't exist, or no network access.
- `ImagePullBackOff` — repeated retries. Once you fix the underlying issue, `apply` again is usually all you need.
- `Authentication required` — the registry is private and needs an **imagePullSecret**.

## Resource problems

```bash
kubectl top pod
kubectl top node
kubectl describe node <name> | grep -A5 'Allocated resources'
```

`Pending` plus an event like `0/1 nodes are available: insufficient cpu/memory` means no node has room for the Pod's `requests`.

## kubectl debug (ephemeral containers)

When the original image doesn't ship `sh`, `curl`, or `nc`:

```bash
kubectl debug -it <pod> --image=busybox:1.36 --target=<container-name>
```

This attaches a "debug container" alongside the Pod, sharing its process namespace.

For a node:

```bash
kubectl debug node/<node> -it --image=busybox:1.36
```

## When the API itself seems broken

If nothing works at all:

```bash
kubectl cluster-info
kubectl get componentstatuses           # deprecated, but still informative
kubectl get nodes
kubectl get pods -n kube-system         # the system components
```

If `kubectl` itself isn't responding, check your `kubeconfig` (`kubectl config view`) and whether the API server is reachable (the address from kubeconfig, usually on port `6443`).

## A "nothing works" checklist

1. `kubectl get pods` — is everything `Running` and `READY`?
2. `kubectl describe pod` — what's in `Events`?
3. `kubectl logs <pod> [--previous]` — what does the app itself say?
4. `kubectl get svc` + `kubectl get endpoints` — does the Service actually know about the Pods?
5. From a throwaway Pod, does `wget`/`curl` to the Service get a response?
6. Does DNS work (`nslookup <svc>`)?
7. If there's an Ingress — `kubectl describe ingress`, and the `ingress-nginx-controller` logs.
8. Resources / quotas — `kubectl top`, `describe node`.
