# Mock CKA

Simulation of the **CKA** (Certified Kubernetes Administrator) exam. Three runs of **7 tasks** each, with **120 minutes** allotted per run — closer to the real CKA (15–17 tasks in 2 hours; here you train **for speed** in blocks).

**Prerequisites:**

- [`kuber-basic`](../kuber-basic/README.md) + [`kuber-intermediate`](../kuber-intermediate/README.md)
- [`kuber-advanced`](../kuber-advanced/README.md) **phase 1** (control plane, etcd, scheduling, upgrade)
- Recommended: [`mock-ckad`](../mock-ckad/README.md) — to get used to the «task → verify» format

## Format

```text
mock-cka/<NN>/
├── README.md       # tasks (RU)
├── prepare.sh      # namespace and «broken» resources
├── verify.sh       # automated kubectl/jsonpath checks
└── solution.md     # reference solution (after your attempt)
```

```bash
mockctl up
bash courses/mock-cka/01/prepare.sh
# 120 minutes — README.md
bash courses/mock-cka/01/verify.sh
```

**Pass** threshold: ≥ **70%** (as on the exam: ~5 of 7).

## Runs

| # | CKA topics | Difficulty | Time |
|---|----------|-----------|-------|
| [01](01/README.md) | RBAC, namespace/context, node labels, fix deployment, ResourceQuota, cluster inventory | Low | 90–120 min |
| [02](02/README.md) | Taints/tolerations, nodeSelector, affinity, cordon, probes, PriorityClass | Medium | 120 min |
| [03](03/README.md) | etcd snapshot (minikube), PVC, NetworkPolicy, Service/ConfigMap fix, auth can-i | High | 120 min |

CKA domain coverage (educational):

| CKA domain | Runs |
|-----------|---------|
| Cluster architecture, RBAC | 01, 03 |
| Workloads & scheduling | 01, 02 |
| Services & networking | 03 |
| Storage | 03 |
| Troubleshooting | 01–03 |

## Environment

- Cluster: `mockctl up` (minikube `mock-exams`, metrics-server + ingress).
- Profile: `MOCKCTL_PROFILE` (default `mock-exams`).
- **etcd backup (run 03):** only via `minikube -p mock-exams ssh` — as in [kuber-advanced/03-lab-etcd](../kuber-advanced/03-lab-etcd.md). A full restore on the exam runs on kubeadm; in mock-exams we verify the **snapshot**, not full disaster recovery.
- **Cordon/drain (run 02):** on a single node drain is limited; Q4–Q5 test **cordon** and knowledge of drain commands (see the run 02 README).

## Cleanup

```bash
kubectl delete ns cka-m1 cka-m1-vault cka-m2 cka-m3 cka-m3-mon cka-m3-locked --ignore-not-found
rm -f ~/cka-m1-q6.txt ~/cka-r2-q4.txt ~/cka-r3-etcd.db ~/cka-m3-q7.txt 2>/dev/null
```

Or: `mockctl clean && mockctl up`.

## Hotkeys (as on the exam)

```bash
export do="--dry-run=client -o yaml"
export now="--grace-period=0 --force"
alias k=kubectl
```

Documentation: <https://kubernetes.io/docs/> (on the exam one K8s + CNCF tab is open).

## Related courses

| kuber-advanced lesson | mock-cka run |
|---------------------|-----------------|
| 01 control plane | 01 Q6, 03 Q6 |
| 02–03 etcd | 03 Q1 |
| 05–07 scheduling | 02 |
| 25–26 upgrade | theory (we don't emulate kubeadm upgrade in mock) |

After three runs at ≥ 80% — a good signal of CKA readiness. Next: the real killer.sh / CKA simulator, advanced phase 2 (CKS-lite).
