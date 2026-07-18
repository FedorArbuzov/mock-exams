# GitOps-стенд для курсов gitops-*

Манифесты и **Application** для кластера **mockctl** (`mockctl up`). Контроллер — **Argo CD** (устанавливается скриптом, не Docker Compose).

Курсы: [gitops-basic](../../courses/gitops-basic/README.md), [gitops-intermediate](../../courses/gitops-intermediate/README.md).

Обзор в других курсах (коротко): [kuber-advanced/16](../../courses/kuber-advanced/16-argocd.md), [gitlab-advanced/11](../../courses/gitlab-advanced/11-gitlab-and-argocd.md).

## Предварительно

```bash
mockctl up
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"   # из корня репозитория
kubectl get nodes
```

## Установка Argo CD

```bash
cd deploy/gitops
bash scripts/install-argocd.sh
```

| Компонент | Namespace |
|-----------|-----------|
| Argo CD | `argocd` |
| Demo apps | `gitops-demo`, `gitops-waves` |

UI (после install):

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080  user: admin
bash scripts/get-admin-password.sh
```

## Репозиторий для Application

Argo CD читает Git по **HTTPS URL**. Варианты:

1. **Публичный fork** `mock-exams` — подставьте свой URL в `config/repo.env`.
2. **Этот репозиторий на GitHub** — если ваш `origin` совпадает с опубликованным remote.

```bash
cp config/repo.env.example config/repo.env
# отредактируйте MOCK_GITOPS_REPO и MOCK_GITOPS_REVISION (main/master)
source config/repo.env
```

Bootstrap **app-of-apps** (после push манифестов в remote):

```bash
bash scripts/bootstrap-root.sh
```

Локальная проверка без root-app — прямой Application:

```bash
envsubst < examples/application-hello.yaml | kubectl apply -f -
```

(`envsubst` из gettext; на Windows — подставьте URL вручную или Git Bash.)

## Структура каталога

```text
deploy/gitops/
  bootstrap/          # root Application → apps/
  apps/               # дочерние Application (app-of-apps)
  manifests/
    hello-gitops/     # nginx demo (basic)
    sync-waves/       # ConfigMap → Deploy → Service (intermediate)
  examples/           # шаблоны Application
  scripts/
```

## Smoke test

```bash
bash scripts/smoke.sh
# .\scripts\smoke.ps1
```

Проверяет: nodes Ready, Argo CD pods, опционально `hello-gitops` в `gitops-demo`.

## Уборка

```bash
bash scripts/uninstall.sh
# удаляет Application, demo namespaces, namespace argocd
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `connection refused` к API | `mockctl status` / `mockctl kubeconfig` |
| Application `Unknown` / repo error | URL в `repo.env`, ветка существует, манифесты **запушены** |
| OutOfSync после `kubectl scale` | ожидаемо; с `selfHeal: true` Argo откатит |
| Sync waves «вразнобой» | смотрите Events Application, аннотации `sync-wave` |
| UI TLS warning | `--insecure` для `argocd login` |

## Flux

В курсе **gitops-intermediate** — сравнение **Flux CD** (GitRepository + Kustomization). Стенд в репозитории заточен под **Argo CD**; Flux ставится отдельно по документации проекта, если нужен второй контроллер (не смешивайте на одних namespace без понимания).
