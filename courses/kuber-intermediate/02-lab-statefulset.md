# 02. Лаба: StatefulSet с Postgres

Цель — поднять Postgres в виде StatefulSet, увидеть стабильные имена и тома, проверить что данные **переживают** удаление пода.

Потребуется: запущенный кластер `mock-exams` (`mockctl up`), `kubectl` доступен.

## Подготовка

Создадим namespace и сделаем его текущим:

```bash
kubectl create namespace lab-sts
kubectl config set-context --current --namespace=lab-sts
```

## Задание 1. Headless Service

Создайте файл `db-svc.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None
  selector:
    app: db
  ports:
    - port: 5432
      targetPort: 5432
```

Применить:

```bash
kubectl apply -f db-svc.yaml
kubectl get svc db
```

**Что увидите:** `CLUSTER-IP = None`. Это и есть headless.

## Задание 2. Secret с паролем

Чтобы не зашивать пароль в YAML:

```bash
kubectl create secret generic db-credentials \
  --from-literal=POSTGRES_PASSWORD='S3cretP@ss'
```

Проверка:

```bash
kubectl get secret db-credentials -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

Должно вернуть `S3cretP@ss`.

## Задание 3. StatefulSet на 3 реплики

Файл `db-sts.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db
  replicas: 3
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      terminationGracePeriodSeconds: 10
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: pg
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: POSTGRES_PASSWORD
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "postgres"]
            initialDelaySeconds: 5
            periodSeconds: 5
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        resources:
          requests:
            storage: 500Mi
```

Применить и **наблюдать за порядком запуска**:

```bash
kubectl apply -f db-sts.yaml
kubectl get pods -l app=db -w
```

**Что должны увидеть:** `db-0` поднимается, переходит в `Ready`, и **только потом** появляется `db-1`, и т.д. Прервать наблюдение можно `Ctrl+C` после `db-2 1/1 Running`.

## Задание 4. Стабильные имена и DNS

Запустите временный под и из него зайдите по имени:

```bash
kubectl run dnstest --rm -it --image=busybox -- sh
```

Внутри:

```sh
nslookup db
nslookup db-0.db
nslookup db-1.db
nslookup db-2.db
exit
```

**Что увидите:**

- `nslookup db` → 3 IP в ответе (одна запись на под).
- `nslookup db-0.db` → ровно один IP (адрес db-0).
- IP-адреса можно сверить с `kubectl get pods -l app=db -o wide`.

## Задание 5. PVC и стабильное хранилище

Посмотрите на тома:

```bash
kubectl get pvc
```

Должны быть три PVC: `data-db-0`, `data-db-1`, `data-db-2`. Все в `Bound`.

Создайте таблицу и запись в `db-0`:

```bash
kubectl exec -it db-0 -- psql -U postgres -c "CREATE TABLE notes(id serial primary key, txt text);"
kubectl exec -it db-0 -- psql -U postgres -c "INSERT INTO notes(txt) VALUES ('hello from db-0');"
kubectl exec -it db-0 -- psql -U postgres -c "SELECT * FROM notes;"
```

**Что увидите:** строку `hello from db-0`.

Теперь грубо удалите под:

```bash
kubectl delete pod db-0
```

Проверьте, что k8s пересоздаёт его **с тем же именем** и **с тем же PVC**:

```bash
kubectl get pods -l app=db -w
# дождитесь db-0 1/1 Running
kubectl exec -it db-0 -- psql -U postgres -c "SELECT * FROM notes;"
```

**Что должно остаться:** строка `hello from db-0` — данные пережили рестарт. Это и есть «стабильное хранилище».

## Задание 6. Scale down не теряет тома

Уменьшите до 2 реплик:

```bash
kubectl scale sts db --replicas=2
kubectl get pods -l app=db
kubectl get pvc
```

**Что увидите:** под `db-2` исчез, но PVC `data-db-2` остался. Данные на нём сохранены, просто никто к ним сейчас не подключён.

Верните 3 реплики:

```bash
kubectl scale sts db --replicas=3
kubectl get pods -l app=db
```

Под `db-2` поднимется и **подцепит свой старый PVC**. Это поведение и важно для БД.

## Задание 7. Порядок остановки

Включим терминал-наблюдатель в одной вкладке:

```bash
kubectl get pods -l app=db -w
```

В другой вкладке удаляем StatefulSet, **сохранив** Service и PVC:

```bash
kubectl delete sts db
```

**Что увидите:** поды гасятся **в обратном порядке**: `db-2`, потом `db-1`, потом `db-0`.

Проверьте, что PVC всё ещё на месте:

```bash
kubectl get pvc
```

Снова применить StatefulSet:

```bash
kubectl apply -f db-sts.yaml
kubectl get pods -l app=db -w
```

Поды поднимутся обратно, подцепят свои PVC — и `kubectl exec db-0 -- psql -U postgres -c "SELECT * FROM notes;"` снова покажет `hello from db-0`. Состояние полностью восстановилось.

## Задание 8 (бонус). Подключиться по имени конкретного пода

Создайте временный под с psql и подключитесь явно к `db-1`:

```bash
kubectl run pgcli --rm -it --image=postgres:16-alpine --env=PGPASSWORD=S3cretP@ss -- \
  psql -h db-1.db -U postgres -c "SELECT inet_server_addr(), inet_server_port();"
```

**Что увидите:** строку с IP-адресом пода `db-1` и портом `5432`. Это работает только из-за headless-DNS.

## Уборка

```bash
kubectl delete sts db 2>/dev/null
kubectl delete svc db
kubectl delete secret db-credentials
kubectl delete pvc -l app=db        # явно сносим PVC
kubectl delete namespace lab-sts
kubectl config set-context --current --namespace=default
```

(`-l app=db` сработает только если шаблон проставил label на PVC — в большинстве случаев нет; тогда удаляйте по имени: `kubectl delete pvc data-db-0 data-db-1 data-db-2`.)

## Вопросы для самопроверки

1. Зачем StatefulSet нужен `serviceName` в spec, если service всё равно отдельный объект?
2. Почему `clusterIP: None`? Что произошло бы с DNS, если бы было `clusterIP: 10.0.0.42`?
3. Что будет с PVC `data-db-0`, если выполнить `kubectl delete sts db` без флагов?
4. В каком порядке остановятся поды при `kubectl scale sts db --replicas=0`?
5. Как сделать «канареечный» апгрейд только пода `db-2`, не трогая остальных?

Ответы — в [теории](01-statefulset.md), особенно в разделах про `volumeClaimTemplates`, `partition` и DNS.

## Что дальше

Следующая лаба — [03-persistent-volumes.md](03-persistent-volumes.md): углубимся в PV/PVC/StorageClass и поэкспериментируем с retention-политикой.
