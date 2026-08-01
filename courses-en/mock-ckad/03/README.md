# Mock CKAD — Run 03

**Level:** high. **Time:** 120 minutes. **Topics:** Ingress, NetworkPolicy, RBAC, ServiceAccount, HPA, deployment strategies.

It is assumed that the `metrics-server` and `ingress` addons are enabled — `mockctl up` already does this.

## Preparation

```bash
mockctl up
bash courses/mock-ckad/03/prepare.sh
```

`prepare.sh` will create namespaces `web`, `internal`, `secure`, and pre-deploy the helper services `frontend`, `backend`, `internal-api`.

## Tasks

### Q1. Ingress by host

Create an Ingress `app-ingress` in namespace `web`:

- host `app.local`;
- path `/` → service `frontend:80`;
- path `/api` → service `backend:8080`;
- ingressClass — the one enabled in minikube (default `nginx`).

Local check: `curl --resolve app.local:80:$(minikube ip -p mock-exams) http://app.local/` returns the `frontend` page.

### Q2. NetworkPolicy: a «locked» namespace

In namespace `secure` deny all incoming traffic, **except**:

- from pods with label `role=monitoring` in any namespace;
- from any pods in namespace `secure`.

Do not restrict egress in this task.

### Q3. ServiceAccount + RBAC

In namespace `internal` create:

- ServiceAccount `reader`;
- Role `pod-reader` allowing verbs `get,list,watch` on `pods` in namespace `internal`;
- RoleBinding between `reader` and `pod-reader`.

Create a pod `kubectl-pod` in namespace `internal`:

- image `bitnami/kubectl:latest`;
- command: `sleep 3600`;
- uses ServiceAccount `reader`.

Check: from this pod `kubectl get pods -n internal` works, while `kubectl get pods -n web` fails with Forbidden.

### Q4. HPA by CPU

For the existing deployment `cpu-hog` in namespace `web` create a HorizontalPodAutoscaler:

- minReplicas: 2;
- maxReplicas: 6;
- target average CPU utilization: 50%.

Check: `kubectl get hpa -n web` shows `2/50%` (or close) and no fewer than 2 replicas.

### Q5. Rolling update with specific maxSurge / maxUnavailable

Update the existing deployment `frontend` in namespace `web`:

- strategy `RollingUpdate`;
- `maxSurge: 1`;
- `maxUnavailable: 0`;
- `revisionHistoryLimit: 5`.

And update the image: `nginx:1.27-alpine` → `nginx:1.28-alpine`. Wait for the rollout to complete.

### Q6. Rollback a deployment

After Q5 verify that the current revision is the latest one, then roll back to the previous one (`nginx:1.27-alpine`). After the rollback, `kubectl rollout history` should show a correct current revision.

### Q7. Service over a network path

In namespace `secure` create:

- deployment `secret-svc` (`nginx:1.27-alpine`, 2 replicas);
- Service `secret-svc` of type `ClusterIP` on port 80.

From a pod with label `role=monitoring` (created by `prepare.sh` in namespace `monitoring`), `wget secret-svc.secure` should work. From any other pod — no.

### Q8. Liveness restart limits

In namespace `web` create a deployment `crashloop`:

- image `busybox`;
- command: `sh -c 'echo started; sleep 5; exit 1'`;
- `restartPolicy: Always` (default);
- liveness probe `tcpSocket: 80` every 5 seconds (this is intentional — the port is not open, so the pod will be considered unhealthy).

Watch it for 30 seconds and write **only the string** to the file `~/q8-answer.txt` — the actual pod status (`CrashLoopBackOff`, `Running`, `Pending`, etc.) at the moment the test finishes (the value that would be returned by `kubectl get pod ... -o jsonpath='{.status.containerStatuses[0].state}'`'s key).

## Verification

```bash
bash courses/mock-ckad/03/verify.sh
```

8 questions; to «pass» you need at least 6.

## Cleanup

```bash
kubectl delete ns web internal secure monitoring
```

## After your attempt

Open [`solution.md`](solution.md).
