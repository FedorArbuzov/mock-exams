# 05. History, rollback, git revert

## Ревизии в Argo CD

Каждый успешный **sync** — запись в **History** Application: Git commit, кто синкал, manifest snapshot.

## Rollback в UI / CLI

```bash
argocd app history hello-gitops
argocd app rollback hello-gitops <id>
```

Откатывает кластер к **состоянию той ревизии** (live manifests), не меняя Git автоматически.

| Метод | Git | Кластер |
|-------|-----|---------|
| `app rollback` | может остаться «впереди» | откат к старой ревизии |
| `git revert` + sync | канон в Git | подстраивается под Git |

**Production:** предпочитайте **git revert** (аудит, повторяемость). Argo rollback — для быстрого восстановления, затем выровнять Git.

## Сценарий «плохой релиз»

1. Push с битым image tag → Degraded.
2. `git revert` коммита **или** `argocd app rollback`.
3. Убедиться Synced + Healthy.
4. Postmortem: почему прошёл sync (policy, preview diff).

## Image tag vs digest

Tag `latest` или плавающий `1.2` — Argo не увидит изменения без commit. Лучше **immutable tag** (SHA) в Git ([gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md)).

## Чек-лист

- Чем rollback Argo отличается от git revert?
- Почему после rollback Application может снова стать OutOfSync?

Лаба: [06-lab-rollback.md](06-lab-rollback.md).
