# 06. Kubernetes: типовые misconfiguration

## Введение

Kubernetes даёт **мощный API** — ошибка конфигурации масштабируется на все namespace. DevSecOps в страховании и финтехе чаще всего **закрывает misconfig**, а не пишет эксплойты.

---

## Top misconfigurations (CIS / практика)

| # | Misconfig | Impact |
|---|-----------|--------|
| 1 | Anonymous / overly broad RBAC | чтение secrets, deploy |
| 2 | `cluster-admin` для default SA | полный кластер |
| 3 | No NetworkPolicy | lateral movement |
| 4 | Secrets в env без encryption at rest | etcd leak |
| 5 | Privileged pods | host escape |
| 6 | `hostPath` с sensitive paths | чтение `/etc`, docker.sock |
| 7 | Ingress без TLS | MITM |
| 8 | `allowPrivilegeEscalation: true` | cap escalation |
| 9 | No resource limits | DoS node |
| 10 | Public LoadBalancer на admin svc | internet-facing admin |
| 11 | `imagePullPolicy: Always` + `:latest` | непредсказуемый deploy |
| 12 | Dashboard / metrics без auth | reconnaissance |

---

## RBAC и ServiceAccount

```text
Principle: default SA → no permissions
         app SA → Role минимум для одного NS
         CI SA → deploy только target NS
```

| Проверка | Команда / подход |
|----------|------------------|
| Кто cluster-admin? | `kubectl auth can-i --list --as=system:serviceaccount:...` |
| Bindings в kube-system | audit + rbac lookup |

Практика: [kuber-intermediate/09–10](../kuber-intermediate/09-rbac.md).

---

## NetworkPolicy

Без policy **весь pod mesh = flat network**.

| Паттерн | Правило |
|---------|---------|
| Default deny ingress | deny all, allow from ingress NS |
| Egress to DB only | port 5432 to CIDR RDS |
| Deny metadata | egress except 169.254.169.254 |

Практика: [kuber-intermediate/11–12](../kuber-intermediate/11-networkpolicy.md).

---

## Pod Security Admission

| Уровень | Для кого |
|---------|----------|
| privileged | system components только |
| baseline | legacy apps с ограничениями |
| restricted | новые prod workloads |

Практика: [kuber-advanced/18–20](../kuber-advanced/18-pod-security.md).

---

## Admission и policy

| Инструмент | Задача |
|------------|--------|
| **Kyverno** | validate, mutate, generate |
| **OPA Gatekeeper** | Rego policies |
| Validating webhook | custom (дороже в поддержке) |

Примеры политик: запрет `latest`, require labels, require resources, verify cosign.

Практика: [kuber-advanced/11](../kuber-advanced/11-lab-validating-webhook.md).

---

## etcd и control plane

| Риск | Контроль |
|------|----------|
| Unencrypted etcd | encryption at rest |
| No audit | [kuber-advanced/04](../kuber-advanced/04-audit.md) |
| Exposed API server | private endpoint, authorized networks |

Managed K8s (EKS, Yandex MK8s) — часть на провайдере; **вы** отвечаете за workload config.

---

## Multi-tenancy

| Уровень | Изоляция |
|---------|----------|
| Namespace | RBAC + NP + quotas |
| vCluster / separate cluster | сильнее для regulated |
| Cell architecture | blast radius по региону |

---

## В mock-exams

| Тема | Курс |
|------|------|
| RBAC lab | [kuber-intermediate/10](../kuber-intermediate/10-lab-rbac.md) |
| NP lab | [kuber-intermediate/12](../kuber-intermediate/12-lab-networkpolicy.md) |
| cosign + Kyverno | [kuber-advanced/21–22](../kuber-advanced/21-image-security.md) |
| mock-cka | [mock-cka](../mock-cka/README.md) Q2, Q3, Q7 |

---

## Резюме

K8s security = **RBAC + network segmentation + pod hardening + admission + audit**. Сканеры (Kubescape, Polaris) дополняют, не заменяют понимание.

---

## Чек-лист

- [ ] Default deny NetworkPolicy в prod NS?
- [ ] Есть ли Pod Security level restricted?
- [ ] Audit policy логирует доступ к secrets?

**Дальше:** [07. CI/CD атаки](07-cicd-attacks.md).
