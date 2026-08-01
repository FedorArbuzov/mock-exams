# 16. Service

## Why you need a Service

Pods are short-lived — their IPs change, they get recreated. For clients to reach a group of Pods reliably, you need a **Service**:

- A stable **internal address** (`ClusterIP`) and **DNS name** (`<name>.<namespace>.svc.cluster.local`).
- **Load balancing** across whichever Pods match its `selector`.

## How a Service picks its Pods

Through its **`selector`** — in other words, by **Pod labels**. There's no hard link to a Deployment or ReplicaSet; a Service only ever looks at labels.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - name: http
      port: 80          # the Service's own port
      targetPort: 80    # the port on the Pod
  type: ClusterIP
```

## Service types

| Type | What it does | When to use it |
|------|------------|---------------------|
| **ClusterIP** (default) | A virtual IP visible **only inside the cluster**. | Service-to-service traffic. |
| **NodePort** | Opens the same port on **every node** (`30000–32767`). Reachable from outside as `NodeIP:NodePort`. | Simple external access for dev/testing. |
| **LoadBalancer** | Asks the cloud provider for an external load balancer. On a local cluster with no LB provider, it just sits in `Pending`. | Production, in the cloud. |
| **ExternalName** | A DNS alias (CNAME) to an external name. No selector involved. | Wrapping an external host under an in-cluster name. |

## DNS inside the cluster

Say you created a Service `web` in the `default` namespace. Pods can reach it as:

- `web` (from the same namespace)
- `web.default` (short form)
- `web.default.svc.cluster.local` (fully qualified)

## Endpoints — who's actually behind the Service

Under the hood, a Service tracks the list of Pod IPs in an **Endpoints/EndpointSlice** object:

```bash
kubectl get endpoints web
kubectl get endpointslices -l kubernetes.io/service-name=web
```

An empty list usually means the selector doesn't match any Pod labels, or none of the Pods are `Ready`.

## Commands worth knowing

```bash
kubectl get svc
kubectl describe svc web
kubectl get endpoints web

# a quick throwaway Pod, just to test reachability from inside the cluster
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
# inside:
# wget -qO- http://web
```

## Reaching a minikube Service from your host

minikube has a handy shortcut:

```bash
minikube -p mock-exams service web
```

It opens a tunnel and, most of the time, launches a browser for you. Or just forward the port yourself:

```bash
kubectl port-forward svc/web 8080:80
# then open http://localhost:8080
```
