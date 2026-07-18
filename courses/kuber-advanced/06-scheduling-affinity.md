# 06. Affinity, anti-affinity, topology spread

## nodeSelector vs affinity

`nodeSelector` — простой match labels на ноде. **Affinity** — гибче: soft/hard правила, комбинации, anti-affinity между подами.

## nodeAffinity

### required (hard)

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values: [zone-a, zone-b]
```

Под **не запустится**, если нет ноды в zone-a или zone-b. `IgnoredDuringExecution` — если label ноды изменится после запуска, под **не выселят**.

### preferred (soft)

```yaml
preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 80
    preference:
      matchExpressions:
        - key: disktype
          operator: In
          values: [ssd]
  - weight: 20
    preference:
      matchExpressions:
        - key: disktype
          operator: In
          values: [hdd]
```

Scheduler **предпочитает** SSD, но на HDD тоже запустит, если SSD нет.

## podAffinity / podAntiAffinity

Правила относительно **других подов** (по labels).

### podAntiAffinity — «не рядом»

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: web
          topologyKey: kubernetes.io/hostname
```

«Не ставить на ту же ноду (`hostname`), где уже есть pod с `app=web`». Классика для HA: реплики на разных нодах.

### podAffinity — «рядом»

```yaml
podAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: cache
      topologyKey: kubernetes.io/hostname
```

«Ставить только на ноду, где уже есть cache» — locality.

## topologySpreadConstraints (современная замена)

```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: web
```

`maxSkew: 1` — разница числа подов между зонами не больше 1. `DoNotSchedule` — hard; `ScheduleAnyway` — soft.

На minikube одна нода — **симулируем** зоны через labels:

```bash
kubectl label node minikube topology.kubernetes.io/zone=zone-a
```

Для multi-node minikube:

```bash
minikube node add -p mock-exams
kubectl label node mock-exams-m02 topology.kubernetes.io/zone=zone-b
```

## Сравнительная таблица

| Механизм | Hard/Soft | Объект сравнения |
|---|---|---|
| nodeSelector | Hard | labels ноды |
| nodeAffinity required | Hard | labels ноды |
| nodeAffinity preferred | Soft | labels ноды |
| podAntiAffinity | Hard/Soft | labels подов |
| topologySpreadConstraints | Hard/Soft | распределение по topologyKey |

## Чек-лист CKA

- Чем `requiredDuringScheduling` отличается от `preferred`?
- Что делает `topologyKey: kubernetes.io/hostname` в podAntiAffinity?
- Зачем `IgnoredDuringExecution` в названии?
- Как развести 3 реплики web по разным нодам?
- Что такое `maxSkew` в topologySpreadConstraints?

Лаба: [07-lab-scheduling.md](07-lab-scheduling.md).
