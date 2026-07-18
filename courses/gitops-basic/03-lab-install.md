# 03. Лаба: установка Argo CD

## Цель

Поднять Argo CD на **mockctl** и войти в UI.

## Предварительно

```bash
mockctl up
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"   # из корня репозитория
kubectl get nodes
```

## Шаги

```bash
cd deploy/gitops
bash scripts/install-argocd.sh
bash scripts/get-admin-password.sh
```

В другом терминале:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Откройте https://localhost:8080 — user **`admin`**, password из скрипта. Примите предупреждение TLS (self-signed).

Опционально CLI:

```bash
argocd login localhost:8080 --username admin --password '<pwd>' --insecure
argocd version
```

## Ожидаемый результат

```bash
kubectl get pods -n argocd
# argocd-server, application-controller, repo-server, redis — Running
```

## Критерии успеха

- [ ] Все core-поды в `argocd` — Running
- [ ] UI открывается, вход admin успешен
- [ ] `argocd version` (если CLI установлен) отвечает

## Типичные ошибки

| Симптом | Решение |
|---------|---------|
| `connection refused` к API | `mockctl status` / `mockctl kubeconfig` |
| Pods Pending | Docker Desktop RAM 4+ ГБ |
| Timeout install | повторить wait; `kubectl get events -n argocd` |

## Уборка (позже)

`bash scripts/uninstall.sh` — в конце курса.

Следующий урок: [04-application-spec.md](04-application-spec.md).
