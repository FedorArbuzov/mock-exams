# 05. Job и CronJob

## Зачем

`Deployment` рассчитан на **долгоживущие** процессы: «всегда держи N подов». Иногда нужна противоположная задача — **сделай работу один раз и закончи**:

- миграция БД при релизе;
- бэкап ночью;
- обработка пачки файлов;
- генерация отчёта.

Для этого есть **Job** (одноразовая задача) и **CronJob** (Job по расписанию).

## Минимальный Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: hello
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: hi
          image: busybox
          command: ["sh", "-c", "echo hello && sleep 5 && echo done"]
  backoffLimit: 4
```

```bash
kubectl apply -f hello.yaml
kubectl get jobs
kubectl get pods -l job-name=hello
kubectl logs job/hello
```

После успеха Job переходит в `Completed`, под живёт в статусе `Completed`. Его не «убирают» — это намеренно, чтобы вы могли посмотреть логи.

Удалить:

```bash
kubectl delete job hello
```

## Поля, которые важно знать

```yaml
spec:
  completions: 5         # сколько подов должно успешно завершиться
  parallelism: 2         # сколько одновременно
  backoffLimit: 6        # сколько раз перепробовать упавший под перед FAIL
  activeDeadlineSeconds: 600   # общий таймаут на весь Job
  ttlSecondsAfterFinished: 300 # авто-удалить Job через N сек после завершения
```

- `completions: N` — задача считается выполненной после N успешных подов.
- `parallelism: M` — поднять не больше M одновременно.
- Сочетание: `completions=10, parallelism=3` — обработать 10 «единиц», по 3 параллельно.
- `backoffLimit` — сколько неуспешных попыток допускается. По умолчанию 6.
- `activeDeadlineSeconds` — глобальный таймер. Превысили — Job помечается `Failed`.
- `ttlSecondsAfterFinished` — авто-уборка. Без него Job-ы накапливаются.

## restartPolicy и поведение при падении

Внутри `template.spec` для Job допустимы только `Never` или `OnFailure`:

- `Never` — упавший под считается «провалом попытки», Job создаёт **новый** под (до `backoffLimit`).
- `OnFailure` — kubelet перезапускает контейнер **внутри того же пода**, не создавая новый.

`OnFailure` даёт чуть быстрее перезапуск (нет создания нового пода и pull-а), но логи восстановить сложнее. Обычно берут `Never`.

## CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "*/5 * * * *"           # каждые 5 минут
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 0
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: backup
              image: busybox
              command: ["sh", "-c", "echo backup at $(date)"]
```

Поля:

- `schedule` — стандартный cron-формат (5 полей: минута час день месяц день-недели). Можно использовать алиасы: `@hourly`, `@daily`, `@weekly`.
- `concurrencyPolicy`:
  - `Allow` (default) — можно запускать новый, даже если старый ещё работает.
  - `Forbid` — пропустить запуск, если старый ещё работает.
  - `Replace` — убить старый, запустить новый.
- `successfulJobsHistoryLimit`, `failedJobsHistoryLimit` — сколько последних Job-ов хранить. Без них старые Job-ы накапливаются.
- `startingDeadlineSeconds` — если k8s «проспал» окно запуска (например, был перегружен), вешать или нет.
- `suspend: true` — приостановить расписание, не удаляя CronJob.

## Часовой пояс

CronJob использует **UTC** по умолчанию. Если 02:00 нужно по местному времени — либо считайте смещение в `schedule`, либо начиная с k8s 1.27 указывайте:

```yaml
spec:
  timeZone: "Europe/Moscow"
```

## Полезные команды

```bash
kubectl get jobs
kubectl get cronjobs
kubectl get pods -l job-name=hello
kubectl logs job/hello
kubectl describe job hello

# Запустить CronJob прямо сейчас, не дожидаясь расписания:
kubectl create job manual --from=cronjob/backup
```

## Когда что использовать

- **Job** — миграция БД при деплое, разовая задача в init-контейнере не подходит (init контейнеры запускаются при каждом старте пода).
- **CronJob** — бэкапы, отчёты, очистка логов, ротация кэшей.
- **Deployment** — для «всегда работающих» сервисов.

## Чек-лист

- Что произойдёт, если контейнер падает в Job с `restartPolicy: Never` и `backoffLimit: 3`?
- Зачем нужен `ttlSecondsAfterFinished`?
- Как сделать «не запускать новый бэкап, если старый ещё крутится»?
- Зачем в CronJob `successfulJobsHistoryLimit`?
