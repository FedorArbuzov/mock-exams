# 26. Лаба: upgrade minikube между версиями k8s

## Задание 1. Зафиксировать текущую версию

```bash
kubectl version --short 2>/dev/null || kubectl version
kubectl get nodes -o wide
kubectl create ns upgrade-test
kubectl create deploy marker -n upgrade-test --image=nginx:1.27-alpine
```

Запишите `Server Version` (например `v1.28.3`).

## Задание 2. Backup etcd (на всякий случай)

```bash
minikube -p mock-exams ssh -- bash -c '
export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
sudo -E etcdctl snapshot save /tmp/pre-upgrade.db
'
```

## Задание 3. Upgrade

Узнайте доступные версии:

```bash
minikube kubectl -- version --short
# или
minikube start --help | grep kubernetes-version
```

Upgrade (пример — на одну minor вверх от текущей):

```bash
minikube stop -p mock-exams
minikube start -p mock-exams --kubernetes-version=v1.29.0
mockctl kubeconfig
```

> Подставьте версию, **доступную** в вашем minikube (`minikube start --kubernetes-version=stable`).

## Задание 4. Проверить

```bash
kubectl version
kubectl get nodes
kubectl get deploy -n upgrade-test
kubectl get pods -n upgrade-test
```

**Что увидите:** нода Ready, marker deployment на месте (если не делали delete).

## Задание 5. Проверить системные поды

```bash
kubectl get pods -n kube-system
kubectl get pods -A | grep -v Running | grep -v Completed
```

Все `kube-system` должны быть Running/Completed.

## Задание 6. Откат (опционально)

```bash
minikube stop -p mock-exams
minikube start -p mock-exams --kubernetes-version=<старая-версия>
```

## Уборка

```bash
kubectl delete namespace upgrade-test
```

## Вопросы для самопроверки

1. Чем `minikube stop` + `start --kubernetes-version` отличается от `minikube delete`?
2. Что проверить сразу после upgrade?
3. Зачем etcd snapshot перед upgrade?
