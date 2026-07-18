# 14. Interview Q&A — GitLab Intermediate

~20 вопросов с развёрнутыми ответами для собеседования DevOps / Platform. Сначала ответьте **сами вслух**, затем сверьтесь. Краткая шпаргалка: [interview-cheatsheet.md](interview-cheatsheet.md). Стенд курса: [`deploy/gitlab`](../../deploy/gitlab/README.md), [`mockctl`](../../mockctl/README.md).

---

## Multi-stage pipelines

### 1. Чем `stages` отличается от `needs`?

**`stages`** задаёт глобальный порядок: все jobs текущего stage должны успешно завершиться, прежде чем GitLab запустит следующий stage. Jobs внутри одного stage по умолчанию **параллельны**. **`needs`** строит directed acyclic graph между конкретными jobs: job может стартовать сразу после перечисленных зависимостей, не дожидаясь остальных jobs того же или предыдущего stage.

Пример: `docker-build` с `needs: [unit]` не ждёт медленный `integration` в stage `test`. Без `needs` ускорение возможно только дроблением stages, что усложняет конфиг и всё равно жёстче DAG.

### 2. Зачем `workflow:rules`?

Фильтрует **создание всего pipeline**, а не отдельных jobs. Паттерн курса: pipeline только на `merge_request_event` и на ветку `main`; push в `feature/x` без MR — `when: never`. Экономит runner minutes и предотвращает случайный deploy с веток, где job-level `rules` забыли.

`rules` на отдельном job не отменяют создание pipeline — job будет **skipped**, но pipeline существует и виден в UI.

### 3. Что такое fail fast в CI?

Дешёвые проверки (lint, unit, `terraform fmt`) выполняются **до** дорогих (docker build, deploy, terraform apply). Реализация: порядок stages и/или `needs`. Антипаттерн — `docker-build` в том же stage, что `unit`, без `needs`: при падении тестов образ уже собирается, тратя 5–10 минут runner.

### 4. Когда deploy не должен бежать на feature branch?

Когда нет изолированного review namespace. Production и shared staging — только `main` или release tags. Feature branch — lint/test/build без deploy, либо **dynamic environment** `review/$CI_COMMIT_REF_SLUG` с `on_stop` для cleanup. Deploy в shared staging с feature branch — частый источник инцидентов на собесах.

---

## Container Registry

### 5. Что входит в `CI_REGISTRY_IMAGE`?

Полный путь образа **без тега**: `<registry-host>/<namespace>/<project>`. Например `localhost:8929/root/hello-ci` на учебном [`deploy/gitlab`](../../deploy/gitlab/README.md). Тег для deploy: `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`. Credentials — `CI_REGISTRY_USER` (обычно `gitlab-ci-token`) и `CI_REGISTRY_PASSWORD` (job token).

### 6. Зачем job token для registry login?

Job token выдаётся на время job и даёт scoped доступ к registry проекта без long-lived пароля root в CI variables. Меньше риск утечки при dump variables или логов. Для cross-project pull в другой namespace — **deploy token** или **project access token** с минимальными правами.

### 7. Docker-in-Docker vs Kaniko — когда что?

**dind**: полноценный Docker daemon в sidecar (`services: docker:dind`); часто требует **privileged** runner — зона повышенного риска. **Kaniko**: сборка без Docker socket на хосте; предпочтительнее в locked-down Kubernetes executor. Учебный compose с `docker.sock` — dind проще; enterprise production — Kaniko/BuildKit rootless.

### 8. Почему не деплоить по тегу `latest`?

`latest` **перезаписывается** при каждом push; нельзя надёжно сопоставить running Pod с commit в Git; rollback неясен («какой latest был вчера?»). **Immutable** `$CI_COMMIT_SHA` даёт трассируемость: SHA в Git = тег в registry = image в `kubectl describe pod`.

---

## Deploy в Kubernetes

### 9. Почему kubeconfig в CI должен быть protected?

Protected CI/CD variables доступны только jobs на **protected branches/tags**. Feature MR от форка или недоверенного contributor не получит kubeconfig — снижение blast radius. Тип **File**, не plain text в repo; ротация после `mockctl down` / `up` когда меняется API endpoint minikube.

### 10. Зачем `imagePullSecrets`?

GitLab Container Registry по умолчанию **приватен** для проекта. Без credentials kubelet при pull получит `401 Unauthorized` → Pod в `ImagePullBackOff`. Secret типа `kubernetes.io/dockerconfigjson` в `imagePullSecrets` Pod spec. В CI создают idempotent: `kubectl create secret ... --dry-run=client -o yaml | kubectl apply`.

### 11. Helm vs raw `kubectl apply` в CI?

