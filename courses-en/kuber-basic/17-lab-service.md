# 17. Lab: Service

The goal: expose a group of Pods under one stable name, and confirm traffic actually gets load-balanced across them.

> **Interactive check.** In `mockctl web`, use the **Interactive lab** panel under the title. **Start lab** clears any leftover `web` Deployment/Service; create the Deployment and Service, then press **Check**. Auto-check target: **Task 1** — Deployment `web` Ready, Service `web` with selector `app=web` and at least one Endpoint. Run Check with the selector set to `app=web` (restore it after Task 5). **Cleanup** removes the `web` Deployment and Service.

## Setup

Bring up the Deployment from lab 11 if it isn't running already:

```bash
kubectl apply -f deploy.yaml      # web, 2 replicas, label app=web
kubectl get pods -l app=web
```

## Task 1. A ClusterIP Service

Use this `svc.yaml` example (you can add `name` labels/annotations if you want):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
```

```bash
kubectl apply -f svc.yaml
kubectl get svc web
kubectl get endpoints web
```

**Check:** `endpoints` lists two IPs — the Pods from the Deployment.

## Task 2. Reaching it from inside the cluster

Spin up a throwaway Pod and hit the Service by name:

```bash
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
# inside:
wget -qO- http://web | head -n 5
```

**Check:** you get back the default nginx page.

## Task 3. Watching the load balancing

To actually see the balancing in action, let's make each Pod serve its own name.

1. Overwrite the page in every Pod with something unique to it:
   ```bash
   # bash / zsh
   for p in $(kubectl get pods -l app=web -o name); do
     kubectl exec $p -- sh -c "echo $p > /usr/share/nginx/html/index.html"
   done
   ```
   ```powershell
   # PowerShell
   kubectl get pods -l app=web -o name | ForEach-Object {
     kubectl exec $_ -- sh -c "echo $_ > /usr/share/nginx/html/index.html"
   }
   ```

2. From a throwaway Pod, hit the Service a bunch of times:
   ```bash
   # bash / zsh
   kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
   for i in $(seq 1 10); do wget -qO- http://web; done
   ```
   ```powershell
   # PowerShell — from inside the temporary Pod's shell:
   1..10 | ForEach-Object { wget -qO- http://web }
   ```

**Check:** the responses show different Pod names as you keep hitting it.

## Task 4. NodePort

1. Edit `svc.yaml`: change `type` to `NodePort` and add `nodePort: 30080` under the port entry (keep port 80 / targetPort 80).
2. `kubectl apply -f svc.yaml`.
3. Open the Service through minikube:
   ```bash
   minikube -p mock-exams service web --url
   ```
4. Open the resulting URL in a browser.

**Check:** you see the nginx page in your browser.

## Task 5. A selector pointed at nothing

1. Change the Service's `selector` to `app: nope`.
2. Apply it and check endpoints:
   ```bash
   kubectl get endpoints web
   ```

**What should happen:** endpoints comes back **empty** — requests to the Service go nowhere. This is a classic real-world mistake: selector and Pod labels drifting apart.

3. Set `selector: app: web` back.

## Task 6. port-forward

```bash
kubectl port-forward svc/web 8080:80
```

On your host, open `http://localhost:8080`.

**Check:** the page loads. `port-forward` only works while the command stays running.

## Cleanup

```bash
kubectl delete -f svc.yaml
```

## Check yourself

1. What do `ClusterIP`, `NodePort`, and `LoadBalancer` have in common, and where do they differ?
2. Why does `EndpointSlice` exist if `Endpoints` already does the job?
3. Why is the Service `web` reachable just by that name from any Pod in the same namespace?
