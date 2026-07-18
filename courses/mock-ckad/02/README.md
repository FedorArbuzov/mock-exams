# Mock CKAD — Прогон 02

**Уровень:** средний. **Время:** 120 минут. **Темы:** Probes, Resources, Init / Sidecar, Job, CronJob, Volumes (PVC, emptyDir).

## Подготовка

```bash
mockctl up
bash courses/mock-ckad/02/prepare.sh
```

`prepare.sh` создаст namespace `dev`, `batch` и подготовит «сломанное» приложение `flaky` в `dev` (для Q1).

## Задачи

### Q1. Probes у «битого» приложения

В namespace `dev` уже есть deployment `flaky` (контейнер становится готов через 20 секунд после старта, после чего стабильно отвечает на `/healthz`).

Сейчас под перезапускается каждые 10 секунд, потому что нет правильных проб. Исправьте deployment, чтобы под стал `Ready` без перезапусков:

- добавьте `startupProbe`, который успевает дождаться готовности;
- добавьте `readinessProbe` и `livenessProbe`, которые **не убивают** уже готовый под.

Все пробы — HTTP `/healthz` на порт 8080.

### Q2. Resources и QoS

Создайте в namespace `dev` deployment `cpu-hog`:

- образ `polinux/stress`;
- запускает `stress --cpu 1`;
- requests: `cpu=100m`, `memory=64Mi`;
- limits: `cpu=200m`, `memory=128Mi`.

QoS-класс этого пода должен получиться `Burstable` (проверка делается автоматически).

### Q3. Init container

В namespace `dev` создайте deployment `web-with-config`:

- основной контейнер: `nginx:1.27-alpine`, отдаёт `/usr/share/nginx/html/`;
- init-контейнер: `busybox`, выполняет `sh -c 'echo "<h1>hello $(date)</h1>" > /work/index.html'`;
- общий volume `emptyDir` смонтирован в init как `/work`, в основном контейнере — как `/usr/share/nginx/html`;
- 1 реплика.

### Q4. Sidecar-логгер

В тот же deployment `web-with-config` (Q3) добавьте sidecar-контейнер `log-tailer`:

- образ `busybox`;
- команда: `sh -c 'tail -F /var/log/nginx/access.log'`;
- общий emptyDir-volume `logs`, смонтированный в основной контейнер как `/var/log/nginx`, в sidecar — как `/var/log/nginx`.

### Q5. Job

В namespace `batch` создайте Job `migrate`:

- образ `busybox`;
- команда: `sh -c 'echo migrating && sleep 5 && echo done'`;
- restartPolicy: `Never`;
- backoffLimit: `2`;
- параллельность: `1`, completions: `1`.

После успешного завершения должен оставаться завершённым (status `Complete`).

### Q6. CronJob

В namespace `batch` создайте CronJob `cleanup`:

- расписание: каждые 2 минуты (`*/2 * * * *`);
- образ `busybox`;
- команда: `sh -c 'echo cleanup at $(date)'`;
- хранит максимум 3 успешных и 1 неуспешный history.

### Q7. PVC для постоянных данных

В namespace `dev` создайте:

- PVC `data` на `100Mi`, `ReadWriteOnce`, defaultStorageClass;
- pod `data-writer` на образе `busybox`, который запишет `hello` в `/data/file.txt` и держит контейнер живым: `sh -c 'echo hello > /data/file.txt && sleep 3600'`;
- volume PVC `data` смонтирован в `/data`.

Проверка: `kubectl exec data-writer -n dev -- cat /data/file.txt` возвращает `hello`.

### Q8. Lifecycle: graceful shutdown

В namespace `dev` создайте deployment `graceful`:

- образ `nginx:1.27-alpine`, 1 реплика;
- `terminationGracePeriodSeconds: 60`;
- preStop hook, выполняющий `sleep 15` (чтобы под успел дочитать запросы перед shutdown).

## Проверка

```bash
bash courses/mock-ckad/02/verify.sh
```

8 вопросов, для «сдано» нужно минимум 6.

## Откат

```bash
kubectl delete ns dev batch
```

## После попытки

Открыть [`solution.md`](solution.md).
