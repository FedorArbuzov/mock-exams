# 00. Окружение: security lab, Agent, Argo CD, OIDC

## Сценарий с работы

Понедельник, 10:00. Security открывает MR в platform repo: «Почему в pipeline нет SAST? И почему deploy job тащит `KUBECONFIG` в variable?» Вы открываете `.gitlab-ci.yml` — есть `docker build` и `kubectl apply`, но нет security stage. Второй тикет: «Argo показывает OutOfSync, а CI вчера уже "задеплоил"» — классический **double truth**: и GitLab CI, и Argo CD меняют кластер.

Третий вопрос от FinOps: «В variables лежат `AWS_SECRET_ACCESS_KEY` с rotation раз в год» — антипаттерн, который курс закрывает через **OIDC**.

Этот урок фиксирует **единое окружение** для всех лаб gitlab-advanced. Без него каждая лаба будет «чинить» GitLab или кластер заново.

---

## Что вы настроите

| Компонент | Зачем на курсе | Урок |
|-----------|----------------|------|
| GitLab CE + Docker runner | CI: build, scan, bump gitops | [01](01-security-scanning.md)–[04](04-lab-container-scan.md) |
| `mockctl up` | Целевой Kubernetes для Agent / Argo | [05](05-gitlab-agent.md)–[12](12-lab-split-ci-cd.md) |
| Argo CD (namespace `argocd`) | Фаза 4: CD только из git | [11](11-gitlab-and-argocd.md) |
| (опционально) AWS dev-account | Фаза 2: OIDC lab 08 | [07](07-oidc-cloud.md) |
| Шаблон security pipeline | DRY для SAST + Trivy | [templates/security-pipeline.yml](templates/security-pipeline.yml) |

---

## Предварительные курсы (чек-лист)

- [ ] [`gitlab-intermediate`](../gitlab-intermediate/README.md) — pipeline с build/push и deploy завершён
- [ ] [`kuber-advanced`](../kuber-advanced/README.md) фаза 3 — [16-argocd.md](../kuber-advanced/16-argocd.md), [17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md)
- [ ] [`appsec-fundamentals`](../appsec-fundamentals/README.md) гл. 01, 07–08 — DevSecOps и атаки на CI
- [ ] [`aws-advanced`](../aws-advanced/README.md) — OIDC trust policy ([06-lab-oidc-ci.md](../aws-advanced/06-lab-oidc-ci.md))

---

## GitLab CE: security lab

Стенд: [`deploy/gitlab`](../../deploy/gitlab/README.md).

```bash
cd deploy/gitlab
docker compose up -d
docker exec mock-gitlab gitlab-ctl status   # дождаться run:
```

| Параметр | Типичное значение |
|----------|-------------------|
| URL | `http://localhost:8929` |
| Runner | Docker executor, `privileged: true` для `docker build` |
| Registry | Встроенный Container Registry проекта |
| Root password | см. `deploy/gitlab/README.md` |

**Проверка security readiness:**

1. Group `platform`, project `hello-ci-advanced` (или pet-project из intermediate).
2. Pipeline с `docker build` — образ в Registry.
3. Settings → CI/CD → Variables: **не** добавляйте AWS keys «на будущее».
4. Settings → Merge requests → «Pipelines must succeed» — включите заранее.

### Security templates в CE

