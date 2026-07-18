# 10. Финальный проект: demo из Git

## Задание

На mockctl развернуть приложение **из вашего fork** end-to-end:

1. Fork `mock-exams`, ветка `gitops-basic-final`.
2. В `deploy/gitops/manifests/hello-gitops/deployment.yaml` — label `course: gitops-basic-final`, `replicas: 2`.
3. `config/repo.env` → URL fork; `apply-hello-direct.sh`.
4. Докажите Synced + 2 Pod; screenshot или вывод `argocd app get`.
5. Сделайте **drift** (`kubectl scale` → 5), покажите OutOfSync и возврат к 2.
6. Измените replicas в Git на **3**, push, sync — скриншот History.
7. Краткий README в fork (5–10 строк): URL Application, что сделали.

## Критерии приёмки

| # | Критерий |
|---|----------|
| 1 | Argo CD установлен, UI доступен |
| 2 | Application без repo errors |
| 3 | selfHeal продемонстрирован |
| 4 | Git-driven change (replicas 3) |
| 5 | Нет `kubectl apply` манифестов приложения в обход Git |

## Опционально

- Установить `argocd` CLI и сделать `app diff` в отчёте.
- Добавить `metadata.labels` для отслеживания в Prometheus (будущий курс).

## Дальше

[gitops-intermediate](../gitops-intermediate/README.md) — app-of-apps, sync waves, rollback.
