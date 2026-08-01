# Mock CKAD — Run 01

**Level:** low. **Time:** 90 minutes. **Topics:** Pod, Deployment, Service, ConfigMap, Secret, Namespace.

Work is assumed in the current kube-context. All commands are relative to the repository.

## Preparation

```bash
mockctl up
bash courses/mock-ckad/01/prepare.sh
```

`prepare.sh` will create namespaces `dev` and `qa`, a deployment `legacy` in `qa`, and set the current namespace to `dev`.

## Tasks

### Q1. Namespace and context

In namespace `dev` create a pod `q1` with the image `nginx:1.27-alpine`. The pod must have the label `tier=frontend`.

### Q2. Deployment with replicas

In namespace `dev` create a deployment `web`:

- image `nginx:1.27-alpine`;
- 4 replicas;
- pod label `app=web`;
- the container listens on port `80`.

### Q3. ConfigMap and environment variables

In namespace `dev` create a ConfigMap `app-config` with the pairs:

- `LOG_LEVEL=debug`
- `APP_MODE=test`

In the `web` deployment (Q2) make all keys of `app-config` available as **environment variables** in the container.

### Q4. Secret and mounting as a file

In namespace `dev` create a Secret `db-secret` with the field `password=p@ssw0rd`.

In the `web` deployment mount this Secret into the directory `/etc/db-secret/` (so that `/etc/db-secret/password` is a file with the password contents).

### Q5. Service

Create a Service `web-svc` in namespace `dev` for the `web` deployment, of type `ClusterIP` on port `80`. Selector — `app=web`.

Check: from a temporary pod `kubectl run tmp --image=busybox -it --rm -- wget -qO- web-svc` should return the nginx page.

### Q6. NodePort to an existing deployment

In namespace `qa` there is already a deployment `legacy` (created by `prepare.sh`). Make it externally accessible through a Service `legacy-svc` of type `NodePort` on port `30080`.

### Q7. Counting resources

Write **only the number** to the file `~/q7-answer.txt` — how many pods are currently running in namespaces `dev` and `qa` combined (status `Running`).

Hint: `kubectl get pods -A --field-selector=status.phase=Running -o name | wc -l`, but filter by namespace.

## Verification

```bash
bash courses/mock-ckad/01/verify.sh
```

Output like:

```text
[OK]   Q1: pod q1 in dev with image nginx:1.27-alpine and label tier=frontend
[OK]   Q2: deployment web with 4 replicas
[FAIL] Q3: env LOG_LEVEL not found in web container
[OK]   Q4: secret db-secret mounted at /etc/db-secret
[OK]   Q5: service web-svc reachable on port 80
[OK]   Q6: legacy-svc is NodePort on 30080
[FAIL] Q7: ~/q7-answer.txt missing or wrong

Score: 5 / 7  (sdano: net, need >=5)
```

(70% of 7 ≈ 5 — you need at least 5 to «pass»).

## Cleanup

```bash
kubectl delete ns dev qa
```

Or for a completely clean cluster: `mockctl clean && mockctl up`.

## After your attempt

Open [`solution.md`](solution.md) — it has a walkthrough of each question with commands and YAML.