В CE набор [security templates](https://docs.gitlab.com/ee/user/application_security/) может отличаться от Ultimate. См. [01-security-scanning.md](01-security-scanning.md) — таблица CE vs Ultimate и fallback (`pip-audit`, `trivy fs`, gitleaks).

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
```

Если template недоступен — open-source jobs из лабы 02.

### Рекомендуемая структура group

```text
platform/
├── hello-ci-advanced/     # app repo, CI pipeline
├── gitops/                # manifests для Argo CD (фаза 4)
└── infra-terraform/       # optional, OIDC lab 08
```

Скопируйте шаблон security pipeline **до** первой лабы:

```bash
mkdir -p .gitlab/ci
cp courses/gitlab-advanced/templates/security-pipeline.yml .gitlab/ci/security-pipeline.yml
```

---

## Kubernetes: mockctl

```bash
mockctl up
kubectl get nodes
kubectl create namespace gitlab-agent
kubectl create namespace gitlab-runner
kubectl create namespace argocd
kubectl create namespace hello-ci
```

Кластер нужен для: **GitLab Agent** (фаза 2), **Kubernetes runner** (фаза 3), **Argo CD** (фаза 4).

**Сеть GitLab ↔ кластер:** GitLab в Docker, mockctl на хосте — Helm URL может быть `https://host.docker.internal:6443`. См. [`mockctl`](../../mockctl/README.md).

| Namespace | Назначение |
|-----------|------------|
| `gitlab-agent` | Pod GitLab Agent |
| `gitlab-runner` | Runner manager + job pods |
| `argocd` | Argo CD control plane |
| `hello-ci` | Учебное приложение |

---

## GitLab Agent: prerequisites

Теория: [05-gitlab-agent.md](05-gitlab-agent.md). Чек-лист **до** лабы 06:

| Шаг | Действие |
|-----|----------|
| 1 | Operate → Kubernetes → Connect cluster (agent) |
| 2 | Файл `.gitlab/agents/mockctl/config.yaml` в app repo |
| 3 | Registration token agent (one-time) |
| 4 | `helm repo add gitlab https://charts.gitlab.io` |
| 5 | `helm upgrade --install gitlab-agent gitlab/gitlab-agent -n gitlab-agent -f agent-values.yaml` |

```yaml
# .gitlab/agents/mockctl/config.yaml
ci_access:
  projects:
    - id: platform/hello-ci-advanced
      default_namespace: hello-ci
```

```yaml
# agent-values.yaml (учебный)
config:
  kasAddress: wss://localhost:8929/-/kubernetes-agent/
  token: <AGENT_TOKEN>
```

Self-hosted: замените `kasAddress` на ваш хост.

**Проверка подключения:**

```bash
kubectl get pods -n gitlab-agent
# GitLab UI → Infrastructure → Kubernetes clusters → Connected
```

**Fallback в CE:** protected variable `KUBECONFIG` (из intermediate) + обязательная таблица «целевая архитектура vs учебный shortcut» в `docs/agent-vs-kubeconfig.md`.

---

## Argo CD в mockctl

Установка: [kuber-advanced/17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md), [`deploy/gitops`](../../deploy/gitops/README.md).

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deploy/argocd-server -n argocd --timeout=300s
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080  user: admin
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d && echo
```

**Для фазы 4:** gitops repo, Application `hello-ci` с `automated.syncPolicy` ([11-gitlab-and-argocd.md](11-gitlab-and-argocd.md)).

**Принцип:** CI **не** вызывает `kubectl apply` на production manifests — только commit с новым image tag.

```text
App repo (CI) ──build/push──► Registry
         │ bump tag
         ▼
GitOps repo ──watch──► Argo CD ──sync──► hello-ci namespace
```

---

## OIDC: обзор (GitLab → AWS)

Теория: [07-oidc-cloud.md](07-oidc-cloud.md). Кратко:

```text
GitLab job → id_tokens (JWT) → AWS STS AssumeRoleWithWebIdentity
    → temp credentials (~1 ч) → aws cli / terraform plan
```

| Элемент | Где настраивается |
|---------|-------------------|
| OIDC provider | AWS IAM → Identity providers |
| Trust policy | IAM Role → `gitlab.com:sub` = `project_path:...` |
| Job | `.gitlab-ci.yml` → `id_tokens: AWS_ID_TOKEN` |

Self-hosted GitLab: свой issuer URL в trust policy. Лаба 08 **опциональна** без AWS — `docs/oidc-aws.md` по образцу [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

**Fork MR:** не выдавайте OIDC role на unprotected branches; используйте `rules:` и protected environments.

Связь с [appsec-fundamentals/04-secrets-credentials](../appsec-fundamentals/04-secrets-credentials.md): masked variable ≠ безопасность от malicious maintainer.

---

## Структура pet-проекта

```text
hello-ci-advanced/
├── .gitlab-ci.yml
├── .gitlab/ci/security-pipeline.yml
├── .gitlab/agents/mockctl/config.yaml
├── Dockerfile
├── src/
├── k8s/              # только Agent-трек; не Argo path
└── docs/
    ├── oidc-aws.md
    ├── agent-vs-kubeconfig.md
    └── ci-runbook.md
```

---

## Типичные проблемы

| Симптом | Проверка |
|---------|----------|
| SAST template not found | Версия CE; fallback лаба 02 |
| `docker build` 403 Registry | `docker login`, CI job token |
| Agent не подключается | `kasAddress`, firewall outbound, token |
| Argo OutOfSync | CI и Argo оба меняют manifests — оставьте один CD |
| OIDC `Not authorized` | `sub` в trust policy, `aud` в job |
| Runner не видит GitLab | `host.docker.internal` vs IP хоста |

---

## Самопроверка

1. Pipeline с stage `security` запускается на MR?
2. `kubectl get pods -n argocd` — Argo CD Running?
3. Где в проекте **не** должно быть plaintext секретов?
4. Кто владеет desired state кластера после фазы 4 — GitLab CI или git?
5. Чем OIDC отличается от protected AWS variable?

---

## Резюме

Единое окружение: GitLab CE + mockctl + (опционально) Argo CD + шаблон security. Agent и OIDC убирают long-lived credentials. Argo CD — единственный CD после фазы 4.

Следующий урок: [01-security-scanning.md](01-security-scanning.md).
