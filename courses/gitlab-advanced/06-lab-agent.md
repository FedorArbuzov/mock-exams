# 06. Лаба: GitLab Agent (или kubeconfig fallback)

## Сценарий с работы

Новый platform engineer: «Покажите, как deploy job подключается к кластеру **без** kubeconfig в Git или variables». Эта лаба — ответ через Agent или документированный fallback.

На review вчера спросили: «А что если Agent недоступен в вашей edition?» — вы должны уметь объяснить риски kubeconfig shortcut и путь миграции.

---

## Цель лабораторной

Подключить **GitLab Agent** к mockctl и выполнить deploy `hello-ci` из CI без kubeconfig в Git. Если Agent недоступен — `docs/agent-vs-kubeconfig.md` с таблицей рисков и protected `KUBECONFIG` как учебный shortcut.

**Время:** ~120 минут.  
**Предварительно:** [05-gitlab-agent.md](05-gitlab-agent.md), [00-environment.md](00-environment.md), Helm, `mockctl up`.

---

## Выбор трека

| Трек | Когда |
|------|-------|
| **A — Agent** | GitLab с Kubernetes Agent, token и KAS |
| **B — Fallback** | Agent не ставится; KUBECONFIG variable |

Оба трека сдают **диаграмму** и deploy pod `Running`.

---

## Трек A: GitLab Agent

### Шаг 1. Agent configuration

```bash
mkdir -p .gitlab/agents/mockctl
```

`.gitlab/agents/mockctl/config.yaml`:

```yaml
ci_access:
  projects:
    - id: platform/hello-ci-advanced
      default_namespace: hello-ci
```

Commit в default branch.

### Шаг 2. Создать agent в GitLab UI

Operate → Kubernetes → Connect a cluster (agent):

- Имя: `mockctl`
- **Agent token** (один раз)

### Шаг 3. Helm install

`agent-values.yaml`:

```yaml
config:
  token: "<AGENT_TOKEN>"
  kasAddress: "wss://<gitlab-host>/-/kubernetes-agent/"
```

```bash
kubectl create namespace gitlab-agent
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install gitlab-agent gitlab/gitlab-agent \
  -n gitlab-agent -f agent-values.yaml
kubectl get pods -n gitlab-agent -w
```

UI: agent **Connected**.

### Шаг 4. Manifests

`k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-ci
  namespace: hello-ci
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello-ci
  template:
    metadata:
      labels:
        app: hello-ci
    spec:
      containers:
        - name: app
          image: registry.example.com/platform/hello-ci:latest
          ports:
            - containerPort: 8080
```

```bash
kubectl create namespace hello-ci
```

### Шаг 5. CI job

```yaml
deploy-mockctl:
  stage: deploy
  image:
    name: bitnami/kubectl:latest
    entrypoint: [""]
  environment:
    name: staging
    kubernetes:
      agent: platform/hello-ci-advanced:mockctl
  script:
    - kubectl apply -f k8s/ -n hello-ci
    - kubectl set image deployment/hello-ci app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -n hello-ci
    - kubectl rollout status deployment/hello-ci -n hello-ci --timeout=120s
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Push → `kubectl rollout status` success.

---

## Трек B: Fallback (kubeconfig)

### Шаг 1. Документация

`docs/agent-vs-kubeconfig.md`:

| | Agent (цель) | KUBECONFIG (shortcut) |
|---|--------------|----------------------|
| Credential TTL | scoped | долгий |
| Leak surface | ниже | job env, logs |
| Firewall | outbound | inbound к API |
| Production CD | GitOps (Argo) | антипаттерн |

### Шаг 2. Protected variable

Settings → CI/CD → Variables:

- Key: `KUBECONFIG_CONTENT` (File type)
- Protected ✓

```yaml
deploy-mockctl:
  before_script:
    - mkdir -p ~/.kube
    - echo "$KUBECONFIG_CONTENT" > ~/.kube/config
  script:
    - kubectl apply -f k8s/
```

**Никогда** не коммитьте kubeconfig.

---

## Задание: диаграмма в README

```text
GitLab CI job → GitLab KAS → gitlab-agent pod → Kubernetes API → Deployment hello-ci
```

Трек B — пунктир «в production заменить на Agent».

---

## Задание: RBAC (трек A)

```bash
kubectl auth can-i create deployment \
  --as=system:serviceaccount:gitlab-agent:gitlab-agent \
  -n hello-ci
```

Создайте Role `deployer` с `apps/deployments` only при необходимости.

---

## Задание: проверка без секретов в Git

```bash
git grep -i kubeconfig
git grep -i "BEGIN CERTIFICATE"
```

Должно быть пусто. Token agent — только в Helm values локально, не в repo.

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Agent Pending | Image pull, resources |
| `agent not found` | Typo в `project:agent` |
| Wrong namespace | `default_namespace` |
| ImagePullBackOff | Registry auth |
| KAS connection refused | `kasAddress`, self-signed TLS |

---

## Подготовка к фазе 4

`docs/notes.md`:

> «Следующий шаг: убрать kubectl из CI, перейти на Argo CD bump»

---

## Критерии успеха

- [ ] Диаграмма в README
- [ ] Deploy без kubeconfig **в Git**
- [ ] `kubectl rollout status` green
- [ ] Pod `hello-ci` Running
- [ ] `docs/agent-vs-kubeconfig.md` (B) или Agent Connected (A)

---

## Вопросы для рефлексии

1. Где registration token и почему не коммитить?
2. Agent vs [secrets-basic](../secrets-basic/README.md)?
3. Почему для production CD нужен Argo?

---

## Резюме

Agent — целевая модель доступа CI к кластеру. Fallback допустим в учебном стенде с документацией рисков. Следующий урок: [07-oidc-cloud.md](07-oidc-cloud.md).
