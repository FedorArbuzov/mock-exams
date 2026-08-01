# Kubernetes Advanced

Advanced level for SRE / DevOps / Platform Engineering. Assumes you have completed [`kuber-basic`](../kuber-basic/README.md) and [`kuber-intermediate`](../kuber-intermediate/README.md).

Goal — **manage and extend the cluster**: control plane, scheduling, backup/upgrade, security, GitOps.

Local environment: `mockctl up`. Some labs need extra add-ons (see phases below).

## Route by priority

Go **phase by phase**, not necessarily in file-number order.

### Phase 1 — CKA-core (start here)

Admin skills, everything runs on a single `mockctl up`.

| # | Lesson |
|---|---|
| 01 | [Control plane architecture](01-control-plane.md) |
| 02 | [etcd: snapshot and restore](02-etcd.md) |
| 03 | [Lab: etcd backup/restore](03-lab-etcd.md) |
| 05 | [Taints, tolerations, nodeSelector](05-scheduling-taints.md) |
| 06 | [Affinity and topology spread](06-scheduling-affinity.md) |
| 07 | [Lab: scheduling on minikube](07-lab-scheduling.md) |
| 23 | [Velero: backup namespace](23-velero.md) |
| 24 | [Lab: restore via Velero](24-lab-velero.md) |
| 25 | [Cluster upgrade](25-cluster-upgrade.md) |
| 26 | [Lab: upgrade minikube](26-lab-cluster-upgrade.md) |

### Phase 2 — CKS-lite

Application security and admission. Misconfig and SDLC theory: [appsec-fundamentals](../appsec-fundamentals/README.md).

| # | Lesson |
|---|---|
| 18 | [Pod Security Admission](18-pod-security.md) |
| 19 | [SecurityContext](19-securitycontext.md) |
| 20 | [Lab: pod to Restricted](20-lab-pod-security.md) |
| 10 | [Admission webhooks](10-admission-webhooks.md) |
| 11 | [Lab: forbid `latest`](11-lab-validating-webhook.md) |
| 28 | [Ingress mTLS](28-ingress-mtls.md) |
| 29 | [Lab: mTLS external API](29-lab-ingress-mtls.md) |

### Phase 3 — GitOps

| # | Lesson |
|---|---|
| 16 | [Argo CD (overview)](16-argocd.md) |
| 17 | [Lab: GitOps on this repository](17-lab-argocd.md) |

Going deeper: [gitops-basic](../gitops-basic/README.md) → [gitops-intermediate](../gitops-intermediate/README.md) — [`deploy/gitops`](../../deploy/gitops/README.md).

### Phase 4 — Optional (needs more RAM / time)

| # | Lesson | Requirements |
|---|---|---|
| 04 | [Audit logs](04-audit.md) | — |
| 08 | [Networking: kube-proxy, EndpointSlice](08-network-internals.md) | — |
| 09 | [Lab: calico + egress](09-lab-cni-calico.md) | `--cni=calico` |
| 12 | [Operators and kubebuilder](12-operators.md) | Go on the host |
| 13 | [Lab: Tenant operator](13-lab-operator.md) | Go, ~4 GB RAM |
| 14 | [Prometheus + Grafana](14-observability.md) | Helm, ~4 GB RAM |
| 15 | [Lab: OOMKilled alert](15-lab-observability.md) | Helm |
| 21 | [Image security, cosign](21-image-security.md) | cosign CLI |
| 22 | [Lab: sign an image](22-lab-image-security.md) | cosign |

### Phase 5 — Final (after 16–17 and preferably 14–15)

| # | Lesson |
|---|---|
| 27 | [Platform: Argo + Prometheus + audit](27-final-project.md) |

## What you need for the labs

| Task | Command / action |
|---|---|
| Base cluster | `mockctl up` |
| Calico (phase 4, lab 09) | `minikube start -p mock-exams --driver=docker --cni=calico` |
| Helm | `brew install helm` / see [intermediate/07-helm](../kuber-intermediate/07-helm.md) |
| Velero (phase 1, lab 24) | installed in the lab via Helm + MinIO |
| Argo CD (phase 3) | installed in lab 17 |
| Ingress mTLS (lab 29) | Helm ingress-nginx + `bash deploy/kuber-mtls/scripts/generate-certs.sh` |

## Good preparation for

- **CKA** — phases 1 and 3, partly 2; exam format → [`mock-cka`](../mock-cka/README.md).
- **CKS** — phase 2 (including 28–29 mTLS), optionally 21–22.
