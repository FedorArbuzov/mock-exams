# 25. Cluster upgrade

## Порядок upgrade (production)

```text
1. Backup etcd
2. Upgrade control plane (apiserver, scheduler, controller-manager, etcd)
3. Upgrade kubelet на каждой ноде (по одной: drain → upgrade → uncordon)
4. Upgrade kube-proxy (если отдельно)
5. Проверить workloads
```

**Никогда** не перескакивайте больше чем на **две минорные** версии (1.27 → 1.29 OK, 1.27 → 1.30 — сначала 1.29).

## kubeadm upgrade (типичный CKA)

На control plane node:

```bash
# 1. План
sudo kubeadm upgrade plan

# 2. Apply (например до 1.29.4):
sudo kubeadm upgrade apply v1.29.4

# 3. Drain + upgrade kubelet на каждой worker:
kubectl drain <node> --ignore-daemonsets
sudo apt install kubelet=1.29.4-00 kubeadm=1.29.4-00
sudo kubeadm upgrade node
sudo systemctl restart kubelet
kubectl uncordon <node>
```

## minikube upgrade

Проще всего — сменить версию Kubernetes при старте:

```bash
minikube stop -p mock-exams
minikube start -p mock-exams --kubernetes-version=v1.29.0
```

Или:

```bash
minikube update-check
minikube start -p mock-exams --kubernetes-version=latest
```

**Важно:** `minikube delete` + `minikube start` с новой версией = **новый** кластер (данные etcd теряются, если не backup). Для upgrade **с сохранением** — `minikube stop` + `start --kubernetes-version=...` без delete.

## Проверка версий после upgrade

```bash
kubectl version
kubectl get nodes -o wide
minikube -p mock-exams ssh -- kubelet --version
minikube -p mock-exams ssh -- kubectl version --client
```

## Совместимость API

- `apiVersion` в манифестах: старые версии (например `extensions/v1beta1` Ingress) могут быть **удалены**. Проверка:

```bash
kubectl api-resources
pluto detect-api-versions-in-use  # если установлен pluto
```

## Что может сломаться

| Проблема | Решение |
|---|---|
| Admission API version changed | Обновить webhook configs |
| Deprecated API removed | `kubectl convert` / pluto |
| CNI несовместим | Обновить CNI до версии под новый k8s |
| containerd version | Обновить вместе с kubelet |

## Чек-лист CKA

- В каком порядке upgrade control plane и workers?
- Сколько minor-версий можно перепрыгнуть?
- Что сделать перед upgrade?
- Как upgrade minikube без потери данных?
- Команда проверки плана upgrade в kubeadm?

Лаба: [26-lab-cluster-upgrade.md](26-lab-cluster-upgrade.md).
