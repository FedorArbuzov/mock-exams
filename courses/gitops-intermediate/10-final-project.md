# 10. Финальный проект: платформа GitOps

## Задание

На **mockctl** собрать минимальную «платформу»:

1. **Argo CD** установлен.
2. **gitops-root** (app-of-apps) синкает минимум **2** child Application:
   - `hello-gitops` → `gitops-demo`
   - `sync-waves` → `gitops-waves`
3. Добавьте в fork третий child `apps/echo.yaml` (создайте сами):
   - path: новый каталог `deploy/gitops/manifests/echo/` (Deployment nginx + Service)
   - namespace: `gitops-echo`
4. Продемонстрируйте **rollback** после намеренно плохого image ([лаба 06](06-lab-rollback.md)).
5. Документ `GITOPS.md` в fork:
   - схема app-of-apps (ascii или mermaid)
   - URL репозитория, ветка
   - команды port-forward UI
   - кто делает CI vs CD

## Критерии приёмки

| # | Критерий |
|---|----------|
| 1 | Root + 3 child Application Synced |
| 2 | sync-waves: waves 0→1→2 без ошибок |
| 3 | Rollback/revert задокументирован |
| 4 | Нет секретов в plain text в Git |
| 5 | Связь с GitLab split описана (1 абзац) |

## Связь с capstone

- [kuber-advanced/27](../kuber-advanced/27-final-project.md) — Argo + Prometheus + policy
- [gitlab-advanced/15](../gitlab-advanced/15-final-project.md) — CI → gitops → Argo staging

## Уборка

```bash
cd deploy/gitops && bash scripts/uninstall.sh
```
