# 03. Лаба: backup и restore etcd на minikube

Цель — снять snapshot etcd, «сломать» кластер, восстановить из backup.

## Задание 1. Создать тестовый объект

```bash
kubectl create namespace lab-etcd
kubectl create configmap etcd-test -n lab-etcd --from-literal=marker=before-backup
kubectl get configmap etcd-test -n lab-etcd
```

## Задание 2. Snapshot

```bash
minikube -p mock-exams ssh -- bash -c '
export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
sudo -E etcdctl snapshot save /tmp/etcd-backup.db
sudo -E etcdctl snapshot status /tmp/etcd-backup.db -w table
'
```

Скопировать snapshot на хост:

```bash
minikube -p mock-exams cp minikube:/tmp/etcd-backup.db ./etcd-backup.db
ls -la etcd-backup.db
```

## Задание 3. «Сломать» — удалить namespace

```bash
kubectl delete namespace lab-etcd
kubectl get configmap etcd-test -n lab-etcd 2>&1
# NotFound — объект исчез из etcd
```

## Задание 4. Restore (упрощённый путь для minikube)

Полный CKA-restore на bare metal сложнее. На minikube:

```bash
minikube -p mock-exams stop

minikube -p mock-exams ssh -- bash -c '
export ETCDCTL_API=3
sudo rm -rf /var/lib/minikube/etcd/member
sudo mkdir -p /var/lib/minikube/etcd/member/snap/db
sudo etcdctl snapshot restore /tmp/etcd-backup.db \
  --data-dir=/var/lib/minikube/etcd/member/snap/db \
  --initial-cluster=etcd=minikube:2380 \
  --initial-advertise-peer-urls=http://127.0.0.1:2380 \
  --name=etcd
'

minikube -p mock-exams start
mockctl kubeconfig
```

> Если restore на вашей версии minikube ведёт себя иначе — альтернатива для учебной цели: пересоздать ConfigMap вручную и считать, что вы **отработали** команды snapshot/restore. На реальном CKA экзамене дадут рабочий control plane node.

## Задание 5. Проверить восстановление

```bash
kubectl get configmap etcd-test -n lab-etcd
# ожидаем: marker=before-backup, если restore прошёл
```

Если namespace не вернулся — snapshot всё равно **валиден**; проверьте `etcdctl snapshot status` на хосте.

## Задание 6. Практика CKA-команд

На SSH в minikube выполните и сохраните вывод:

```bash
sudo etcdctl endpoint health
sudo etcdctl member list
sudo etcdctl snapshot status /tmp/etcd-backup.db -w table
```

## Уборка

```bash
kubectl delete namespace lab-etcd --ignore-not-found
rm -f etcd-backup.db
```

## Вопросы для самопроверки

1. Какая команда создаёт snapshot?
2. Почему удаление namespace — это изменение в etcd?
3. Восстанавливает ли etcd snapshot данные на PV?
4. Какие 4 переменные `ETCDCTL_*` нужны для TLS?
