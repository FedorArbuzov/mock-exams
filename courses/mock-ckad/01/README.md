# Mock CKAD — Прогон 01

**Уровень:** низкий. **Время:** 90 минут. **Темы:** Pod, Deployment, Service, ConfigMap, Secret, Namespace.

Подразумевается работа в текущем kube-context. Все команды — относительно репозитория.

## Подготовка

```bash
mockctl up
bash courses/mock-ckad/01/prepare.sh
```

`prepare.sh` создаст namespace `dev` и `qa`, deployment `legacy` в `qa`, и установит current namespace в `dev`.

## Задачи

### Q1. Namespace и контекст

В namespace `dev` создайте под `q1` с образом `nginx:1.27-alpine`. Под должен иметь label `tier=frontend`.

### Q2. Deployment с репликами

В namespace `dev` создайте deployment `web`:

- образ `nginx:1.27-alpine`;
- 4 реплики;
- label на подах `app=web`;
- контейнер слушает порт `80`.

### Q3. ConfigMap и переменные окружения

В namespace `dev` создайте ConfigMap `app-config` с парами:

- `LOG_LEVEL=debug`
- `APP_MODE=test`

В деплое `web` (Q2) сделайте так, чтобы все ключи `app-config` были доступны как **environment variables** в контейнере.

### Q4. Secret и монтирование как файл

В namespace `dev` создайте Secret `db-secret` с полем `password=p@ssw0rd`.

В деплое `web` смонтируйте этот Secret в каталог `/etc/db-secret/` (то есть `/etc/db-secret/password` — это файл с содержимым пароля).

### Q5. Service

Создайте Service `web-svc` в namespace `dev` для деплоя `web` типа `ClusterIP` на порт `80`. Selector — `app=web`.

Проверка: из временного пода `kubectl run tmp --image=busybox -it --rm -- wget -qO- web-svc` должна возвращать страницу nginx.

### Q6. NodePort к существующему деплойменту

В namespace `qa` уже есть deployment `legacy` (создан `prepare.sh`). Сделайте его доступным извне через Service `legacy-svc` типа `NodePort` на порт `30080`.

### Q7. Подсчёт ресурсов

В файл `~/q7-answer.txt` запишите **только число** — сколько подов сейчас работает в namespace `dev` и `qa` суммарно (статус `Running`).

Подсказка: `kubectl get pods -A --field-selector=status.phase=Running -o name | wc -l`, но фильтр по namespace.

## Проверка

```bash
bash courses/mock-ckad/01/verify.sh
```

Вывод вида:

```text
[OK]   Q1: pod q1 in dev with image nginx:1.27-alpine and label tier=frontend
[OK]   Q2: deployment web with 4 replicas
[FAIL] Q3: env LOG_LEVEL not found in web container
[OK]   Q4: secret db-secret mounted at /etc/db-secret
[OK]   Q5: service web-svc reachable on port 80
[OK]   Q6: legacy-svc is NodePort on 30080
[FAIL] Q7: ~/q7-answer.txt missing or wrong

Score: 5 / 7  (sdano: net, need >=5)
```

(70% от 7 ≈ 5 — нужно минимум 5 для «сдано»).

## Откат

```bash
kubectl delete ns dev qa
```

Или на полностью чистый кластер: `mockctl clean && mockctl up`.

## После попытки

Откройте [`solution.md`](solution.md) — там разбор каждого вопроса с командами и YAML.
