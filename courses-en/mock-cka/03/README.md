# Mock CKA — Run 03

**Level:** high. **Time:** 120 minutes. **CKA domain:** storage, networking, troubleshooting, etcd, RBAC.

Related: [kuber-advanced/02–03 etcd](../kuber-advanced/02-etcd.md), [intermediate NetworkPolicy](../kuber-intermediate/README.md).

## Preparation

```bash
mockctl up
bash courses/mock-cka/03/prepare.sh
```

## Tasks

### Q1. etcd snapshot (minikube)

Take an etcd snapshot and save it on the **host** to the file `~/cka-r3-etcd.db`.

Hint (profile `mock-exams`):

```bash
PROFILE="${MOCKCTL_PROFILE:-mock-exams}"
minikube -p "$PROFILE" ssh -- sudo ETCDCTL_API=3 etcdctl snapshot save /tmp/snap.db \
  --cacert=/var/lib/minikube/certs/etcd/ca.crt \
  --cert=/var/lib/minikube/certs/etcd/server.crt \
  --key=/var/lib/minikube/certs/etcd/server.key \
  --endpoints=https://127.0.0.1:2379
minikube -p "$PROFILE" cp "$PROFILE:/tmp/snap.db" ~/cka-r3-etcd.db
```

Full restore — [kuber-advanced/03-lab-etcd](../kuber-advanced/03-lab-etcd.md); on mock-CKA only the **presence of the snapshot file** is verified.

### Q2. PVC and Pod

In namespace `cka-m3`:

- PVC `data-vol`: `1Gi`, `ReadWriteOnce`, default StorageClass;
- Pod `vol-writer`: `busybox:1.36`, command `sh -c 'echo ok > /data/marker && sleep 3600'`, volume mount `/data` from the PVC.

### Q3. NetworkPolicy

In `cka-m3-locked` create a NetworkPolicy `deny-except-monitoring`:

- **Ingress:** allow only from pods with label `role=monitoring` (any namespace);
- from pods in the same namespace `cka-m3-locked` — allow;
- all other ingress — deny (via policyTypes Ingress + rules).

### Q4. Service without endpoints

In `cka-m3` the Service `web-svc` does not route traffic (wrong selector). Fix the selector so the endpoints point to the pods of deployment `web` (`app=web`).

### Q5. ConfigMap in a deployment

The deployment `cfg-app` in `cka-m3` must:

- mount or use env from ConfigMap `app-cfg`;
- environment variable `MODE` = the value of the `MODE` key from the ConfigMap;
- pod in **Running** status.

### Q6. Control plane (theory on the cluster)

Write **one word** to the file `~/cka-m3-q6.txt` — the name of the control plane component whose data is stored in **etcd** (expected: `etcd`).

### Q7. RBAC: read only

In `cka-m3` create:

- ServiceAccount `viewer`;
- Role `pod-reader`: `get`, `list`, `watch` on `pods`;
- RoleBinding `pod-viewer` → SA `viewer`.

Do **not** grant `create` on pods. Check: `kubectl auth can-i create pods --as=system:serviceaccount:cka-m3:viewer -n cka-m3` → `no`.

## Verification

```bash
bash courses/mock-cka/03/verify.sh
```

## Cleanup

```bash
kubectl delete ns cka-m3 cka-m3-mon cka-m3-locked
rm -f ~/cka-r3-etcd.db ~/cka-m3-q6.txt
```

## After your attempt

[`solution.md`](solution.md)
