# 05. Deploy в Kubernetes из CI

## Сценарий с работы

Образ в registry — зелёный build. Deploy падает: `error: You must be logged in to the server (Unauthorized)`. Kubeconfig в CI variable протух после `mockctl up`. Починили. Следующий релиз: Pod `Running`, но **старая версия** — в манифесте `:latest`, а не SHA. Третий кейс: `ImagePullBackOff` — кластер не тянет приватный `localhost:8929`. Четвёртый вопрос на review: «почему CI пушит в кластер, а не Argo CD?» — для intermediate: **imperative deploy**; GitOps — [`gitlab-advanced`](../gitlab-advanced/README.md).

Теория связывает [04-lab-build-push.md](04-lab-build-push.md) с [`kuber-basic/10-deployment.md`](../kuber-basic/10-deployment.md) и [`mockctl`](../../mockctl/README.md).

## Что вы узнаете

- Паттерны deploy: **kubectl**, **Helm**, GitOps (обзор).
- Как передать **kubeconfig** в job безопасно.
- **Namespace per branch** для review apps.
- **imagePullSecrets** для GitLab Registry.
- Rollout и откат с точки зрения CI.

---

## Паттерны доставки в Kubernetes

| Способ | Плюсы | Минусы | Курс |
|--------|-------|--------|------|
| `kubectl apply -f` | просто, прозрачно | нет шаблонов, drift | лаба 06 |
| `helm upgrade --install` | values per env, releases | learning curve | [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) |
| GitOps (Argo CD, Flux) | desired state в Git, audit | CI только build | advanced |

```text
CI pipeline                    Kubernetes (mockctl)
─────────────                  ───────────────────
docker-build ──push──▶ Registry ──pull──▶ Pod
                              ▲
deploy job ──kubectl/helm─────┘
```

---

## Kubeconfig в CI

### File variable (учебный стенд)

1. На хосте: `mockctl kubeconfig` → `output/kubeconfig.yaml`.
2. GitLab: **Settings → CI/CD → Variables**.
3. Key: `KUBECONFIG`, Type: **File**, **Protected**.

```yaml
deploy:
  stage: deploy
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  tags: [docker]
  script:
    - kubectl config get-contexts
    - kubectl get nodes
```

**Почему protected:** только protected branches получают variable — снижает утечку на feature MR.

### Альтернативы (справка)

| Метод | Когда |
|-------|-------|
| Service account token | cloud EKS/GKE с IAM |
| GitLab Agent for Kubernetes | tunnel без публичного API |
| `KUBE_TOKEN` + `KUBE_URL` | legacy in-cluster |

Для `mockctl` — File variable; обновляйте после `mockctl down` / `up`.

---

## Job deploy с манифестами

Манифест [`examples/k8s-deploy/k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-ci
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
      imagePullSecrets:
        - name: gitlab-reg
      containers:
        - name: app
          image: ${IMAGE}
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: hello-ci
spec:
  selector:
    app: hello-ci
  ports:
    - port: 80
      targetPort: 8080
```

Подстановка в CI:

```yaml
deploy:
  stage: deploy
  needs: [docker-build]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  script:
    - apk add --no-cache gettext
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -n hello-ci -f -
    - kubectl rollout status deployment/hello-ci -n hello-ci --timeout=120s
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

`rollout status` — job красный, если Pod не стал Ready.

---

## Helm из CI (кратко)

По [kuber-intermediate/08-lab-helm](../kuber-intermediate/08-lab-helm.md):

```yaml
deploy-helm:
  image: alpine/helm:3.14
  script:
    - |
      helm upgrade --install hello-ci ./chart \
        --namespace hello-ci --create-namespace \
        --set image.repository="$CI_REGISTRY_IMAGE" \
        --set image.tag="$CI_COMMIT_SHA" \
        --wait
```

Values per environment — [08-lab-environments.md](08-lab-environments.md).

---

## Namespace per branch (review)

```yaml
variables:
  K8S_NAMESPACE: review-$CI_COMMIT_REF_SLUG
script:
  - kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
  - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
```

Ограничение slug — 63 символа DNS. Cleanup — `on_stop` ([07-environments.md](07-environments.md)).

---

## imagePullSecrets

```bash
kubectl create secret docker-registry gitlab-reg \
  --docker-server="$CI_REGISTRY" \
  --docker-username="$CI_REGISTRY_USER" \
  --docker-password="$CI_REGISTRY_PASSWORD" \
  -n hello-ci
```

В CI (idempotent):

```yaml
  script:
    - |
      kubectl create secret docker-registry gitlab-reg \
        --docker-server="$CI_REGISTRY" \
        --docker-username="$CI_REGISTRY_USER" \
        --docker-password="$CI_REGISTRY_PASSWORD" \
        -n hello-ci \
        --dry-run=client -o yaml | kubectl apply -f -
```

---

## Rollback

```bash
kubectl rollout undo deployment/hello-ci -n hello-ci
```

Или redeploy предыдущего SHA из registry (immutable tags).

---

## Типичные ошибки

**Unauthorized к API.** Устаревший kubeconfig; API minikube недоступен из контейнера runner.

**Образ не тот.** Hardcode `:latest`; забыли `envsubst`.

**ImagePullBackOff.** Нет `imagePullSecrets`; неверный `docker-server`.

**Deploy на каждый MR в prod namespace.** Нет `rules` / environments.

**Kubeconfig в Git.** Только CI File variable.

---

## Резюме

- CI deploy = kubectl/helm после build; kubeconfig protected; образ по SHA.
- Registry приватен — нужен `imagePullSecrets`.
- Helm и GitOps — следующие уровни зрелости.

---

## Связи

| Материал | Связь |
|----------|-------|
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | пошаговая лаба |
| [07-environments.md](07-environments.md) | staging vs production |
| [`mockctl`](../../mockctl/README.md) | kubeconfig |
| [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) | Helm deploy |

---

## Чек-лист

- [ ] Сравниваете kubectl vs Helm vs GitOps
- [ ] Знаете, зачем kubeconfig **protected**
- [ ] Понимаете `imagePullSecrets`
- [ ] Связываете deploy с `needs: [docker-build]`
- [ ] Знаете `kubectl rollout status/undo`

Следующий урок: [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md).
