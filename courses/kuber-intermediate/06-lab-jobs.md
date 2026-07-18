# 06. Лаба: Job, CronJob, поведение при failure

## Подготовка

```bash
kubectl create namespace lab-jobs
kubectl config set-context --current --namespace=lab-jobs
```

## Задание 1. Простой Job

`hello-job.yaml`:

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
          command: ["sh", "-c", "echo hello && sleep 3 && echo done"]
  backoffLimit: 2
  ttlSecondsAfterFinished: 60
```

```bash
kubectl apply -f hello-job.yaml
kubectl get jobs -w        # дождаться completions=1/1
kubectl logs job/hello
```

**Что увидите:** Job в `Completed`, под со статусом `Completed`, в логах — `hello` и `done`. Через минуту Job сам исчезнет (благодаря TTL).

## Задание 2. Параллельный Job

`parallel-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: workers
spec:
  completions: 6
  parallelism: 3
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: worker
          image: busybox
          command: ["sh", "-c", "echo worker $(hostname) start; sleep 5; echo done"]
  backoffLimit: 0
```

```bash
kubectl apply -f parallel-job.yaml
kubectl get pods -l job-name=workers -w
```

**Что увидите:** одновременно бегут 3 пода, после их завершения стартуют ещё 3, всего 6 успешных запусков. `kubectl get jobs` покажет `6/6`.

## Задание 3. Падающий Job и backoffLimit

`flaky-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: flaky
spec:
  backoffLimit: 3
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: f
          image: busybox
          command: ["sh", "-c", "echo try; exit 1"]
```

```bash
kubectl apply -f flaky-job.yaml
kubectl get jobs flaky -w
kubectl get pods -l job-name=flaky
```

**Что увидите:** Job создаст 4 пода (1 первый + 3 ретрая), все упадут, Job перейдёт в `Failed`.

```bash
kubectl describe job flaky | tail -20
```

В events будет `BackoffLimitExceeded`.

## Задание 4. CronJob

`backup-cron.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "*/2 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 0
      ttlSecondsAfterFinished: 300
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: backup
              image: busybox
              command: ["sh", "-c", "echo backup at $(date)"]
```

```bash
kubectl apply -f backup-cron.yaml
kubectl get cronjob backup
```

Подождите ~2 минуты, потом:

```bash
kubectl get jobs
kubectl get pods -l job-name | head
```

**Что увидите:** появился Job вида `backup-<timestamp>`, под `Completed`, в логах `backup at ...`.

## Задание 5. Запуск CronJob вручную

Не хочется ждать следующее окно? Запустите Job прямо сейчас:

```bash
kubectl create job manual --from=cronjob/backup
kubectl logs job/manual
```

## Задание 6. concurrencyPolicy

Поменяйте в `backup-cron.yaml` команду на долгую:

```yaml
command: ["sh", "-c", "echo start at $(date); sleep 180; echo done"]
```

И расписание на каждую минуту:

```yaml
schedule: "* * * * *"
```

Применить, подождать 3 минуты, посмотреть `kubectl get jobs`.

**Что увидите при `concurrencyPolicy: Forbid`:** ровно один Job в `Running`, новый запуск каждые 60 секунд **пропускается**.

Поменяйте на `concurrencyPolicy: Replace`, повторите. Теперь старый Job убивается, на его место приходит новый. `Allow` — все Job-ы крутятся одновременно.

## Задание 7. Вопросы на эксперимент

Дополните `flaky-job.yaml` так, чтобы:

1. Job помечался `Failed` через 30 секунд независимо от количества попыток. (Подсказка: `activeDeadlineSeconds`.)
2. Под перезапускался **внутри того же пода**, без создания нового. (Подсказка: `restartPolicy: OnFailure`. Какие поля Job при этом ведут себя по-другому?)

Сравните поведение `Never` и `OnFailure` через `kubectl get pods -l job-name=flaky`.

## Уборка

```bash
kubectl delete namespace lab-jobs
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Что хранит `successfulJobsHistoryLimit`? Что произойдёт при превышении?
2. Чем `restartPolicy: OnFailure` отличается от `Never` для Job?
3. Какой timezone использует CronJob по умолчанию? Как это поменять?
4. Почему `kubectl get pods` после успешного Job всё равно показывает поды? Как от них автоматически избавляться?
