# 15. Resources и QoS-классы

## requests vs limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
```

- **`requests`** — это «гарантия». Scheduler **резервирует** именно столько на ноде. Если на ноде не хватает свободных requests — под не запустится (статус `Pending`, причина `Unschedulable`).
- **`limits`** — это «потолок». Контейнер не получит больше указанного. На CPU превышение **тротлится**. На memory — `OOMKilled` (kernel убивает процесс, kubelet перезапускает контейнер).

`100m` (милли) = 0.1 CPU. `128Mi` = 128 мебибайт (≠ 128 МБ).

## QoS-классы

Kubernetes по `requests`/`limits` присваивает поду **QoS-класс**. Это влияет на eviction (кого убивать первым при дефиците памяти).

| Класс | Условие | Поведение при дефиците |
|---|---|---|
| `Guaranteed` | У всех контейнеров: `requests == limits` для CPU **и** memory. | Убивают **последними**. |
| `Burstable` | Хотя бы один контейнер: `requests` < `limits` (или указано только одно). | Убивают **во вторую очередь**. |
| `BestEffort` | Ни requests, ни limits **не указаны вообще**. | Убивают **первыми**. |

Посмотреть QoS:

```bash
kubectl get pod my-pod -o jsonpath='{.status.qosClass}'
```

## Eviction: что и почему

Когда нода под давлением (мало памяти, мало диска), kubelet **выселяет** поды. Порядок:

1. Best-effort идут первыми.
2. Среди Burstable — первым идёт тот, кто **превышает request**. Чем сильнее превышает — тем раньше.
3. Guaranteed — только если node-level eviction (диск кончается, например).

Эта логика основана на priorityClass и QoS, но в её основе — `requests`. Поэтому:

- BestEffort — годится только для несерьёзных задач.
- Burstable — стандарт для большинства сервисов.
- Guaranteed — для критически важных (БД, очереди), плюс предсказуемое поведение CPU и памяти.

## CPU: throttle, не kill

Если контейнер пытается съесть больше CPU, чем `limits.cpu`, ядро **тротлит** его — снижает квант. Контейнер не убивается, просто работает медленнее. На метриках это видно как «cpu_cfs_throttled_seconds».

## Memory: hard kill

Если контейнер пытается выйти за `limits.memory`, ядро посылает `SIGKILL` процессу с самой большой OOM-score. kubelet видит это как `OOMKilled`:

```bash
kubectl describe pod my-pod | grep -A2 State
# State: Terminated
# Reason: OOMKilled
```

В отличие от CPU, OOM **необратим**: процесс умирает, контейнер перезапускается (если restartPolicy позволяет).

## Как подбирать значения

Метрики реального процесса в покое и под нагрузкой:

```bash
kubectl top pods                      # текущее потребление
kubectl top pods --containers
kubectl describe pod ... | grep -A3 Allocated   # planned vs reality на ноде
```

Эмпирический рецепт:

- **CPU request** — медианное (или p50) реальное потребление под нагрузкой.
- **CPU limit** — высокий, чтобы переживать пики (или вообще без limit, если нагрузка чувствительна к latency).
- **Memory request** — RSS под обычной нагрузкой + 20%.
- **Memory limit** — request × 1.5–2 (или близко к нему для Guaranteed).

Если `memory request == limit`, и приложение запросит больше — гарантированно `OOMKilled`. Это «дисциплинированно», но требует точного знания, сколько памяти приложение может съесть.

## LimitRange и ResourceQuota

Эти объекты помогают **на уровне namespace**:

- **LimitRange** — задаёт default-ы и минимумы/максимумы для `requests`/`limits` в namespace. Если под не указал ресурсы, LimitRange проставит свои.
- **ResourceQuota** — лимит на сумму всех `requests`/`limits` в namespace. Защищает от «один сервис съел все ресурсы кластера».

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ns-quota
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    pods: "10"
```

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: ns-defaults
spec:
  limits:
    - type: Container
      default:
        cpu: 200m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
```

## Чек-лист

- В чём отличие requests от limits на CPU? На memory?
- Какой QoS у пода без указанных ресурсов?
- В каком случае `OOMKilled`, а в каком — throttling?
- Что произойдёт с подом, если scheduler не нашёл ноду с достаточными requests?
- Зачем LimitRange, если у пода и так есть resources?

В лабе [16-lab-resources-qos.md](16-lab-resources-qos.md) натурно вызовем OOMKilled, throttle и Pending по нехватке ресурсов.
