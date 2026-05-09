# 14. Probes и Resources: «настоящее» приложение

Минимальный Pod без проверок и лимитов работает, но в проде он **плохой сосед**:

- Может «зависнуть», но Kubernetes этого не заметит.
- Может съесть всю память ноды и положить соседей.
- Может попасть под трафик до того, как готов отвечать.

Эти три проблемы решают **probes** и **resources**.

## Probes: проверки здоровья

Kubernetes даёт три типа проверок:

| Probe | Что проверяет | Что делает при неудаче |
|--------|---------------|--------------------------|
| **livenessProbe** | «Живой ли контейнер сейчас» | Перезапускает контейнер. |
| **readinessProbe** | «Готов ли принимать трафик» | Исключает Pod из endpoints Service. Контейнер **не** перезапускается. |
| **startupProbe** | «Закончил ли стартовать» (для медленных приложений). Пока идёт — liveness/readiness заморожены. | По неудаче — рестарт. |

Способы проверки:

- **httpGet** — HTTP-запрос на путь/порт.
- **tcpSocket** — просто открыть TCP-порт.
- **exec** — запустить команду, проверить exit code 0.

Пример:

```yaml
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports:
        - containerPort: 80
      livenessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 2
        periodSeconds: 5
      startupProbe:
        httpGet:
          path: /
          port: 80
        failureThreshold: 30
        periodSeconds: 2
```

Параметры:

- **`initialDelaySeconds`** — пауза перед первой проверкой.
- **`periodSeconds`** — как часто проверять.
- **`failureThreshold`** — сколько подряд неудач до решения.
- **`successThreshold`** — для readiness: сколько успехов до «готов».
- **`timeoutSeconds`** — таймаут одной проверки.

### Как **не** надо

- Поставить **liveness** на «тяжёлый» эндпоинт типа `/healthz` который ходит в БД — если БД лежит, контейнер начнёт крутиться в перезапусках.
- Сделать `livenessProbe` и `readinessProbe` **одинаковыми** — теряется смысл; readiness должен быть мягче.
- Слишком короткий `initialDelaySeconds` для приложения, которое стартует 30+ секунд — отсюда и нужен `startupProbe`.

## Resources: requests и limits

В каждом контейнере можно указать:

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "256Mi"
```

### requests

«Сколько ресурсов **точно зарезервировать**» — по этому числу **scheduler** выбирает ноду. Если на ноде нет столько свободных ресурсов, Pod останется в `Pending`.

Если `requests` не указан, scheduler фактически считает запрос «нулевым» — Pod может попасть на любую ноду и потом голодать.

### limits

«Сверху не дать брать больше».

- **CPU над лимитом** → троттлится (контейнер замедляется, не убивается).
- **Memory над лимитом** → **OOMKilled**, контейнер перезапускается.

### Единицы

- CPU: `1` = 1 ядро, `500m` = 0.5 ядра, `100m` = 0.1 ядра.
- Memory: `Mi` (mebibyte = 1024×1024), `Gi`, `M`, `G`. На практике используют `Mi`/`Gi`.

### Quality of Service (QoS)

Kubernetes сам присваивает Pod QoS-класс по тому, как заданы requests/limits:

| Класс | Условие | Что значит |
|-------|---------|-------------|
| **Guaranteed** | requests == limits для CPU и memory у всех контейнеров | Меньше всего шансов быть «убитым» при нехватке памяти. |
| **Burstable** | requests заданы, но `<` limits | Среднее. |
| **BestEffort** | вообще нет requests/limits | Первым попадает «под нож» при нехватке ресурсов. |

```bash
kubectl get pod <name> -o jsonpath='{.status.qosClass}'
```

## Полный «нормальный» контейнер

```yaml
spec:
  containers:
    - name: web
      image: my-app:1.0
      ports:
        - containerPort: 8080
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
      readinessProbe:
        httpGet: { path: /healthz, port: 8080 }
        periodSeconds: 5
      livenessProbe:
        httpGet: { path: /livez, port: 8080 }
        periodSeconds: 15
```

## Команды

```bash
kubectl describe pod <name>            # увидите Events / Liveness/Readiness
kubectl get pod <name> -o jsonpath='{.status.qosClass}{"\n"}'
kubectl top pod                        # фактическое потребление (нужен metrics-server)
kubectl top node
```

В minikube включить `metrics-server`:

```bash
minikube -p mock-exams addons enable metrics-server
```
