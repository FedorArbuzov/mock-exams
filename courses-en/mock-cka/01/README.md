# Mock CKA — Run 01

**Level:** low. **Time:** 90–120 minutes. **CKA domain:** cluster, RBAC, workloads, troubleshooting (basic).

Related: [kuber-advanced/01](../kuber-advanced/01-control-plane.md), [intermediate RBAC](../kuber-intermediate/README.md).

## Preparation

```bash
mockctl up
bash courses/mock-cka/01/prepare.sh
```

This creates namespaces `cka-m1`, `cka-m1-vault` and a broken deployment `billing-api`.

## Tasks

### Q1. Context and namespace

Set the default namespace for the **current** kube-context to `cka-m1` (so that `kubectl get pods` without `-n` shows the pods in `cka-m1`).

### Q2. RBAC in a namespace

In namespace `cka-m1` create:

- ServiceAccount `ops`;
- Role `ops-deploy-reader` with `get`, `list`, `watch` permissions on the `deployments` resource;
- RoleBinding `ops-deploy-reader` binding SA `ops` to this Role.

### Q3. Node labels

Label **all** cluster nodes with `workload=general`.

### Q4. Fix the deployment

In `cka-m1` the deployment `billing-api` does not come up (wrong image). Fix it:

- image: `nginx:1.27-alpine`;
- replicas: **2**;
- pod label `app=billing` (already on the deployment — keep it).

Wait for `2/2` Ready.

### Q5. ClusterRole for secrets

Create:

- ClusterRole `secret-reader` — verbs `get`, `list` on the `secrets` resource (all namespaces);
- ClusterRoleBinding `vault-sync-secrets`, bound to ServiceAccount `vault-sync` in namespace `cka-m1-vault` (the SA is already created by `prepare.sh`).

### Q6. Control plane inventory

Write **only the number** to the file `~/cka-m1-q6.txt` — how many pods are in `Running` status in namespace `kube-system`.

### Q7. ResourceQuota

In `cka-m1` create a ResourceQuota `platform-quota`:

- `cpu`: `4`
- `memory`: `8Gi`
- `pods`: `20`

## Verification

```bash
bash courses/mock-cka/01/verify.sh
```

## Cleanup

```bash
kubectl delete ns cka-m1 cka-m1-vault
rm -f ~/cka-m1-q6.txt
```

## After your attempt

[`solution.md`](solution.md)
