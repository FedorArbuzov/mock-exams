# 10. Лаба: kubernetes executor (опционально)

## Сценарий с работы

On-call: «Job висит pending 20 минут — runner online?» Platform engineer открывает `kubectl get pods -n gitlab-runner` и видит job pod. Эта лаба учит тому же.

После миграции на K8s executor команда заметила: старые Docker runner jobs всё ещё выполняются — забыли `tags` на job. Вы исправите это в задании 4.

---

## Цель лабораторной

Установить **gitlab-runner** Helm chart с Kubernetes executor, зарегистрировать runner в GitLab CE, выполнить test job с pod в `gitlab-runner` namespace. Задать CPU/memory limits.

**Время:** ~120 минут.  
**Предварительно:** [09-runners-kubernetes.md](09-runners-kubernetes.md), `mockctl up`, Helm.

**Fallback:** architecture doc в README если chart не ставится.

---

## Предварительно

```bash
mockctl up
kubectl create namespace gitlab-runner
helm version
```

GitLab CE — [00-environment.md](00-environment.md).

---

## Задание 1. Registration token

GitLab → Admin → CI/CD → Runners → **New instance runner**:

- Tags: `k8s`, `gitlab-runner`
- Run untagged jobs: Off

---

## Задание 2. runner-values.yaml

```yaml
gitlabUrl: http://host.docker.internal:8929
runnerRegistrationToken: "glrt-XXXXXXXX"
rbac:
  create: true
runners:
  tags: "k8s,gitlab-runner"
  runUntagged: false
  config: |
    [[runners]]
      [runners.kubernetes]
        namespace = "gitlab-runner"
        image = "alpine:3.20"
        cpu_limit = "1"
        memory_limit = "1Gi"
        cpu_request = "100m"
        memory_request = "128Mi"
        poll_timeout = 600
```

**Сеть:** подберите `gitlabUrl` тестом `wget` из debug pod.

---

## Задание 3. Helm install

```bash
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install gitlab-runner gitlab/gitlab-runner \
  -n gitlab-runner -f runner-values.yaml
kubectl get pods -n gitlab-runner
```

UI: runner **online**.

---

## Задание 4. Test job

```yaml
k8s-test:
  stage: test
  tags: [k8s]
  image: alpine:3.20
  script:
    - echo "Runner pod hostname:"
    - hostname
    - echo "Cluster DNS:"
    - cat /etc/resolv.conf
    - sleep 30
```

Во время `sleep`:

```bash
kubectl get pods -n gitlab-runner -w
```

Pod `runner-...-concurrent-...` Running → Deleted.

---

## Задание 5. Limits verification (опционально)

```yaml
oom-demo:
  tags: [k8s]
  image: alpine
  script:
    - apk add stress-ng
    - stress-ng --vm 1 --vm-bytes 2G --timeout 10s || true
```

При `memory_limit = 1Gi` → **OOMKilled**. Удалите job после демо.

---

## Задание 6. ResourceQuota (опционально)

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ci-quota
  namespace: gitlab-runner
spec:
  hard:
    pods: "20"
    requests.cpu: "10"
    requests.memory: 20Gi
```

---

## Задание 7. DinD build на K8s runner (опционально)

```yaml
docker-build-k8s:
  tags: [k8s]
  image: docker:24
  services: [docker:24-dind]
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker info
```

Требует `privileged = true` в runner config — документируйте trade-off.

---

## Трек documentation (fallback)

`docs/k8s-runner-architecture.md`:

1. Диаграмма GitLab → manager → job pod
2. Фрагмент `runner-values.yaml`
3. Сравнение с Docker executor
4. Риски `privileged` для DinD
5. Когда мигрировать

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Runner offline | `gitlabUrl`, firewall |
| Job stuck pending | Tags mismatch |
| `Forbidden` create pod | RBAC |
| Cannot pull image | imagePullSecrets |

```bash
kubectl logs -n gitlab-runner -l app=gitlab-runner -f
```

---

## Критерии успеха

- [ ] Job `k8s-test` с тегом `k8s`
- [ ] Pod виден во время job
- [ ] Pod удалён после job
- [ ] limits в values.yaml
- [ ] README/docs описывает GitLab URL

---

## Связь с reliability

Runner starvation — [13-pipeline-reliability.md](13-pipeline-reliability.md). `interruptible` экономит job pods.

---

## Резюме

K8s runner = pod-per-job с изоляцией и limits. Tags обязательны для routing. Следующий урок: [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md).
