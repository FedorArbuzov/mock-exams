# 18. Namespace

## Что это

**Namespace** — это «папка» внутри кластера для группировки объектов. С его помощью один кластер делят между:

- разными командами / приложениями;
- средами (`dev`, `staging`, `prod`) — хотя для прод-окружений чаще делают отдельные кластеры;
- временными площадками для экспериментов.

В одном namespace **имена объектов уникальны**, между разными namespaces могут совпадать (`web` в `team-a` и `web` в `team-b` — это **разные** объекты).

## Что NS даёт

- **Изоляцию имён** для большинства объектов (Pod, Deployment, Service, ConfigMap, Secret и т.д.).
- Точку приложения **RBAC** (можно дать права только в этом NS).
- Точку приложения **ResourceQuota** (лимиты CPU/памяти/числа объектов) и **LimitRange** (значения по умолчанию).
- **NetworkPolicy** — правила сетевого доступа между подами/NS.

## Что **не** скоупится по NS

Глобальные (cluster-scoped) ресурсы: `Node`, `PersistentVolume`, `ClusterRole`, `Namespace` сам и т.д.

```bash
kubectl api-resources --namespaced=true
kubectl api-resources --namespaced=false
```

## Системные namespaces

- **`default`** — куда попадают объекты, если NS не указан.
- **`kube-system`** — системные компоненты Kubernetes (api-server, coredns и т.д.).
- **`kube-public`** — публично читаемая информация о кластере.
- **`kube-node-lease`** — heartbeats нод.

## Команды

Создать NS:

```bash
kubectl create namespace dev
# или
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: dev
EOF
```

Посмотреть:

```bash
kubectl get ns
kubectl get pods -n dev
kubectl get all -n dev
```

Применить YAML в конкретный NS:

```bash
kubectl apply -f deploy.yaml -n dev
```

или прописать `metadata.namespace: dev` прямо в манифесте (тогда и без `-n` уйдёт туда).

Сменить «текущий» NS в контексте, чтобы не писать `-n` каждый раз:

```bash
kubectl config set-context --current --namespace=dev
kubectl config view --minify | grep namespace
```

Удалить NS (вместе со всеми объектами в нём):

```bash
kubectl delete ns dev
```

## DNS и Service между namespace

- В одном NS — `web`.
- Из другого NS — `web.dev`, или полная форма `web.dev.svc.cluster.local`.

## Когда **не** нужен новый NS

- Когда в кластере по факту одно приложение и одна команда — хватит `default`.
- Когда вам нужна **полная изоляция** (квоты сетки, нагрузки, безопасность) — лучше отдельный кластер.
