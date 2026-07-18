# 00. Окружение: GitLab, runner, registry, mockctl

## Сценарий с работы

Понедельник, 14:30. Вы скопировали `.gitlab-ci.yml` из wiki, push — pipeline **pending** навсегда. Коллега: «у нас runner с тегом `k8s`». Меняете tags — job стартует, падает на `docker: command not found`: shell runner, не docker executor. На следующий день build зелёный, deploy падает: `Unable to connect to the server` — kubeconfig в variable устарел после `mockctl down` → `up`. Третий инцидент: образ в registry есть, pod в `ImagePullBackOff` — забыли `imagePullSecrets`.

Три симптома — три слоя: **GitLab + runner**, **Container Registry**, **Kubernetes**. Intermediate строится на стыке всех трёх. Этот урок фиксирует стенд **до** [02-lab-multi-stage.md](02-lab-multi-stage.md), чтобы вы отлаживали pipeline, а не Docker Desktop.

**Предварительно:** [`gitlab-basic`](../gitlab-basic/README.md), [`kuber-basic`](../kuber-basic/README.md), [`mockctl`](../../mockctl/README.md).

## Что вы узнаете

- Как поднять GitLab CE и runner из [`deploy/gitlab`](../../deploy/gitlab/README.md).
- Как проверить Container Registry и путь `$CI_REGISTRY_IMAGE`.
- Как поднять кластер `mock-exams` и получить актуальный kubeconfig.
- Структуру [`examples/k8s-deploy/`](examples/k8s-deploy/) — что пойдёт в build и deploy.
- Чек-лист «стенд готов» перед главой 01.

---

## Архитектура учебного стенда

```text
┌─────────────────────────────────────────────────────────────┐
│  Хост (Windows / macOS / Linux)                             │
│  Docker Desktop                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ mock-gitlab  │  │ mock-runner  │  │ minikube         │ │
│  │ :8929        │──│ docker.sock  │  │ profile mock-    │ │
│  │ + registry   │  │ executor     │  │ exams (mockctl)  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│         ▲                  │                    ▲         │
│         │                  │ build/push       │ kubectl   │
│         └──────────────────┴────────────────────┘         │
│                    CI jobs (pipeline)                       │
└─────────────────────────────────────────────────────────────┘
```

Pipeline: **lint/test** → **docker build** (dind) → **push** в registry → **deploy** с `kubectl` в minikube.

| Компонент | Контейнер | URL с хоста | URL из runner |
|-----------|-----------|-------------|---------------|
| GitLab CE | `mock-gitlab` | `http://localhost:8929` | `http://gitlab` |
| Runner | `mock-gitlab-runner` | — | docker executor |
| K8s API | minikube | через kubeconfig | см. лабу 06 |
| Registry | встроен в GitLab | `localhost:8929` | `$CI_REGISTRY` |

---

## Шаг 1. Проверка prerequisites

Перед поднятием стенда убедитесь, что базовые курсы пройдены:

```bash
git --version          # ≥ 2.30
docker version
docker compose version
```

| Проверка | Команда | Ожидание |
|----------|---------|----------|
| GitLab basic | runner online, tag `docker` | [gitlab-basic/06](../gitlab-basic/06-lab-docker-runner.md) |
| K8s basic | `kubectl version --client` | [kuber-basic](../kuber-basic/README.md) |
| mockctl | `mockctl version` или `mockctl install` | бинарник в PATH |

Если runner не зарегистрирован — см. [gitlab-basic/00-environment.md](../gitlab-basic/00-environment.md).

---

## Шаг 2. GitLab CE

Из корня `mock-exams`:

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
docker exec mock-gitlab gitlab-ctl status
```

Первый старт — **5–15 минут**. UI: [http://localhost:8929](http://localhost:8929).

Пароль `root`:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Сохраните пароль (файл удаляется через 24 ч). Подробности: [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md).

Остановка: `docker compose -f deploy/gitlab/docker-compose.yml down` (volumes сохраняют данные). Полная очистка: `down -v`.

---

## Шаг 3. Runner с Docker executor

Если прошли [gitlab-basic/06-lab-docker-runner.md](../gitlab-basic/06-lab-docker-runner.md) — runner уже есть. Иначе:

1. **Settings → CI/CD → Runners → New project runner**.
2. Tags: `docker`, `local`.
3. Регистрация:

```bash
docker exec -it mock-gitlab-runner gitlab-runner register \
  --url http://gitlab \
  --token YOUR_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "local-docker" \
  --tag-list "docker,local" \
  --non-interactive \
  --docker-network-mode host
```

Для **Docker-in-Docker** (главы 03–04) понадобится `privileged = true` в `/etc/gitlab-runner/config.toml` — см. [03-docker-registry.md](03-docker-registry.md).

Smoke job:

```yaml
test-runner:
  tags: [docker]
  image: alpine
  script: [echo "runner ok"]
