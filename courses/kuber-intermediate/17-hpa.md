# 17. HorizontalPodAutoscaler (HPA)

## Что и зачем

`HorizontalPodAutoscaler` — контроллер, который **меняет количество реплик** Deployment / StatefulSet / ReplicaSet в зависимости от метрик. «Под нагрузкой больше — поднял ещё подов, нагрузка спала — убрал лишние».

В отличие от `VerticalPodAutoscaler` (VPA), который меняет `requests`/`limits` **внутри** пода, HPA меняет **число подов**. Это то, что обычно подразумевают под «автоскейлингом».

## Как работает

Каждые 15 секунд (по умолчанию) HPA:

1. Получает текущую метрику (например, среднее CPU использование подов).
2. Считает: `desiredReplicas = ceil(currentReplicas × currentValue / targetValue)`.
3. Сравнивает с `min`/`max` границами.
4. Если поменялось — меняет `replicas` в Deployment.

Пример: 4 пода, средний CPU = 80%, target = 50%. `desired = ceil(4 × 80 / 50) = 7`. Стало 7 реплик.

## Что нужно для работы

1. **Metrics API** в кластере. Для CPU/memory — это `metrics-server`. На minikube он включается `mockctl up` (или `minikube addons enable metrics-server`).
2. **`requests`** на CPU/memory у целевого Deployment. Без этого HPA не может посчитать «процент использования».

```bash
kubectl top pods       # должно работать; если нет — нет metrics-server
```

## Минимальный HPA по CPU

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50      # 50% от requests
```

`Utilization` — процент от `requests`. Если у пода `requests.cpu: 100m` и реально потребляется 80m — utilization = 80%.

Альтернатива — `AverageValue` (абсолютное значение):

```yaml
target:
  type: AverageValue
  averageValue: 100m       # 100m средняя нагрузка на под
```

## Memory-based HPA

```yaml
metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

Memory-based HPA капризный: память «освобождается» неохотно (linux page cache, GC). Для **скейл-вверх** работает, для **скейл-вниз** обычно нет — из-за этого сервис может застрять на максимуме реплик. Чаще берут CPU-based + tuning через `behavior` (см. ниже).

## Custom metrics

Помимо `Resource` (CPU/memory), HPA умеет:

- **Pods** — кастомная метрика на под (RPS, длина очереди в коннекшене).
- **Object** — метрика на объект (Service: latency).
- **External** — метрика из внешней системы (длина SQS-очереди).

Для них нужен **prometheus-adapter** или аналогичный provider, регистрирующий API `custom.metrics.k8s.io`.

## Behavior: тонкая настройка

В autoscaling/v2 появился `behavior` — отдельные политики для scale up и scale down:

```yaml
spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100        # удваивать
          periodSeconds: 15
        - type: Pods
          value: 4          # или +4 пода
          periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300   # 5 минут «остывания»
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

`stabilizationWindowSeconds` для scale-down — самая полезная штука. Без неё HPA может «пилить» ввверх-вниз каждые 15 секунд при колеблющейся нагрузке. С 300 секундами — масштабируется вниз только если нагрузка стабильно низкая 5 минут.

## Полезные команды

```bash
kubectl get hpa
kubectl describe hpa web
kubectl get hpa web --watch
kubectl autoscale deploy web --cpu-percent=50 --min=2 --max=10  # императивный аналог
```

В `describe` вы увидите события вроде:

```text
SuccessfulRescale: New size: 5; reason: cpu resource utilization (percentage of request) above target
```

## Когда HPA не подходит

- **Stateful приложения, где скейл = заметная процедура.** HPA не даст вам распределить шарды БД.
- **Нагрузка ступенчатая, дискретная (cron).** HPA реагирует с задержкой, лучше явно scale на расписании.
- **Скейл по событиям (KEDA-сценарии).** Если триггер — длина очереди или прибытие сообщения, удобнее KEDA, а не custom metrics adapter.

## Чек-лист

- Что нужно настроить на самом Deployment, чтобы HPA смог по нему считать utilization?
- В чём разница между `Utilization` и `AverageValue`?
- Зачем `stabilizationWindowSeconds` в scaleDown?
- Какие типы метрик поддерживает `autoscaling/v2`?
- Будет ли HPA работать без metrics-server?

В лабе [18-lab-hpa.md](18-lab-hpa.md) разогнём CPU и понаблюдаем, как HPA реагирует.
