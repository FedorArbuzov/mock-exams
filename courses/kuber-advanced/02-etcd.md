# 02. etcd: snapshot, backup, restore

## Зачем backup etcd

В etcd лежит **всё состояние** кластера: все Deployment, Secret, ConfigMap, RBAC. Потеря данных etcd без backup = потеря кластера.

Backup etcd нужен:

- перед upgrade кластера;
- перед рискованными изменениями;
- по расписанию (как у managed Kubernetes в облаке).

## Где etcd в minikube

```bash
minikube -p mock-exams ssh
sudo ls /var/lib/minikube/etcd/
```

В production etcd — отдельные ноды (3 или 5 для кворума). В minikube — один экземпляр внутри ноды.

## Snapshot через `etcdctl`

`etcdctl` — CLI для etcd. На minikube он уже есть внутри ноды.

### Переменные окружения

```bash
minikube -p mock-exams ssh

export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
```

### Создать snapshot

```bash
sudo etcdctl snapshot save /tmp/etcd-backup.db
sudo etcdctl snapshot status /tmp/etcd-backup.db -w table
```

Вывод `status`:

```text
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| 1a2b3c4d |    12345 |        512 |     2.1 MB |
+----------+----------+------------+------------+
```

### Проверить здоровье etcd

```bash
sudo etcdctl endpoint health
sudo etcdctl member list
```

## Restore (концепция)

Restore **не** «накатывается поверх» живого etcd. Алгоритм CKA:

1. Остановить apiserver и etcd (static pods).
2. Очистить data-dir etcd.
3. `etcdctl snapshot restore` в новый data-dir.
4. Обновить конфиг etcd (если изменились пути/порты).
5. Запустить etcd и apiserver.

На minikube проще: `minikube stop` → restore → `minikube start`. В лабе [03-lab-etcd.md](03-lab-etcd.md) — пошагово.

## Backup через cron на control plane ноде

В production часто:

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d-%H%M).db
```

+ копирование на S3/NFS. Retention: хранить N последних.

## Что **не** входит в etcd snapshot

- Содержимое **PersistentVolumes** (данные приложений на дисках).
- Логи подов.
- Образы в container registry.

Snapshot etcd = только **метаданные** Kubernetes. Для данных приложений — Velero ([23-velero.md](23-velero.md)).

## Полезные команды

```bash
# С хоста — скопировать snapshot наружу:
minikube -p mock-exams cp minikube:/tmp/etcd-backup.db ./etcd-backup.db

# Список ключей (осторожно, много вывода):
sudo etcdctl get / --prefix --keys-only | head
```

## Чек-лист CKA

- Какая команда создаёт snapshot?
- Можно ли restore «поверх» работающего etcd?
- Что хранится в snapshot, а что нет?
- Зачем `ETCDCTL_API=3`?
- Где лежат TLS-сертификаты etcd в minikube?

Лаба: [03-lab-etcd.md](03-lab-etcd.md).
