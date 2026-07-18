# 05. Taints, tolerations, nodeSelector

## Как scheduler выбирает ноду

1. **Filter** — отбрасывает неподходящие ноды (не хватает CPU/RAM, taint без toleration, nodeSelector не совпал).
2. **Score** — ранжирует оставшиеся (spread, affinity, …).
3. Записывает `spec.nodeName`.

## nodeSelector — простейший фильтр

```yaml
spec:
  nodeSelector:
    disktype: ssd
```

Под попадёт только на ноду с label `disktype=ssd`. Если таких нет — `Pending` навсегда.

```bash
kubectl label nodes minikube disktype=ssd
kubectl label nodes minikube disktype-        # удалить label
```

## Taints и Tolerations

**Taint** на ноде = «сюда нельзя, кроме…». **Toleration** на поде = «я могу терпеть этот taint».

```bash
kubectl taint nodes minikube dedicated=special:NoSchedule
```

Формат: `key=value:Effect`

| Effect | Поведение |
|---|---|
| `NoSchedule` | Новые поды не ставятся (существующие остаются) |
| `PreferNoSchedule` | Старается не ставить, но может |
| `NoExecute` | Не ставит + **выселяет** уже работающие без toleration |

Toleration на поде:

```yaml
spec:
  tolerations:
    - key: dedicated
      operator: Equal
      value: special
      effect: NoSchedule
```

`operator: Exists` — терпит любое значение этого key.

### Снять taint

```bash
kubectl taint nodes minikube dedicated=special:NoSchedule-
#                                                                    ^ минус в конце
```

## Встроенные taints

| Taint | Когда |
|---|---|
| `node.kubernetes.io/not-ready:NoSchedule` | Нода NotReady |
| `node.kubernetes.io/unreachable:NoSchedule` | Нода недоступна |
| `node.kubernetes.io/disk-pressure:NoSchedule` | Мало места на диске |
| `node.kubernetes.io/memory-pressure:NoSchedule` | Мало памяти |
| `node.kubernetes.io/pid-pressure:NoSchedule` | Мало PID |
| `node.kubernetes.io/unschedulable` | После `kubectl cordon` |

## Cordon и Drain

```bash
kubectl cordon minikube          # NoSchedule taint, поды остаются
kubectl uncordon minikube
kubectl drain minikube --ignore-daemonsets --delete-emptydir-data
```

`drain` = cordon + eviction всех подов (с учётом PDB).

## nodeName — обход scheduler

```yaml
spec:
  nodeName: minikube
```

Scheduler **пропускается**. Используйте только для отладки.

## Чек-лист CKA

- Чем taint отличается от label?
- Как снять taint?
- Что делает `NoExecute` vs `NoSchedule`?
- Как запретить новые поды на ноде, не трогая текущие?
- Команда drain с игнором DaemonSet?

Лаба: [07-lab-scheduling.md](07-lab-scheduling.md) вместе с affinity.
