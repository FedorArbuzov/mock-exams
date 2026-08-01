# 06. Kubernetes: common misconfigurations

## Intro

Kubernetes gives you a **powerful API** — a configuration mistake scales across all namespaces. In insurance and fintech, DevSecOps most often **closes misconfigs** rather than writing exploits.

---

## Top misconfigurations (CIS / practice)

| # | Misconfig | Impact |
|---|-----------|--------|
| 1 | Anonymous / overly broad RBAC | reading secrets, deploying |
| 2 | `cluster-admin` for the default SA | the entire cluster |
| 3 | No NetworkPolicy | lateral movement |
| 4 | Secrets in env without encryption at rest | etcd leak |
| 5 | Privileged pods | host escape |
| 6 | `hostPath` with sensitive paths | reading `/etc`, docker.sock |
| 7 | Ingress without TLS | MITM |
| 8 | `allowPrivilegeEscalation: true` | cap escalation |
| 9 | No resource limits | DoS on the node |
| 10 | Public LoadBalancer on an admin svc | internet-facing admin |
| 11 | `imagePullPolicy: Always` + `:latest` | unpredictable deploy |
| 12 | Dashboard / metrics without auth | reconnaissance |

---

## RBAC and ServiceAccount

```text
Principle: default SA → no permissions
         app SA → Role, minimum for a single NS
         CI SA → deploy only to the target NS
```

| Check | Command / approach |
|----------|------------------|
| Who is cluster-admin? | `kubectl auth can-i --list --as=system:serviceaccount:...` |
| Bindings in kube-system | audit + rbac lookup |

Practice: [kuber-intermediate/09–10](../kuber-intermediate/09-rbac.md).

---

## NetworkPolicy

Without a policy, the **entire pod mesh = a flat network**.

| Pattern | Rule |
|---------|---------|
| Default deny ingress | deny all, allow from the ingress NS |
| Egress to DB only | port 5432 to the RDS CIDR |
| Deny metadata | egress except 169.254.169.254 |

Practice: [kuber-intermediate/11–12](../kuber-intermediate/11-networkpolicy.md).

---

## Pod Security Admission

| Level | For whom |
|---------|----------|
| privileged | system components only |
| baseline | legacy apps with constraints |
| restricted | new prod workloads |

Practice: [kuber-advanced/18–20](../kuber-advanced/18-pod-security.md).

---

## Admission and policy

| Tool | Task |
|------------|--------|
| **Kyverno** | validate, mutate, generate |
| **OPA Gatekeeper** | Rego policies |
| Validating webhook | custom (more expensive to maintain) |

Example policies: deny `latest`, require labels, require resources, verify cosign.

Practice: [kuber-advanced/11](../kuber-advanced/11-lab-validating-webhook.md).

---

## etcd and control plane

| Risk | Control |
|------|----------|
| Unencrypted etcd | encryption at rest |
| No audit | [kuber-advanced/04](../kuber-advanced/04-audit.md) |
| Exposed API server | private endpoint, authorized networks |

Managed K8s (EKS, Yandex MK8s) — part is on the provider; **you** are responsible for the workload config.

---

## Multi-tenancy

| Level | Isolation |
|---------|----------|
| Namespace | RBAC + NP + quotas |
| vCluster / separate cluster | stronger for regulated |
| Cell architecture | blast radius per region |

---

## In mock-exams

| Topic | Course |
|------|------|
| RBAC lab | [kuber-intermediate/10](../kuber-intermediate/10-lab-rbac.md) |
| NP lab | [kuber-intermediate/12](../kuber-intermediate/12-lab-networkpolicy.md) |
| cosign + Kyverno | [kuber-advanced/21–22](../kuber-advanced/21-image-security.md) |
| mock-cka | [mock-cka](../mock-cka/README.md) Q2, Q3, Q7 |

---

## Summary

K8s security = **RBAC + network segmentation + pod hardening + admission + audit**. Scanners (Kubescape, Polaris) complement, but don't replace, understanding.

---

## Checklist

- [ ] Default deny NetworkPolicy in prod NS?
- [ ] Is there a Pod Security level of restricted?
- [ ] Does the audit policy log access to secrets?

**Next:** [07. CI/CD attacks](07-cicd-attacks.md).
