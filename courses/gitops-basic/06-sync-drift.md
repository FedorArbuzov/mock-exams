# 06. Synced / OutOfSync, selfHeal, prune

## Drift

**Drift** — расхождение между Git (desired) и кластером (live).

```bash
kubectl scale deploy hello-gitops -n gitops-demo --replicas=5
```

В UI Application станет **OutOfSync** (replicas в Git = 2, в кластере = 5).

## selfHeal

При `syncPolicy.automated.selfHeal: true` контроллер **вернёт** replicas к значению из Git без вашего участия (обычно в течение ~3 мин или сразу после sync interval).

| selfHeal | Поведение |
|----------|-----------|
| `true` | кластер подстраивается под Git |
| `false` | drift остаётся до ручного Sync или правки Git |

## prune

Удалите из Git `Service` hello-gitops и сделайте sync с `prune: true` — Service **исчезнет** из кластера.

Без prune — «осиротевший» объект останется (опасно для мусора, полезно осторожно на prod).

## Manual sync

```bash
argocd app sync hello-gitops-direct
argocd app diff hello-gitops-direct
```

## Когда отключать auto

- Миграции с ручным порядком (sync waves — [intermediate](../gitops-intermediate/03-sync-waves.md)).
- Canary — временно другой образ в кластере (лучше отдельный overlay в Git).

## Чек-лист

- OutOfSync всегда плохо?
- Чем selfHeal отличается от «просто не трогать кластер»?
- Риск `prune: true` на prod?

Лаба: [07-lab-self-heal.md](07-lab-self-heal.md).