```

Pipeline должен стать **passed**, не **pending**.

---

## Шаг 4. Container Registry

Registry встроен в GitLab CE. Для проекта `hello-ci`: **Deploy → Container Registry** — пусто до первого push.

| Variable | Пример (локально) | Кто создаёт |
|----------|-------------------|-------------|
| `CI_REGISTRY` | `localhost:8929` | GitLab автоматически |
| `CI_REGISTRY_IMAGE` | `localhost:8929/root/hello-ci` | GitLab автоматически |
| `CI_REGISTRY_USER` | `gitlab-ci-token` | GitLab автоматически |
| `CI_REGISTRY_PASSWORD` | job token | GitLab автоматически |

Запишите путь `CI_REGISTRY_IMAGE` — понадобится в лабе 04.

---

## Шаг 5. mockctl и kubectl

```bash
mockctl install    # minikube + kubectl, если ещё нет
mockctl up
mockctl status
```

Ожидаемый вывод: нода `Ready`, `output/kubeconfig.yaml` обновлён.

```bash
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"   # Linux/macOS
# PowerShell: $env:KUBECONFIG = "$PWD\output\kubeconfig.yaml"

kubectl config current-context
kubectl get nodes
```

Если `connection refused` после рестарта Docker: `mockctl kubeconfig` → повторите `kubectl get nodes`.

**Не** коммитьте `output/kubeconfig.yaml` в Git. В CI — **File variable** `KUBECONFIG` (protected) — [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md).

Опционально Helm: [`kuber-intermediate/07-helm.md`](../kuber-intermediate/07-helm.md).

---

## Шаг 6. Проект и examples/k8s-deploy

1. Создайте проект `hello-ci` (или импортируйте [`gitlab-basic/examples/hello-ci`](../gitlab-basic/examples/hello-ci/)).
2. Скопируйте [`examples/k8s-deploy/`](examples/k8s-deploy/):

```text
hello-ci/
├── Dockerfile
├── app/
│   └── index.html            ← простая HTML-страница
└── k8s/
    └── deployment.yaml       ← плейсхолдер ${IMAGE}
```

`Dockerfile` (из [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile)):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY app/ ./app/
EXPOSE 8080
CMD ["python", "-m", "http.server", "8080", "--directory", "app"]
```

`k8s/deployment.yaml` — `${IMAGE}` и `imagePullSecrets: gitlab-reg`; подстановка в CI через `envsubst` ([06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md)).

---

## Шаг 7. Registry ↔ кластер (превью)

Kubernetes не умеет pull из приватного `localhost:8929` без credentials. В лабе 06:

```bash
kubectl create secret docker-registry gitlab-reg \
  --docker-server=localhost:8929 \
  --docker-username=root \
  --docker-password=YOUR_PASSWORD \
  -n hello-ci
```

В CI — через `$CI_REGISTRY_*` ([05-deploy-kubernetes.md](05-deploy-kubernetes.md)).

---

## Типичные ошибки

| Симптом | Частая причина | Что сделать |
|---------|----------------|-------------|
| Pipeline pending | нет runner / неверный `tags` | Settings → CI/CD → Runners |
| GitLab 502 | ещё стартует | `gitlab-ctl status`, подождать 15 мин |
| `docker:dind` refused | runner не privileged | [03-docker-registry.md](03-docker-registry.md) |
| kubectl connection refused | устаревший kubeconfig | `mockctl kubeconfig` |
| Registry push 401 | нет `docker login` | `CI_REGISTRY_*` в job |
| Два Docker / WSL | разные daemon | один Docker для GitLab и minikube |

---

## Резюме

- Стенд: GitLab [`deploy/gitlab`](../../deploy/gitlab/README.md) + кластер [`mockctl`](../../mockctl/README.md).
- Runner с tag `docker` и (позже) `privileged` для dind.
- Registry на том же хосте `:8929`; deploy по `$CI_COMMIT_SHA`.
- Примеры в [`examples/k8s-deploy/`](examples/k8s-deploy/) — основа лаб 04–06.

---

## Чек-лист

- [ ] GitLab UI на :8929, вход `root` работает
- [ ] Project runner с tags `docker` — тестовый job **passed**
- [ ] `mockctl status` — нода **Ready**
- [ ] `kubectl get nodes` с `KUBECONFIG=output/kubeconfig.yaml`
- [ ] Проект `hello-ci` создан, `examples/k8s-deploy` в репозитории
- [ ] Записан путь будущего `CI_REGISTRY_IMAGE`
- [ ] Понимаете, где kubeconfig для CI (File variable, не в Git)

Следующий урок: [01-multi-stage.md](01-multi-stage.md).
