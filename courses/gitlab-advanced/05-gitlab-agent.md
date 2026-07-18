# 05. GitLab Agent for Kubernetes

## Сценарий с работы

Audit находит `KUBECONFIG` в GitLab CI variable с правами `cluster-admin`, rotation не делали 18 месяцев. Incident response: «Кто последний использовал kubeconfig в job log?» Ответа нет — credential shared на все pipelines. **GitLab Agent** — архитектурный ответ platform-команды.

В [`gitlab-intermediate`](../gitlab-intermediate/README.md) вы деплоили через `KUBECONFIG` в protected variable. Это работает в учебном стенде, но в production создаёт проблемы:

- **Long-lived credential** с широкими правами
- Утечка через job log, artifact, malicious MR
- Ротация — ручная боль
- Inbound доступ runner → API server через firewall

Теория K8s access: [appsec-fundamentals/06-kubernetes-misconfig](../appsec-fundamentals/06-kubernetes-misconfig.md).

---

## Что вы узнаете

- Архитектуру GitLab Agent (KAS, outbound tunnel).
- Настройку `ci_access` и CI job с `environment.kubernetes.agent`.
- Сравнение Agent vs kubeconfig vs Argo CD.
- RBAC и безопасность registration token.

---

## Архитектура

```text
┌─────────────┐     outbound      ┌──────────────┐
│  GitLab     │◄──────────────────│ gitlab-agent │
│  (KAS)      │     WSS/gRPC      │  pod in K8s  │
└──────┬──────┘                   └──────┬───────┘
       │                                 │
       │ CI job: kubectl via agent       │ in-cluster
       ▼                                 ▼
┌─────────────┐                   ┌──────────────┐
│ GitLab      │                   │ Kubernetes   │
│ Runner      │                   │ API Server   │
└─────────────┘                   └──────────────┘
```

| Компонент | Роль |
|-----------|------|
| **KAS** (Kubernetes Agent Server) | Мост GitLab ↔ agent |
| **Agent pod** | Tunnel, операции в кластере |
| **Agent configuration** | RBAC, `ci_access` в `.gitlab/agents/` |
| **CI job** | `environment:kubernetes:agent` — GitLab выдаёт контекст |

**Outbound-only:** agent pod инициирует соединение к GitLab. Не нужно открывать API server в интернет для CI.

---

## Зачем Agent platform-команде

1. **Нет kubeconfig в CI variables** — меньше blast radius
2. **Outbound-only** — не открывать API server в интернет
3. **Несколько environments** из одного agent config
4. **Audit** — операции через GitLab, привязка к project/job

Agent **не заменяет GitOps**: для CD — Argo CD ([11-gitlab-and-argocd.md](11-gitlab-and-argocd.md)). Agent уместен для:

- Учебного deploy из CI
- Review apps
- `kubectl debug` jobs с ограниченным RBAC

---

## Компоненты в репозитории

```text
.gitlab/agents/mockctl/
└── config.yaml
```

```yaml
ci_access:
  projects:
    - id: platform/hello-ci-advanced
      default_namespace: hello-ci
```

`id` — путь проекта GitLab. `default_namespace` — куда деплоить по умолчанию.

---

## Установка agent (outline)

1. **GitLab UI:** Infrastructure → Kubernetes clusters → Connect a cluster (agent)
2. Имя agent: `mockctl`
3. Registration token
4. **Helm:**

```bash
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install gitlab-agent gitlab/gitlab-agent \
  --namespace gitlab-agent \
  --create-namespace \
  --set config.token=<TOKEN> \
  --set config.kasAddress=wss://gitlab.example.com/-/kubernetes-agent/
```

5. `kubectl get pods -n gitlab-agent`

Подробнее: [00-environment.md](00-environment.md), [06-lab-agent.md](06-lab-agent.md).

---

## CI job с agent

```yaml
deploy-review:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    kubernetes:
      agent: platform/hello-ci-advanced:mockctl
  script:
    - kubectl apply -f k8s/
    - kubectl rollout status deployment/hello-ci -n hello-ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

Ключевое: `environment.kubernetes.agent` — путь `project:agent-name`. GitLab injects credentials — **не** храните kubeconfig.

---

## Agent vs kubeconfig в CI

| Критерий | Kubeconfig variable | GitLab Agent |
|----------|---------------------|--------------|
| Срок жизни cred | долгий | session / scoped |
| Направление сети | runner → API | agent → GitLab (outbound) |
| Ротация | ручная | token reinstall |
| CE / licensing | всегда | agent в CE *(проверьте версию)* |
| GitOps CD | антипаттерн с Argo | CI ops only |

В [15-final-project.md](15-final-project.md): Agent **или** doc «целевое vs учебное».

---

## RBAC agent в кластере

Principle of least privilege:

- Отдельный Role на `hello-ci`, не `cluster-admin`
- Production deploy — через Argo, не CI kubectl

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: gitlab-agent-deploy
  namespace: hello-ci
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: edit
subjects:
  - kind: ServiceAccount
    name: gitlab-agent
    namespace: gitlab-agent
```

---

## Связь с GitOps

**Антипаттерн:** `kubectl apply` из CI **и** Argo CD на те же manifests → drift, OutOfSync.

**Рекомендация mock-exams:**

- Фаза 2 (Agent): учебный deploy для понимания механики
- Фаза 4: убрать `kubectl` из CI, только bump gitops

См. [gitops-intermediate/09-split-ci-cd](../gitops-intermediate/09-split-ci-cd.md).

---

## Мониторинг и troubleshooting

| Симптом | Проверка |
|---------|----------|
| Agent disconnected | `kubectl logs -n gitlab-agent`, KAS URL |
| CI: agent not found | Путь `project:agent` |
| Permission denied | RBAC Role, namespace в config |
| Works locally, not CI | Runner tags, network to KAS |

---

## Безопасность

- Registration token — **one-time**, не в Git
- Ограничьте `ci_access.projects`
- Protected environments для production
- MR from fork — не давать deploy jobs

Связь: [secrets-basic](../secrets-basic/README.md).

---

## Самопроверка

1. Где физически работает agent pod?
2. Почему outbound проще для corporate firewall?
3. Как CI получает доступ без kubeconfig?
4. Когда Agent, когда Argo CD?
5. Почему `cluster-admin` для agent — плохая идея?

---

## Резюме

GitLab Agent убирает long-lived kubeconfig из pipeline. Для production CD — GitOps; Agent — scoped CI operations. Практика: [06-lab-agent.md](06-lab-agent.md).
