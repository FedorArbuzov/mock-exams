# 19. PodDisruptionBudget, rollouts и drain

## Зачем

Когда кластер «двигается» — апгрейд нод, drain для обслуживания, скейл-down deploy — поды могут уезжать. Если их слишком много уехало одновременно, сервис становится недоступен.

**PodDisruptionBudget (PDB)** — объект, который говорит: «у этого приложения **не меньше N реплик** должно оставаться доступными при добровольных disruption-ах».

«Добровольные» (voluntary) disruption — это:

- `kubectl drain node`;
- автоматический evict при апгрейде ноды;
- скейл-down контроллера;
- ручное удаление пода через kubectl.

«Невольные» (involuntary) — отказ железа, OOM, kernel panic — PDB не защищает от них (это просто нельзя предотвратить).

## Минимальный PDB

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  selector:
    matchLabels:
      app: web
  minAvailable: 2
```

Что говорит: «среди подов с label `app=web` — всегда **минимум 2** должны быть доступны». Если приложение скейлено в 4 — drain ноды разрешит снять до 2 одновременно. Если приложение скейлено в 2 — drain не сможет ничего снять, пока не появится больше реплик.

Альтернатива:

```yaml
spec:
  maxUnavailable: 1     # разрешено снять не более 1 одновременно
```

`maxUnavailable: 1` для одного namespace + `replicas: 3` → drain снимет одного, пересоздаст, потом следующего.

## Поведение `kubectl drain`

```bash
kubectl drain minikube --ignore-daemonsets --delete-emptydir-data
```

`drain` =:

1. Помечает ноду как unschedulable (cordon).
2. Eviction-ит все поды (через eviction API, который **уважает** PDB).
3. Если PDB не позволяет — drain «зависает», ждёт, пока deployment пересоздаст другие реплики на других нодах.

В minikube одна нода, поэтому drain — больше демонстрационный.

## RollingUpdate в Deployment — встроенный PDB-аналог

Deployment во время rollout уже имеет **свои** ограничения:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
```

- `maxUnavailable` — сколько реплик можно «лишить» одновременно (вниз от replicas).
- `maxSurge` — сколько лишних реплик можно создать сверху (вверх от replicas).

Пример: replicas=4, maxUnavailable=1, maxSurge=1 — во время rollout будет 3..5 подов одновременно.

PDB **не заменяет** это, а защищает от disruption-ов **извне** rollout-а. Если ваш Deployment в покое и вдруг кто-то делает drain — без PDB Deployment не вмешается.

## Когда нужны оба

- В Deployment — `RollingUpdate` с осмысленными maxSurge/maxUnavailable, чтобы свои деплои не вешали сервис.
- + PDB на этот же Deployment, чтобы защитить от чужих disruption-ов (drain, авто-апгрейды, eviction по нагрузке).

## Деплой стратегии шире

Помимо `RollingUpdate` и `Recreate`, есть **canary** и **blue-green**, но в Deployment их нет «из коробки» — реализуются через несколько Deployment-ов и Service / Ingress weight, или через инструменты (Argo Rollouts, Flagger).

Пример canary вручную:

```text
Deployment web-stable    (replicas=9, image=v1)   ← 90% трафика
Deployment web-canary    (replicas=1, image=v2)   ← 10% трафика
Service web (selector: app=web)                    ← обе попадают
```

## terminationGracePeriodSeconds — про disruption тоже

Когда eviction-ит pod, kubelet:

1. Шлёт SIGTERM.
2. Ждёт `terminationGracePeriodSeconds` (default 30).
3. Шлёт SIGKILL.

Если ваше приложение долго закрывает коннекшены — увеличьте grace period. Если у вас нет ничего ценного для shutdown — можно уменьшить, чтобы drain быстрее завершился.

## Полезные команды

```bash
kubectl get pdb
kubectl describe pdb web-pdb
kubectl get pdb -A           # PDB по всему кластеру
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
kubectl uncordon <node>      # после drain — вернуть ноду в работу

# увидеть, какие поды eviction-able прямо сейчас:
kubectl get pdb web-pdb -o yaml | grep -E 'currentHealthy|desiredHealthy|disruptionsAllowed'
```

`disruptionsAllowed: 1` — drain прямо сейчас может снять одну реплику.

## Чек-лист

- Чем PDB отличается от `RollingUpdate.maxUnavailable`?
- От каких видов disruption PDB **не защищает**?
- Что произойдёт с `kubectl drain`, если PDB запрещает eviction?
- Можно ли поставить PDB на StatefulSet? Что важно учесть?
- Зачем `terminationGracePeriodSeconds` имеет значение для drain?

В лабе [20-lab-pdb-and-rollouts.md](20-lab-pdb-and-rollouts.md) подеражим Deployment и подёргаем drain.
