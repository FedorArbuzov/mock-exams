# 20. Lab: PDB, rolling update, drain

On Docker Desktop with a **worker** node, drain can move pods off that node. On a **single-node** cluster you still see PDB blocking extra evictions, but pods have nowhere else to land — that's OK for learning.

See [ENVIRONMENT.md](ENVIRONMENT.md) for drain tips.

## Setup

```bash
kubectl create namespace lab-pdb
kubectl config set-context --current --namespace=lab-pdb
```

## Task 1. Deployment with RollingUpdate

`web.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      terminationGracePeriodSeconds: 15
      containers:
        - name: nginx
          image: nginx:1.27-alpine
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]
```

```bash
kubectl apply -f web.yaml
kubectl rollout status deploy/web
kubectl get pods -l app=web
```

## Task 2. Create a PDB

`pdb.yaml`:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: web-pdb }
spec:
  selector:
    matchLabels: { app: web }
  minAvailable: 3
```

```bash
kubectl apply -f pdb.yaml
kubectl get pdb web-pdb
```

**What you'll see:** `ALLOWED DISRUPTIONS: 1` in the output. You have 4 pods and need a minimum of 3 → one can be evacuated at a time.

## Task 3. Roll out a new image

```bash
kubectl set image deploy/web nginx=nginx:1.28-alpine
kubectl rollout status deploy/web
```

In parallel, in a second tab:

```bash
kubectl get pods -l app=web -w
```

**What you'll see:** **3..5** pods alive at a time (max 1 unavailable + max 1 surge). Old ones are shut down, new ones come up. Each removal takes 5 seconds in `Terminating` (because of preStop), then it disappears.

## Task 4. Eviction via the API

To see that the PDB really blocks things — try deleting via the eviction API:

```bash
POD=$(kubectl get pod -l app=web -o jsonpath='{.items[0].metadata.name}')
kubectl get pdb web-pdb -o jsonpath='{.status.disruptionsAllowed}{"\n"}'
# = 1

# Right now one eviction is allowed:
kubectl exec -n kube-system -it $(kubectl get pod -n kube-system -l k8s-app=kube-apiserver -o name 2>/dev/null | head -1) 2>/dev/null || true
```

Delete via eviction (there's a ready-made script `kubectl delete --grace-period=0`, but that is NOT via eviction; eviction is done through the API, and it's easier via `kubectl drain`):

```bash
# Prefer a worker node if you have one:
NODE=$(kubectl get nodes -l '!node-role.kubernetes.io/control-plane' -o jsonpath='{.items[0].metadata.name}')
# fallback to any node:
[ -z "$NODE" ] && NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
echo "draining $NODE"
kubectl drain "$NODE" --ignore-daemonsets --delete-emptydir-data --force --pod-selector=app=web
```

**What you'll see:** drain removes one pod, then may "hang" while waiting for PDB / reschedule. With a second node, a replacement pod can land there; with one node, the cordoned node blocks new pods until you uncordon.

In a separate tab, check:

```bash
kubectl get pdb web-pdb
kubectl get pods -l app=web -o wide
```

## Task 5. Remove the cordon

```bash
kubectl uncordon "$NODE"
kubectl get pods -l app=web -w
```

**What you'll see:** a new pod comes up (the node is schedulable again), and the `Available` count in the PDB grows back to 4.

If drain is still "hanging" in the second tab — it will finish automatically.

## Task 6. A PDB that's too strict

Change the PDB to `minAvailable: 4` and try a rollout:

```bash
kubectl patch pdb web-pdb -p '{"spec":{"minAvailable":4}}'
kubectl get pdb
# ALLOWED DISRUPTIONS: 0

kubectl set image deploy/web nginx=nginx:1.27.1-alpine
kubectl rollout status deploy/web --timeout=60s
```

**What you'll see:** the rollout "hangs". The Deployment **can't** remove the old pods, because the PDB forbids dropping below 4. With `maxSurge: 1` it can **first** create a 5th pod, and only then remove one — which is what happens, just more slowly. If it were `maxSurge: 0`, the rollout would be stuck for good.

Roll the PDB back:

```bash
kubectl patch pdb web-pdb -p '{"spec":{"minAvailable":3}}'
kubectl rollout status deploy/web
```

## Cleanup

```bash
kubectl delete namespace lab-pdb
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. Which kinds of disruption does a PDB not protect against?
2. What happens to `kubectl drain` if the PDB forbids evicting all of the pods?
3. Why is `preStop` with `sleep 5` needed?
4. What will `kubectl get pdb -o jsonpath='{.status.disruptionsAllowed}'` return if you have 4 pods and `minAvailable: 4`?
5. Can a PDB block the Deployment rollout itself? Under what conditions?
