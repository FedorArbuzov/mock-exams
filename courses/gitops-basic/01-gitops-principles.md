# 01. GitOps: desired state в Git

## Введение: «кто прав — кластер или Git?»

На проде часто два источника правды: манифесты в репозитории и «что сейчас в kubectl get». После ночного `kubectl scale` или hotfix через `edit` кластер **расходится** с Git. GitOps отвечает: **каноническое состояние — в Git**; контроллер постоянно **сверяет** и **приводит** кластер к коммиту.

## Модель

```text
Developer / CI  →  commit в Git (manifests / helm / kustomize)
                        │
                        ▼
              GitOps controller (Argo CD / Flux)
                        │
                        ▼
                 Kubernetes API
```

| Роль | Действие |
|------|----------|
| Разработчик / платформа | Меняет YAML в Git (MR, review) |
| CI | Собирает образ, **обновляет tag** в gitops-репо (не `kubectl apply`) |
| CD-контроллер | Sync, diff, rollback |

## Что даёт GitOps

- **Аудит** — кто, когда, зачем (git blame, MR).
- **Rollback** — `git revert` + sync (или rollback ревизии в Argo).
- **Одинаковые env** — staging/prod из веток или overlay.
- **Drift detection** — ручные правки видны как OutOfSync.

## Чего GitOps не заменяет

- Сборку образов, unit-тесты — это **CI**.
- Секреты в открытом виде в Git — нужны **Sealed Secrets**, **External Secrets**, Vault ([`secrets-basic`](../secrets-basic/README.md)).
- Stateful data — backup БД, не «откат Deployment».

## Антипаттерн

`kubectl apply -f` в GitLab job **и** Argo CD на те же файлы — два оператора, конфликты, «почему откатилось». Выберите **один** CD.

## Чек-лист

- Где хранится desired state?
- Кто имеет право менять production namespace напрямую?
- Как откатить релиз без SSH на master?

Следующий урок: [02-argocd-architecture.md](02-argocd-architecture.md).
