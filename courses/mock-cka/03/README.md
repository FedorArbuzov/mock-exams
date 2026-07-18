# Mock CKA — Прогон 03

**Уровень:** высокий. **Время:** 120 минут. **Домен CKA:** storage, networking, troubleshooting, etcd, RBAC.

Связь: [kuber-advanced/02–03 etcd](../kuber-advanced/02-etcd.md), [intermediate NetworkPolicy](../kuber-intermediate/README.md).

## Подготовка

```bash
mockctl up
bash courses/mock-cka/03/prepare.sh
```

## Задачи

### Q1. Snapshot etcd (minikube)

Снимите snapshot etcd и сохраните на **хосте** в файл `~/cka-r3-etcd.db`.

Подсказка (профиль `mock-exams`):

```bash
PROFILE="${MOCKCTL_PROFILE:-mock-exams}"
minikube -p "$PROFILE" ssh -- sudo ETCDCTL_API=3 etcdctl snapshot save /tmp/snap.db \
  --cacert=/var/lib/minikube/certs/etcd/ca.crt \
  --cert=/var/lib/minikube/certs/etcd/server.crt \
  --key=/var/lib/minikube/certs/etcd/server.key \
  --endpoints=https://127.0.0.1:2379
minikube -p "$PROFILE" cp "$PROFILE:/tmp/snap.db" ~/cka-r3-etcd.db
```

Полный restore — [kuber-advanced/03-lab-etcd](../kuber-advanced/03-lab-etcd.md); на mock-CKA проверяется только **наличие файла** snapshot.

### Q2. PVC и Pod

В namespace `cka-m3`:

- PVC `data-vol`: `1Gi`, `ReadWriteOnce`, default StorageClass;
- Pod `vol-writer`: `busybox:1.36`, команда `sh -c 'echo ok > /data/marker && sleep 3600'`, volume mount `/data` из PVC.

### Q3. NetworkPolicy

В `cka-m3-locked` создайте NetworkPolicy `deny-except-monitoring`:

- **Ingress:** разрешить только от pod с label `role=monitoring` (любой namespace);
- от pod в том же namespace `cka-m3-locked` — разрешить;
- остальной ingress — deny (через policyTypes Ingress + rules).

### Q4. Service без endpoints

В `cka-m3` Service `web-svc` не маршрутизирует трафик (неверный selector). Исправьте selector так, чтобы endpoints указывали на pods deployment `web` (`app=web`).

### Q5. ConfigMap в deployment

Deployment `cfg-app` в `cka-m3` должен:

- монтировать или использовать env из ConfigMap `app-cfg`;
- переменная окружения `MODE` = значение ключа `MODE` из ConfigMap;
- под в статусе **Running**.

### Q6. Control plane (теория на кластере)

В файл `~/cka-m3-q6.txt` запишите **одно слово** — имя компонента control plane, данные которого хранятся в **etcd** (ожидается: `etcd`).

### Q7. RBAC: только чтение

В `cka-m3` создайте:

- ServiceAccount `viewer`;
- Role `pod-reader`: `get`, `list`, `watch` на `pods`;
- RoleBinding `pod-viewer` → SA `viewer`.

**Не** давайте `create` на pods. Проверка: `kubectl auth can-i create pods --as=system:serviceaccount:cka-m3:viewer -n cka-m3` → `no`.

## Проверка

```bash
bash courses/mock-cka/03/verify.sh
```

## Откат

```bash
kubectl delete ns cka-m3 cka-m3-mon cka-m3-locked
rm -f ~/cka-r3-etcd.db ~/cka-m3-q6.txt
```

## После попытки

[`solution.md`](solution.md)
