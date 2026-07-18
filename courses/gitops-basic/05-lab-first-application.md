# 05. Лаба: первый Application

## Цель

Задеплоить `hello-gitops` из Git через Argo CD.

## Важно про Git

Argo CD читает **удалённый** репозиторий. Сделайте **fork** `mock-exams`, закоммитьте изменения (если правили) и **push**. В `config/repo.env` укажите URL fork и ветку (`main` / `master`).

```bash
cd deploy/gitops
cp config/repo.env.example config/repo.env
# отредактируйте MOCK_GITOPS_REPO, MOCK_GITOPS_REVISION
```

В `apps/*.yaml` при другом URL — замените `repoURL` на свой fork (или используйте только direct apply ниже).

## Шаги

```bash
bash scripts/apply-hello-direct.sh
kubectl get application -n argocd
kubectl get application hello-gitops-direct -n argocd -o jsonpath='{.status.sync.status}{"\n"}'
kubectl get pods -n gitops-demo
```

В UI: Applications → `hello-gitops-direct` → Sync Status **Synced**, Health **Healthy**.

Проверка трафика:

```bash
kubectl port-forward svc/hello-gitops -n gitops-demo 8888:80
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8888/
# 200
```

## Ожидаемый результат

- Namespace `gitops-demo` создан
- Deployment `hello-gitops` — 2 replicas Running
- Application — Synced

## Критерии успеха

- [ ] Application без ошибки repo access
- [ ] 2 Pod Running
- [ ] В UI виден resource tree

## Ошибки

| Симптом | Действие |
|---------|----------|
| `repository not accessible` | URL, ветка, публичность fork |
| `path not found` | путь `deploy/gitops/manifests/hello-gitops` есть в remote |
| OutOfSync долго | нажать Sync; смотреть Events Application |

Следующий урок: [06-sync-drift.md](06-sync-drift.md).
