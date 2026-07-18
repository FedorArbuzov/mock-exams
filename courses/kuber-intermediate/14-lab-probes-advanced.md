# 14. Лаба: довести «битое» приложение до Ready

Будем работать с приложением, которое **долго стартует** (20 секунд) и потом стабильно отвечает. Без правильных проб оно попадёт в `CrashLoopBackOff`.

## Подготовка

```bash
kubectl create namespace lab-probes
kubectl config set-context --current --namespace=lab-probes
```

## Задание 1. Развернуть «слепое» приложение

`flaky.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flaky
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flaky
  template:
    metadata:
      labels:
        app: flaky
    spec:
      containers:
        - name: app
          image: busybox
          ports:
            - containerPort: 8080
          command:
            - sh
            - -c
            - |
              echo "starting, will be ready in 20s..."
              sleep 20
              echo "ready"
              while true; do
                printf 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok' | nc -l -p 8080
              done
          livenessProbe:
            httpGet:
              path: /
              port: 8080
            periodSeconds: 5
            failureThreshold: 2
```

```bash
kubectl apply -f flaky.yaml
kubectl get pods -l app=flaky -w
```

**Что увидите:** под живёт ~10 секунд, переходит в `CrashLoopBackOff`. Liveness начинает дёргать сразу после старта, приложение ещё не слушает порт, две failure-ы — и kubelet перезапускает контейнер. Так бесконечно.

`kubectl describe pod -l app=flaky | tail -20` покажет:

```text
Liveness probe failed: dial tcp ...:8080: connect: connection refused
Container app failed liveness probe, will be restarted
```

## Задание 2. Добавить startupProbe

Это правильный фикс. Откройте deployment:

```bash
kubectl edit deploy flaky
```

И добавьте в `containers[0]` перед `livenessProbe`:

```yaml
startupProbe:
  tcpSocket:
    port: 8080
  failureThreshold: 30        # 30 попыток
  periodSeconds: 1            # = до 30 секунд
```

Сохраняем. Под пересоздаётся.

Альтернатива через `kubectl patch` (или просто пересоздать через `kubectl apply -f` с обновлённым YAML).

```bash
kubectl get pods -l app=flaky -w
```

**Что увидите:** под держится в `Running 0/1`, потом переходит в `Running 1/1` примерно через 20 секунд. CrashLoopBackOff больше не происходит.

```bash
kubectl describe pod -l app=flaky | grep -A2 "Probes\|Probe"
```

## Задание 3. Добавить readinessProbe

Сейчас приложение помечается `Ready`, как только startup прошёл. Добавим явный readiness, чтобы было видно разницу. В `kubectl edit`:

```yaml
readinessProbe:
  httpGet:
    path: /
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

Сохранить, дождаться. Затем посмотрите endpoints Service-а (если бы он был) — readiness не делает ничего видимого без Service. Создадим:

```bash
kubectl expose deploy flaky --port=8080
kubectl get endpoints flaky -w
```

В отдельном терминале «сломайте» приложение — удалите из контейнера nc-loop:

```bash
kubectl exec deploy/flaky -- sh -c 'pkill nc'
```

**Что увидите:** через 15 секунд (3 failed × 5 sec period) под пропадает из endpoints (статус readiness = false). Через ещё 10 секунд (2 failed × 5 = liveness) — kubelet перезапустит контейнер.

После рестарта startupProbe снова даст 30 секунд на разгон, потом всё вернётся в Ready.

## Задание 4. preStop hook

Сейчас при удалении пода трафик может «упасть» — endpoints обновляются асинхронно. Добавим `preStop`:

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 15"]
```

И дайте больше grace period:

```yaml
terminationGracePeriodSeconds: 30
```

Сделайте `kubectl rollout restart deploy/flaky` и посмотрите:

```bash
kubectl get pods -l app=flaky -w
```

**Что увидите:** старый под уходит в `Terminating` и **держится 15 секунд** перед реальным shutdown. Это окно kube-proxy использует, чтобы выкинуть его из endpoints до завершения процесса. В реальном приложении это спасает в-процессе-обрабатываемые запросы.

## Задание 5. Эксперимент с liveness, который ломает зависимость

Замените livenessProbe на «проверяет несуществующий внешний сервис»:

```yaml
livenessProbe:
  exec:
    command: ["sh", "-c", "wget -qO- --timeout=2 http://no-such-service && exit 0 || exit 1"]
  periodSeconds: 5
  failureThreshold: 2
```

Применить, подождать.

**Что увидите:** контейнер начнёт перезапускаться каждые ~10 секунд, хотя само приложение здорово. Это и есть антипаттерн «liveness знает про зависимости». Откатите.

## Уборка

```bash
kubectl delete namespace lab-probes
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Когда обязательно нужен startupProbe?
2. Что произойдёт, если убрать startup и оставить только liveness с `initialDelaySeconds: 30`?
3. В каком случае preStop hook реально что-то спасает?
4. Какой failure-threshold вы бы поставили на readiness в проде, если периодичность 10 секунд, и почему?
