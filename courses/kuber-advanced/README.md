# Kubernetes Advanced

Продвинутый уровень для SRE / DevOps / Platform Engineering. Подразумевается, что пройдены [`kuber-basic`](../kuber-basic/README.md) и [`kuber-intermediate`](../kuber-intermediate/README.md).

Цель — **управлять кластером и расширять его**: control plane, scheduling, backup/upgrade, безопасность, GitOps.

Локальная среда: `mockctl up`. Для части лаб нужны дополнительные аддоны (см. фазы ниже).

## Маршрут по приоритету

Проходите **по фазам**, не обязательно подряд по номерам файлов.

### Фаза 1 — CKA-core (начать здесь)

Админские навыки, всё работает на одном `mockctl up`.

| # | Урок |
|---|---|
| 01 | [Архитектура control plane](01-control-plane.md) |
| 02 | [etcd: snapshot и restore](02-etcd.md) |
| 03 | [Лаба: backup/restore etcd](03-lab-etcd.md) |
| 05 | [Taints, tolerations, nodeSelector](05-scheduling-taints.md) |
| 06 | [Affinity и topology spread](06-scheduling-affinity.md) |
| 07 | [Лаба: scheduling на minikube](07-lab-scheduling.md) |
| 23 | [Velero: backup namespace](23-velero.md) |
| 24 | [Лаба: restore через Velero](24-lab-velero.md) |
| 25 | [Cluster upgrade](25-cluster-upgrade.md) |
| 26 | [Лаба: upgrade minikube](26-lab-cluster-upgrade.md) |

### Фаза 2 — CKS-lite

Безопасность приложений и admission. Теория misconfig и SDLC: [appsec-fundamentals](../appsec-fundamentals/README.md).

| # | Урок |
|---|---|
| 18 | [Pod Security Admission](18-pod-security.md) |
| 19 | [SecurityContext](19-securitycontext.md) |
| 20 | [Лаба: pod до Restricted](20-lab-pod-security.md) |
| 10 | [Admission webhooks](10-admission-webhooks.md) |
| 11 | [Лаба: запретить `latest`](11-lab-validating-webhook.md) |

### Фаза 3 — GitOps

| # | Урок |
|---|---|
| 16 | [Argo CD (обзор)](16-argocd.md) |
| 17 | [Лаба: GitOps на этом репозитории](17-lab-argocd.md) |

Углубление: [gitops-basic](../gitops-basic/README.md) → [gitops-intermediate](../gitops-intermediate/README.md) — [`deploy/gitops`](../../deploy/gitops/README.md).

### Фаза 4 — Опционально (нужно больше RAM / времени)

| # | Урок | Требования |
|---|---|---|
| 04 | [Audit logs](04-audit.md) | — |
| 08 | [Сеть: kube-proxy, EndpointSlice](08-network-internals.md) | — |
| 09 | [Лаба: calico + egress](09-lab-cni-calico.md) | `--cni=calico` |
| 12 | [Operators и kubebuilder](12-operators.md) | Go на хосте |
| 13 | [Лаба: оператор Tenant](13-lab-operator.md) | Go, ~4 ГБ RAM |
| 14 | [Prometheus + Grafana](14-observability.md) | Helm, ~4 ГБ RAM |
| 15 | [Лаба: алерт OOMKilled](15-lab-observability.md) | Helm |
| 21 | [Image security, cosign](21-image-security.md) | cosign CLI |
| 22 | [Лаба: подпись образа](22-lab-image-security.md) | cosign |

### Фаза 5 — Финал (после 16–17 и желательно 14–15)

| # | Урок |
|---|---|
| 27 | [Платформа: Argo + Prometheus + audit](27-final-project.md) |

## Что нужно для лаб

| Задача | Команда / действие |
|---|---|
| Базовый кластер | `mockctl up` |
| Calico (фаза 4, лаба 09) | `minikube start -p mock-exams --driver=docker --cni=calico` |
| Helm | `brew install helm` / см. [intermediate/07-helm](../kuber-intermediate/07-helm.md) |
| Velero (фаза 1, лаба 24) | устанавливается в лабе через Helm + MinIO |
| Argo CD (фаза 3) | устанавливается в лабе 17 |

## Подходит для подготовки к

- **CKA** — фазы 1 и 3, частично 2; экзаменный формат → [`mock-cka`](../mock-cka/README.md).
- **CKS** — фаза 2, опционально 21–22.