**kubectl + envsubst** — минимум зависимостей, прозрачные манифесты ([`examples/k8s-deploy`](examples/k8s-deploy/)). **Helm** — шаблоны, values per environment, `helm rollback` ([kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md)). **GitOps** (Argo CD, Flux) убирает kubectl из CI — CI только build/push; CD из Git — [`gitlab-advanced`](../gitlab-advanced/README.md).

### 12. GitOps vs CI deploy — trade-off?

**CI deploy**: pipeline вызывает `kubectl`/`helm` после merge — быстро внедрить, риск drift (ручные `kubectl edit` не отражены в Git). **GitOps**: desired state в Git; контроллер синхронизирует кластер; CI только публикует образ. Intermediate учит CI deploy как фундамент перед GitOps.

### 13. Что делает `kubectl rollout status` в deploy job?

Блокирует job до завершения rollout Deployment (новые ReplicaSet Pods Ready). При timeout или crash loop job **failed** — pipeline красный, алерт команде. Откат: `kubectl rollout undo` или redeploy предыдущего SHA из registry.

---

## Environments

### 14. `when: manual` на job vs `rules: when: manual`?

Оба создают job, требующий нажатия **Play** в UI. **`rules`** гибче — можно скрыть job на MR через финальный `when: never`. Manual job **создаётся** в pipeline graph и виден; skipped job — нет. Не путать с **Run pipeline** (manual pipeline целиком).

### 15. Зачем protected environment?

Ограничивает, кто может deploy в `production` (роль Maintainer+ в CE). Merge в `main` автоматически ≠ prod deploy. В GitLab EE — deployment approvals, несколько approvers. Связка: protected environment + protected kubeconfig variable.

### 16. Что такое `on_stop`?

Связывает environment с **cleanup job** (`environment.action: stop`). Для `review/$CI_COMMIT_REF_SLUG` при закрытии MR или кнопке Stop в UI запускается job, удаляющий namespace — иначе review apps копятся и жрут ресурсы.

### 17. Variables scoped to environment — пример?

`REPLICAS=1` scope `staging`, `REPLICAS=3` scope `production`. GitLab подставляет variable по `environment:name` job при запуске. Один key — разные values без дублирования job definitions ([08-lab-environments.md](08-lab-environments.md)).

---

## CI templates

### 18. `include` vs copy-paste в 10 репозиториях?

**include** (project/local/remote) — единый источник правды; обновление dind TLS, login, тегов в одном MR template repo. Copy-paste — неизбежный drift («в сервисе B забыли `DOCKER_TLS_CERTDIR`»). Версионируйте `ref: v1.2.0`, не `main`. Hidden job `.docker-build` + `extends` в сервисах.

### 19. Что такое hidden job?

Имя job начинается с **`.`** (например `.docker-build`) — GitLab **не создаёт** executable job в pipeline; объект только для `extends` / `!reference`. Позволяет DRY без «пустых» jobs в graph.

---

## Terraform CI

### 20. Зачем `terraform plan` artifact и apply из `plan.cache`?

**Plan** на MR фиксирует точный diff инфраструктуры для human review; `plan -out=plan.cache` — бинарный план. **Apply** на protected `main` использует **тот же** plan file из artifact — apply соответствует reviewed diff. В MR: `terraform init -backend=false` — не писать в remote state. Apply — **manual**, не на каждый push. `terraform fmt -check` в CI; `TF_IN_AUTOMATION=true`. Код: [`image-pipeline`](../aws-terraform/projects/image-pipeline/).

---

## Сводная таблица «вопрос → одна фраза»

| Тема | Фраза |
|------|-------|
| needs | ускоряет DAG, не ждёт весь stage |
| workflow:rules | не создавать лишние pipelines |
| CI_COMMIT_SHA | immutable тег образа |
| imagePullSecrets | pull из приватного GitLab Registry |
| staging / prod | auto vs manual + разные namespace |
| include | DRY для CI, pin ref tag |
| plan.cache | reviewed plan = тот же apply |

---

## Как готовиться

1. Пройдите [13-final-project.md](13-final-project.md) — ответы станут из опыта, не из памяти.
2. Откройте pipeline graph в GitLab и **объясните вслух** каждую стрелку `needs`.
3. Покажите Environments UI после staging + manual prod deploy.
4. Прочитайте [interview-cheatsheet.md](interview-cheatsheet.md) **без** открытых глав курса.
5. Повторите self-check из cheatsheet; затем сверьтесь с ответами выше.

---

**Курс завершён.** [13-final-project.md](13-final-project.md) → [interview-cheatsheet.md](interview-cheatsheet.md) → [`gitlab-advanced`](../gitlab-advanced/README.md).
