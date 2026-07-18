# 08. Лаба: staging → production

## Сценарий с работы

Два deploy job без разделения — «мы случайно выкатили в prod». Зрелая схема: **merge в main** → staging (auto) → проверка → production (**кнопка Play**). GitLab Environments дают audit trail: кто нажал Play, какой SHA, когда. Лаба расширяет [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) на два namespace в [`mockctl`](../../mockctl/README.md).

**Предусловия:** [07-environments.md](07-environments.md), работающий deploy, `mockctl up`, образ в registry.

## Что вы сделаете

- Разделите deploy на `deploy-staging` и `deploy-production`.
- Настроите namespace `hello-ci-staging` и `hello-ci-prod`.
- Добавите environment-scoped variables `REPLICAS`.
- Проверите историю в **Operate → Environments**.

---

## Задание 1. Подготовка namespace

```bash
export KUBECONFIG=/path/to/mock-exams/output/kubeconfig.yaml
for ns in hello-ci-staging hello-ci-prod; do
  kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
done
kubectl get ns | grep hello-ci
```

Оба namespace изолированы — staging deploy не трогает prod Pods.

---

## Задание 2. Hidden template `.deploy-base`

Вынесите общую логику (подготовка к [10-lab-templates.md](10-lab-templates.md)):

```yaml
.deploy-base:
  stage: deploy
  needs: [docker-build]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  tags: [docker]
  before_script:
    - apk add --no-cache gettext
  script:
    - |
      kubectl create secret docker-registry gitlab-reg \
        --docker-server="$CI_REGISTRY" \
        --docker-username="$CI_REGISTRY_USER" \
        --docker-password="$CI_REGISTRY_PASSWORD" \
        -n "$K8S_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
    - kubectl scale deployment/hello-ci --replicas="${REPLICAS:-1}" -n "$K8S_NAMESPACE"
    - kubectl rollout status deployment/hello-ci -n "$K8S_NAMESPACE" --timeout=180s
```

`kubectl scale` демонстрирует разницу окружений: staging 1 replica, prod 3.

---

## Задание 3. Два deploy job

```yaml
deploy-staging:
  extends: .deploy-base
  environment:
    name: staging
    url: http://staging.hello-ci.local
    deployment_tier: staging
  variables:
    K8S_NAMESPACE: hello-ci-staging
    REPLICAS: "1"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  extends: .deploy-base
  environment:
    name: production
    url: http://prod.hello-ci.local
    deployment_tier: production
  variables:
    K8S_NAMESPACE: hello-ci-prod
    REPLICAS: "3"
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

**Ожидаемое поведение:**

| Job | Триггер | UI |
|-----|---------|-----|
| `deploy-staging` | auto после merge | Environments → staging, зелёный |
| `deploy-production` | **manual** Play | ждёт кнопку |

Оба job в одном stage `deploy` — staging и production **параллельны** по stage order, но production не стартует без Play.

---

## Задание 4. Variables per environment (UI)

**Settings → CI/CD → Variables:**

| Key | Value | Environment scope |
|-----|-------|-------------------|
| `REPLICAS` | `1` | `staging` |
| `REPLICAS` | `3` | `production` |

Scoped variables переопределяют job-level при совпадении `environment:name`.

Проверка после deploy:

```bash
kubectl get deployment hello-ci -n hello-ci-staging -o jsonpath='{.spec.replicas}'
# 1
kubectl get deployment hello-ci -n hello-ci-prod -o jsonpath='{.spec.replicas}'
# 3 — после manual production
```

---

## Задание 5. Protected production (опционально)

**Settings → Environments → production** — Enable **Protected**.

Только Maintainer+ может нажать Play. Связь с protected variable `KUBECONFIG` — defense in depth.

---

## Задание 6. Deployment history

1. Merge в `main`, дождитесь staging.
2. Play на production.
3. **Operate → Environments** — оба окружения, последний SHA, кто деплоил.

Скриншот для портфолио и [13-final-project.md](13-final-project.md).

---

## Задание 7. (Бонус) Smoke после staging

```yaml
smoke-staging:
  stage: deploy
  needs: [deploy-staging]
  image: curlimages/curl
  script:
    - echo "In prod: curl staging ingress; locally use port-forward"
  allow_failure: true
```

На реальном стенде — HTTP check staging URL перед manual prod.

---

## Что пошло не так

### Production задеплоился без Play

**Причина:** забыли `when: manual`.

**Решение:** явный `when: manual` на `deploy-production`.

### Одинаковые replicas

**Причина:** scope variables не задан; job variables перетёрли scope.

**Решение:** Environment scope в UI; убрать дублирующий `REPLICAS` из job если мешает.

### Manual job skipped

**Причина:** staging failed — оба в stage deploy.

**Решение:** чинить staging; или вынести production в stage `deploy-prod`.

### Namespace not found

**Решение:** `kubectl create namespace` в script или на хосте (задание 1).

### Staging и prod один namespace

**Причина:** одинаковый `K8S_NAMESPACE`.

**Решение:** разные variables per job.

---

## Резюме

- Staging auto на main; production manual с protected environment.
- Разные namespace в [`mockctl`](../../mockctl/README.md) — изоляция окружений.

---

## Критерии успеха

- [ ] Staging **auto** на pipeline `main`
- [ ] Production **manual** только с `main`
- [ ] Разные namespace и replicas (1 vs 3)
- [ ] История в Operate → Environments
- [ ] README: порядок релиза staging → prod → rollback

---

## Связи

| Дальше | Содержание |
|--------|------------|
| [09-ci-templates.md](09-ci-templates.md) | вынести `.deploy-base` в `ci/deploy-k8s.yml` |
| [13-final-project.md](13-final-project.md) | финальный pipeline |
| [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) | Helm values per env |

Следующий урок: [09-ci-templates.md](09-ci-templates.md).
