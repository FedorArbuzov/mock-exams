# 08. Лаба: упаковать demo-приложение в Helm-чарт

## Подготовка

```bash
helm version
kubectl create namespace lab-helm
kubectl config set-context --current --namespace=lab-helm
```

## Задание 1. Сгенерировать чарт

```bash
mkdir -p ~/mychart-work && cd ~/mychart-work
helm create demo
ls -R demo
```

**Что получили:** дефолтный nginx-чарт. В `values.yaml` уже есть `replicaCount`, `image`, `service`, `ingress`.

## Задание 2. Установить в namespace

```bash
helm install d1 ./demo
helm list
kubectl get pods,svc -l app.kubernetes.io/instance=d1
```

**Что увидите:** под и Service. Чарт «как есть» использует nginx.

## Задание 3. Свои values

Создайте `dev-values.yaml`:

```yaml
replicaCount: 3
image:
  repository: nginx
  tag: 1.27-alpine
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
```

```bash
helm upgrade d1 ./demo -f dev-values.yaml
kubectl get pods -l app.kubernetes.io/instance=d1
```

**Что увидите:** реплик стало 3, образ обновился.

## Задание 4. Установить второй раз с другим именем

```bash
helm install d2 ./demo --set replicaCount=1
helm list
```

**Что увидите:** два релиза одного чарта (`d1` и `d2`) живут параллельно, у каждого свои поды.

## Задание 5. Отрендерить шаблоны без установки

```bash
helm template d3 ./demo --set replicaCount=5 | head -50
```

**Что увидите:** готовый YAML в stdout. Никаких объектов в кластере не создаётся.

## Задание 6. История и откат

Поменяйте версию образа в `dev-values.yaml`:

```yaml
image:
  tag: 1.28-alpine
```

```bash
helm upgrade d1 ./demo -f dev-values.yaml
helm history d1
```

**Что увидите:** есть две ревизии (1 и 2).

Откат:

```bash
helm rollback d1 1
helm history d1
```

**Что должно произойти:** появится третья ревизия — это всегда «применённый rollback», а не «откат стирает историю».

## Задание 7. Готовый чарт из реестра — Postgres

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgresql --versions | head
```

Установить Postgres с минимальными параметрами:

```bash
helm install pg bitnami/postgresql \
  --set auth.postgresPassword='S3cretP@ss' \
  --set primary.persistence.size=200Mi
kubectl get all -l app.kubernetes.io/instance=pg
kubectl get pvc -l app.kubernetes.io/instance=pg
```

**Что увидите:** StatefulSet `pg-postgresql`, под `pg-postgresql-0`, Service, PVC. Helm задеплоил готовый production-grade стек одной командой.

Подключение:

```bash
kubectl run pgcli --rm -it --image=bitnami/postgresql:16 \
  --env=PGPASSWORD='S3cretP@ss' -- \
  psql -h pg-postgresql -U postgres -c "SELECT version();"
```

## Задание 8. helm template для аудита

Полный YAML, который Helm задеплоил для `pg`:

```bash
helm get manifest pg | head -100
helm get values pg
```

**Что покажут:** все объекты, как они выглядят сейчас в кластере, и какие values были применены.

## Уборка

```bash
helm uninstall d1 d2 pg
kubectl delete namespace lab-helm
kubectl config set-context --current --namespace=default
```

(`helm uninstall` сам удаляет все объекты релиза, но **не удаляет PVC** — это поведение по умолчанию для StatefulSet. PVC надо удалять вручную, если они больше не нужны.)

## Вопросы для самопроверки

1. Что произойдёт, если установить тот же чарт дважды с разными именами релиза?
2. Где Helm хранит историю релизов и как её посмотреть?
3. Чем `helm upgrade --install` удобнее, чем отдельно?
4. Как посмотреть, какой YAML Helm применит **до** реального apply?
5. Почему после `helm uninstall` PVC остаются, и что с ними делать?
