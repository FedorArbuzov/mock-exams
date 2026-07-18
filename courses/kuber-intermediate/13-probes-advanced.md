# 13. Probes продвинуто

В `kuber-basic` мы видели, что есть `livenessProbe` и `readinessProbe`. Здесь разберём третий вид — `startupProbe`, тонкие настройки таймингов и типичные ошибки.

## Зачем три пробы

| Проба | Что отвечает | Что происходит при failure |
|---|---|---|
| `startupProbe` | «Контейнер ещё инициализируется?» | Перезапустить, **не запускать другие пробы**, пока эта не успешна |
| `readinessProbe` | «Готов принимать трафик?» | Убрать под из endpoints Service-а |
| `livenessProbe` | «Жив, или зациклился/повис?» | Перезапустить контейнер |

Главная мысль: **liveness ≠ readiness**. liveness — «нужно ли мне его убить и пересоздать», readiness — «можно ли направлять на него запросы».

## Типы проб

В YAML каждая проба — это один из:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
    httpHeaders:
      - name: X-Probe
        value: liveness

# или
readinessProbe:
  tcpSocket:
    port: 5432

# или
startupProbe:
  exec:
    command: ["sh", "-c", "test -f /var/run/ready"]

# или (1.24+)
livenessProbe:
  grpc:
    port: 9000
    service: liveness   # имя сервиса в gRPC health check
```

`httpGet` — самый частый. Любой 2xx/3xx считается success, 4xx/5xx — fail.

## Тайминги (одинаковые для всех проб)

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 0     # сколько ждать после старта контейнера
  periodSeconds: 10          # как часто опрашивать
  timeoutSeconds: 1          # сколько ждать ответа
  successThreshold: 1        # сколько успехов подряд = success
  failureThreshold: 3        # сколько провалов подряд = failure
  terminationGracePeriodSeconds: 30   # для liveness — таймаут SIGTERM перед SIGKILL
```

Что важно понимать:

- **`failureThreshold`** для **liveness** — сколько проб подряд должны провалиться, чтобы k8s решил перезапустить контейнер. Защищает от ложных срабатываний (один пакет потерялся).
- **`successThreshold`** для **readiness** — сколько успешных проб нужно после факта `NotReady`, чтобы вернуть в endpoints. Полезно для приложений, которые «дрожат» — их не дёргает в endpoints от каждого «ой, успешный пинг».
- Для **liveness** `successThreshold` всегда 1.

## startupProbe — обязателен для медленных приложений

Есть приложения, которые загружаются дольше, чем хочется ждать readiness/liveness. Например, Java-сервис стартует 60 секунд.

Если поставить `livenessProbe` без startup-а:

```yaml
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 3
  periodSeconds: 10
```

то через 30 секунд (3 × 10) под убьют, потому что приложение ещё не отвечает. Опасный фикс — поставить `initialDelaySeconds: 90`. Но тогда **всё время жизни** пода k8s ждёт по 90 секунд, прежде чем заметить зависание.

Правильный фикс — `startupProbe`:

```yaml
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30          # 30 попыток
  periodSeconds: 5              # каждые 5 сек = до 150 сек
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 3
  periodSeconds: 10
```

Поведение:

1. Стартует контейнер.
2. Идёт **только** startupProbe. Каждые 5 секунд, до 150 секунд суммарно.
3. Как только startupProbe вернула success один раз — она **больше не запускается**, и активируются readiness/liveness.

Так вы получаете «приложение может стартовать долго», но как только оно стартануло — реагируете быстро.

## Частые ошибки

### 1. liveness проверяет «есть зависимость, доступна ли БД»

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
```

Если в `/healthz` приложение ходит в БД и возвращает 500 при недоступной БД — k8s **перезапустит** все ваши поды, когда БД упадёт. Каскад нарастает: проба провалена → перезапуск → проба провалена → бесконечно.

**Правило:** liveness проверяет «жив ли мой процесс», не «доступны ли мои зависимости». Зависимости — это readiness.

### 2. readiness не сделана вовсе

Если у пода только liveness, k8s сразу после старта добавит его в endpoints, и трафик пойдёт на ещё не-готовое приложение.

### 3. timeout слишком маленький

`timeoutSeconds: 1` хорошо, пока кластер быстрый. Под нагрузкой 1 сек становится мало → ложные failure.

### 4. preStop hook без graceful

Когда под удаляется:

1. K8s удаляет под из endpoints (но не сразу — это асинхронно через kube-proxy).
2. Параллельно отправляет SIGTERM в контейнер.
3. Через `terminationGracePeriodSeconds` (default 30) — SIGKILL.

Пока endpoints не обновились, на под продолжают приходить запросы. **preStop hook** даёт «спать N секунд перед SIGTERM», чтобы это окно пережили:

```yaml
spec:
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 15"]
```

Это правильный паттерн для production.

## Что показывает `kubectl describe`

В Events секции `describe pod` видно решения проб:

```text
Liveness probe failed: HTTP probe failed with statuscode: 500
Readiness probe failed: dial tcp ...: connect: connection refused
Startup probe failed: HTTP probe failed with statuscode: 503
```

И `Container restartCount` показывает, сколько раз k8s перезапускал контейнер.

## Чек-лист

- В чём разница между liveness и readiness?
- Когда вообще нужен startupProbe?
- Что произойдёт, если liveness опирается на доступность БД?
- Что такое preStop и зачем `sleep N` перед graceful shutdown?
- Сколько секунд k8s даёт на shutdown по умолчанию?

В лабе [14-lab-probes-advanced.md](14-lab-probes-advanced.md) исправим «битое» приложение, которое перезапускается из-за неверных проб.
