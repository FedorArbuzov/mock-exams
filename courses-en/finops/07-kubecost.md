# 07. Kubecost and allocation in Kubernetes

## Intro

AWS Cost Explorer sees an **EC2 instance ID**, not **namespace checkout**. **Kubecost** (and analogs: OpenCost, CloudHealth container) ties the **cloud bill** to **Kubernetes objects** via labels and metrics.

---

## What Kubecost gives you

| Feature | Why |
|---------|--------|
| Allocation by namespace/label | showback to teams |
| Idle cost | nodes “eat” capacity Pods don’t use |
| Rightsizing recommendations | requests vs usage |
| Asset costs | PV, LB, external IPs |
| Alerts | spend spike by namespace |

Open-source core: **OpenCost** — CNCF; Kubecost — commercial UI/enterprise features.

---

## Architecture (simplified)

```text
Prometheus metrics (cAdvisor/kube-state-metrics)
        +
Cloud billing API / CUR integration (optional on AWS)
        ↓
Kubecost cost-model
        ↓
UI / API / alerts
```

On **mockctl** without AWS billing — **in-cluster** allocation (CPU/RAM share), still useful for **requests discipline**.

---

## Install on mockctl (optional)

```bash
mockctl up
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm repo update
helm install kubecost kubecost/cost-analyzer \
  -n kubecost --create-namespace \
  --set kubecostProductConfigs.clusterName=mock-exams
kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090:9090
```

UI: `http://localhost:9090` — sections **Allocation**, **Assets**, **Efficiency**.

**RAM:** +1–2 GB for the cluster; on a weak laptop — read the theory only.

---

## Labels for allocation

In Kubecost configure **allocation labels** (example):

```yaml
# values.yaml fragment
kubecostProductConfigs:
  labelMappingConfigs:
    enabled: true
  commonLabels:
    - team
    - app
    - env
```

A Pod **without** `team` → lands in `__unallocated__` — a red flag on review.

---

## Requests / limits and cost

Kubecost counts **reserved** cost from requests, **usage** from actual consumption:

| Situation | Signal |
|----------|--------|
| requests >> usage | overpaying on scheduling |
| no requests | scheduling chaos, poor allocation |
| limits << spike | OOMKill, not a cost issue |

Related: [kuber-intermediate resources](../kuber-intermediate/15-resources-qos.md).

---

## OpenCost (briefly)

```bash
kubectl apply -f https://raw.githubusercontent.com/opencost/opencost/develop/kubernetes/opencost.yaml
```

Export metrics to Prometheus/Grafana — if you already have an [observability stack](../../deploy/observability/README.md).

---

## In mock-exams

After install:

1. `kubectl apply -f deploy/gitops/manifests/hello-gitops/` (if workloads exist).
2. Allocation → by namespace.
3. Find the **highest cost** deployment; propose 1 rightsizing action.

---

## Summary

Kubecost closes the K8s **blind spot** in the AWS bill. Minimum without SaaS: labels + OpenCost + monthly review of the allocation table.

---

## Checklist

- [ ] Are required Pod labels defined?
- [ ] Do you understand idle vs unallocated?
- [ ] (Optional) Does the Kubecost UI open on mockctl?

**Next:** [08. S3, NAT, transfer](08-storage-network-cost.md).
