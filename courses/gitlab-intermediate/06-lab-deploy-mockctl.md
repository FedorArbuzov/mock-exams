# 06. Лаба: deploy в mockctl

## Сценарий с работы

Build без deploy — половина value stream. Команда хочет **работающую версию** по SHA в кластере после merge. Лаба замыкает цикл: registry → Deployment → Service → `curl` через port-forward. Стенд — minikube профиль `mock-exams` через [`mockctl`](../../mockctl/README.md); GitLab и registry — [`deploy/gitlab`](../../deploy/gitlab/README.md).

**Предусловия:** [04-lab-build-push.md](04-lab-build-push.md), [05-deploy-kubernetes.md](05-deploy-kubernetes.md), `mockctl up`, образ в registry.

## Что вы сделаете

- Сохраните kubeconfig в GitLab CI variable (File, protected).
- Создадите `imagePullSecrets` в namespace `hello-ci`.
- Добавите job `deploy` с `envsubst` и `rollout status`.
- Проверите приложение и выполните rollback.

---

## Подготовка на хосте

```bash
cd /path/to/mock-exams
mockctl up
mockctl status

export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"
kubectl create namespace hello-ci --dry-run=client -o yaml | kubectl apply -f -
kubectl get ns hello-ci
```

Если `connection refused` — `mockctl kubeconfig` и повторите `kubectl get nodes`.

Kubeconfig в GitLab:

1. `cat output/kubeconfig.yaml`
2. **Settings → CI/CD → Variables → Add**
   - Key: `KUBECONFIG`, Type: **File**, **Protected**, **Masked** (если доступно)
3. Protect branch `main` — иначе protected variable не попадёт в job.

**Не коммитьте** kubeconfig в Git. После каждого `mockctl down` / `up` обновляйте variable.

---

## Задание 1. Манифесты

В репозитории [`k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml) с `${IMAGE}` и `imagePullSecrets: gitlab-reg` (см. [05-deploy-kubernetes.md](05-deploy-kubernetes.md)).

Локальная проверка:

```bash
export IMAGE="localhost:8929/root/hello-ci:YOUR_SHA"
envsubst < k8s/deployment.yaml | kubectl apply -n hello-ci --dry-run=client -f -
```

`envsubst` подставляет `$IMAGE` — в CI то же самое с `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`.

---

## Задание 2. Job deploy

```yaml
stages:
  - validate
  - test
  - build
  - deploy

deploy-mockctl:
  stage: deploy
  needs: [docker-build]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  tags: [docker]
  variables:
    K8S_NAMESPACE: hello-ci
  script:
    - kubectl get nodes
    - |
      kubectl create secret docker-registry gitlab-reg \
        --docker-server="$CI_REGISTRY" \
        --docker-username="$CI_REGISTRY_USER" \
        --docker-password="$CI_REGISTRY_PASSWORD" \
        -n "$K8S_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
    - kubectl rollout status deployment/hello-ci -n "$K8S_NAMESPACE" --timeout=180s
    - kubectl get pods -n "$K8S_NAMESPACE" -o wide
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

**Локальный стенд — важное ограничение:** runner в Docker может не достучаться до minikube API (`127.0.0.1` в kubeconfig). Варианты:

| Вариант | Когда |
|---------|-------|
| (a) Shell runner на хосте | надёжнее для учебного стенда |
| (b) `network_mode = "host"` в runner config | Linux |
| (c) server URL на IP minikube | `minikube ip -p mock-exams` в kubeconfig |

Зафиксируйте выбранный вариант в README проекта.

**Ожидаемый результат:** job green, `deployment "hello-ci" successfully rolled out`.

---

## Задание 3. Проверка приложения

```bash
kubectl get pods -n hello-ci
kubectl describe pod -n hello-ci -l app=hello-ci | grep -A2 "Image:"

kubectl port-forward -n hello-ci svc/hello-ci 8080:80
curl -s http://localhost:8080/ | head -5
```

Image в describe = `$CI_COMMIT_SHA` последнего deploy. Если `ImagePullBackOff` — см. раздел ошибок.

---

## Задание 4. Rollback

Измените `app/index.html`, pipeline, deploy. Затем:

```bash
kubectl rollout history deployment/hello-ci -n hello-ci
kubectl rollout undo deployment/hello-ci -n hello-ci
kubectl rollout status deployment/hello-ci -n hello-ci
```

Альтернатива: redeploy предыдущего SHA из registry (immutable tags). Добавьте раздел **Rollback** в README.

---

## Задание 5. (Бонус) Helm

По [kuber-intermediate/08-lab-helm](../kuber-intermediate/08-lab-helm.md) — `helm upgrade --install` вместо `envsubst`:

```yaml
deploy-helm:
  image: alpine/helm:3.14
  script:
    - helm upgrade --install hello-ci ./chart \
        --namespace hello-ci --create-namespace \
        --set image.repository="$CI_REGISTRY_IMAGE" \
        --set image.tag="$CI_COMMIT_SHA" \
        --wait
```

Values per environment — [08-lab-environments.md](08-lab-environments.md).

---

## Что пошло не так

### `Unable to connect to the server`

**Причина:** kubeconfig указывает `127.0.0.1` — внутри контейнера runner это не minikube.

**Решение:** host runner; обновить server в kubeconfig на IP minikube; `mockctl kubeconfig`.

### ImagePullBackOff

**Причина:** secret отсутствует, неверный `docker-server`, или образ не запушен.

**Решение:** `kubectl describe pod` → Events; проверить registry и SHA.

### Rollout timeout

**Причина:** образ не существует; crash loop; probe fail.

**Решение:** `kubectl logs deployment/hello-ci -n hello-ci`; проверить registry.

### Deploy не на MR

**Ожидаемо** при `rules: main only` — MR только build, не deploy.

### `envsubst: command not found`

**Решение:** `apk add --no-cache gettext` в `before_script` (образ bitnami/kubectl на alpine base).

---

## Резюме

- Полный цикл: build → push → deploy в [`mockctl`](../../mockctl/README.md).
- Kubeconfig в protected File variable; secret для pull из [`deploy/gitlab`](../../deploy/gitlab/README.md) registry.

---

## Критерии успеха

- [ ] Deploy green после `docker-build` на `main`
- [ ] Pod `Running`, image = `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`
- [ ] `curl` через port-forward отдаёт HTML
- [ ] `kubectl rollout undo` работает
- [ ] Kubeconfig только в CI variable
- [ ] README: rollback и ограничения runner→API

---

## Связи

| Дальше | Содержание |
|--------|------------|
| [07-environments.md](07-environments.md) | staging / production |
| [08-lab-environments.md](08-lab-environments.md) | два namespace |
| [13-final-project.md](13-final-project.md) | полный pipeline |

Следующий урок: [07-environments.md](07-environments.md).
