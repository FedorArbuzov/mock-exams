# 01. Архитектура control plane

## Путь запроса: от `kubectl apply` до `Pod Running`

```text
kubectl apply -f deploy.yaml
        │
        ▼
┌───────────────────┐
│   kube-apiserver  │  ← единственная точка входа в API
└─────────┬─────────┘
          │ authn (кто ты?) → authz (RBAC, что можно?)
          │ admission (mutating → validating webhooks)
          │ запись в etcd
          ▼
┌───────────────────┐
│       etcd        │  ← единственный source of truth состояния кластера
└─────────┬─────────┘
          │ watch-события
          ▼
┌───────────────────┐     ┌───────────────────┐
│ kube-scheduler    │     │ controller-manager│
│ (назначить ноду)  │     │ (поддерживать     │
└─────────┬─────────┘     │  желаемое сост.)  │
          │               └─────────┬─────────┘
          │                         │
          └────────────┬────────────┘
                       ▼
              ┌───────────────────┐
              │     kubelet       │  на каждой ноде
              │  + container      │
              │    runtime (CRI)  │
              └─────────┬─────────┘
                        ▼
                   Pod Running
```

## Компоненты control plane

### kube-apiserver

- REST API для всего (`/api/v1`, `/apis/apps/v1`, …).
- Единственный компонент, который **пишет в etcd** (остальные читают через apiserver).
- Horizontal scaling: несколько реплик apiserver за load balancer (в production).

```bash
kubectl get --raw /healthz          # жив ли API
kubectl get --raw /readyz           # готов принимать трафик
kubectl get --raw /livez
```

### etcd

- Распределённое key-value хранилище (Raft consensus).
- Хранит **все** объекты Kubernetes в JSON.
- Потеря кворума etcd = кластер «заморожен» (только read, без write).

Backup etcd — обязательный навык CKA (см. [02-etcd.md](02-etcd.md), [03-lab-etcd.md](03-lab-etcd.md)).

### kube-scheduler

- Смотрит поды в статусе `Pending` (без `spec.nodeName`).
- Фильтрует ноды (достаточно ресурсов? taints? affinity?).
- Скорит оставшиеся и выбирает лучшую.
- Прописывает `spec.nodeName` в поде.

Не запускает контейнеры — только **назначает** ноду.

### kube-controller-manager

Набор контроллеров в одном процессе. Каждый — бесконечный цикл «сравнить желаемое с фактическим → действие»:

| Контроллер | Что делает |
|---|---|
| Deployment | Создаёт/обновляет ReplicaSet |
| ReplicaSet | Поддерживает число подов |
| Node | Мониторит ноды, taints при недоступности |
| Service / EndpointSlice | Обновляет endpoints для Service |
| Job | Завершает Job по completions |
| Namespace | Удаляет объекты при удалении namespace |

### cloud-controller-manager (опционально)

В облаке (AWS/GCP/Azure): LoadBalancer Service, маршруты, привязка дисков к нодам. В minikube **нет**.

## Компоненты на ноде (worker)

### kubelet

- Агент на каждой ноде.
- Получает список подов, назначенных на эту ноду.
- Через CRI (containerd) создаёт/убивает контейнеры.
- Отчитывается о статусе (Ready/NotReady), запускает probes.
- Монтирует volumes.

### kube-proxy

- Следит за Service и EndpointSlice.
- Настраивает правила маршрутизации (iptables / ipvs / eBPF) на ноде.
- Реализует `ClusterIP` — виртуальный IP, балансирующий на backend-поды.

Подробнее — [08-network-internals.md](08-network-internals.md).

## Static Pods

Некоторые компоненты control plane на «настоящих» кластерах — **static pods**: kubelet читает манифесты из `/etc/kubernetes/manifests/` и запускает их напрямую, без apiserver.

В minikube control plane живёт **внутри** docker-контейнера ноды:

```bash
minikube -p mock-exams ssh
ls /etc/kubernetes/manifests/
# kube-apiserver.yaml, etcd.yaml, ...
```

## Полезные команды CKA

```bash
# Компоненты control plane как поды (если static → в kube-system):
kubectl get pods -n kube-system

# Логи apiserver:
kubectl logs -n kube-system -l component=kube-apiserver

# События scheduling:
kubectl get events --field-selector reason=Scheduled

# Почему под Pending:
kubectl describe pod <name> | grep -A10 Events
```

## Чек-лист

- Кто единственный пишет в etcd?
- Чем scheduler отличается от kubelet?
- Что делает Deployment controller?
- Где в minikube посмотреть манифесты static pods?
- Назовите порядок: authn → authz → admission → etcd при `kubectl apply`.

Следующий урок: [02-etcd.md](02-etcd.md) — backup и restore.
