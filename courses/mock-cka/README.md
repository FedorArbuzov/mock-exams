# Mock CKA

Имитация экзамена **CKA** (Certified Kubernetes Administrator). Три прогона по **7 задач**, на каждый заложено **120 минут** — ближе к реальному CKA (15–17 заданий за 2 часа, здесь тренировка **на скорость** блоками).

**Предварительно:**

- [`kuber-basic`](../kuber-basic/README.md) + [`kuber-intermediate`](../kuber-intermediate/README.md)
- [`kuber-advanced`](../kuber-advanced/README.md) **фаза 1** (control plane, etcd, scheduling, upgrade)
- Желательно: [`mock-ckad`](../mock-ckad/README.md) — привычка к формату «задача → verify»

## Формат

```text
mock-cka/<NN>/
├── README.md       # условия (RU)
├── prepare.sh      # namespace и «сломанные» ресурсы
├── verify.sh       # автопроверка kubectl/jsonpath
└── solution.md     # эталон (после попытки)
```

```bash
mockctl up
bash courses/mock-cka/01/prepare.sh
# 120 минут — README.md
bash courses/mock-cka/01/verify.sh
```

Порог **сдано:** ≥ **70%** (как на экзамене: ~5 из 7).

## Прогоны

| # | Темы CKA | Сложность | Время |
|---|----------|-----------|-------|
| [01](01/README.md) | RBAC, namespace/context, node labels, fix deployment, ResourceQuota, cluster inventory | Низкая | 90–120 мин |
| [02](02/README.md) | Taints/tolerations, nodeSelector, affinity, cordon, probes, PriorityClass | Средняя | 120 мин |
| [03](03/README.md) | etcd snapshot (minikube), PVC, NetworkPolicy, Service/ConfigMap fix, auth can-i | Высокая | 120 мин |

Покрытие доменов CKA (учебное):

| Домен CKA | Прогоны |
|-----------|---------|
| Cluster architecture, RBAC | 01, 03 |
| Workloads & scheduling | 01, 02 |
| Services & networking | 03 |
| Storage | 03 |
| Troubleshooting | 01–03 |

## Окружение

- Кластер: `mockctl up` (minikube `mock-exams`, metrics-server + ingress).
- Профиль: `MOCKCTL_PROFILE` (по умолчанию `mock-exams`).
- **etcd backup (прогон 03):** только через `minikube -p mock-exams ssh` — как в [kuber-advanced/03-lab-etcd](../kuber-advanced/03-lab-etcd.md). Полный restore на экзамене — на kubeadm; в mock-exams проверяем **snapshot**, не полный disaster recovery.
- **Cordon/drain (прогон 02):** на одной ноде drain ограничен; Q4–Q5 проверяют **cordon** и знание drain-команд (см. README прогона 02).

## Откат

```bash
kubectl delete ns cka-m1 cka-m1-vault cka-m2 cka-m3 cka-m3-mon cka-m3-locked --ignore-not-found
rm -f ~/cka-m1-q6.txt ~/cka-r2-q4.txt ~/cka-r3-etcd.db ~/cka-m3-q7.txt 2>/dev/null
```

Или: `mockctl clean && mockctl up`.

## Хоткеи (как на экзамене)

```bash
export do="--dry-run=client -o yaml"
export now="--grace-period=0 --force"
alias k=kubectl
```

Документация: <https://kubernetes.io/docs/> (на экзамене открыта одна вкладка K8s + CNCF).

## Связь с курсами

| Урок kuber-advanced | Прогон mock-cka |
|---------------------|-----------------|
| 01 control plane | 01 Q6, 03 Q6 |
| 02–03 etcd | 03 Q1 |
| 05–07 scheduling | 02 |
| 25–26 upgrade | теория (в mock не эмулируем kubeadm upgrade) |

После трёх прогонов ≥ 80% — хороший сигнал готовности к CKA. Дальше: реальный killer.sh / CKA simulator, фаза 2 advanced (CKS-lite).
