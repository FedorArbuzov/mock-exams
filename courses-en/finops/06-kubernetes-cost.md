# 06. EKS, Fargate, idle capacity

## Intro

The **EKS control plane** is a fixed charge (~$0.10/hour/cluster) regardless of Pod count. Main spend is **worker nodes**, **EBS**, **LB**, **data transfer**. Training clusters left after labs are the #1 source of leak.

Related: [aws-advanced/13–14 EKS](../aws-advanced/13-eks-architecture.md), [kuber-intermediate HPA](../kuber-intermediate/README.md).

---

## EKS cost structure

```text
EKS control plane (fixed)
  + EC2 / Fargate workers (variable)
  + EBS volumes
  + ELB/ALB (Ingress)
  + NAT Gateway (egress from private nodes)
  + CloudWatch logs (control plane audit optional)
```

---

## Node groups

| Strategy | Cost | When |
|-----------|------|-------|
| Fixed 3× large | high baseline | simplicity |
| Cluster Autoscaler | pay for used nodes | variable load |
| Karpenter | faster scale, more flexible types | modern EKS |
| Spot nodes | up to ~70% off | fault-tolerant workloads |
| Fargate | no node ops, $/vCPU-hour | batch, low steady state |

**Over-provisioned requests:** sum of `requests.cpu` > real node capacity → CA won’t shrink the cluster.

---

## Idle and waste

| Waste | How to find |
|-------|-----------|
| Empty namespace | `kubectl get pods -A` |
| Forgotten minikube/mockctl on EC2 | tags + budget |
| Old LoadBalancer Services | `kubectl get svc` TYPE=LoadBalancer |
| Unused PVC | `kubectl get pvc` |
| system pods on oversized nodes | Kubecost idle cost |

**Training leak:** EKS + NAT 24/7 after a weekend lab → **destroy** ([optional-aws cleanup](../aws-advanced/optional-aws-advanced.md)).

---

## Fargate vs EC2 workers

| | Fargate | EC2 MNG |
|---|---------|---------|
| Ops | no SSH to node | patch AMI |
| Cost at steady 24/7 | often more expensive | cheaper at high utilization |
| Bin packing | per-task | you control it |

---

## IRSA and networking

- **VPC endpoints** for S3/ECR — less NAT GB ([08](08-storage-network-cost.md)).
- **Private cluster** — no public API endpoint if policy requires it (ops complexity ≠ always cheaper).

---

## mockctl (local)

`mockctl up` on a laptop — **$0 AWS**, but teaches labels/requests patterns for [07-kubecost](07-kubecost.md).

---

## Summary

EKS cost = **nodes + egress + LB**. Rightsizing K8s — **requests/limits**, autoscaling, Spot, cleanup of training clusters.

---

## Checklist

- [ ] Do you know $/month for the control plane per cluster?
- [ ] Is CA/Karpenter in the prod design?
- [ ] After EKS labs, is there a destroy checklist?

**Next:** [07. Kubecost](07-kubecost.md).
