# 10. Lab: kubernetes executor (optional)

## Real-world scenario

On-call: "The job has been pending for 20 minutes — is the runner online?" A platform engineer opens `kubectl get pods -n gitlab-runner` and sees the job pod. This lab teaches the same thing.

After migrating to the K8s executor, the team noticed: old Docker runner jobs are still running — they forgot `tags` on the job. You'll fix this in task 4.

---

## Lab goal

Install the **gitlab-runner** Helm chart with the Kubernetes executor, register the runner in GitLab CE, run a test job with a pod in the `gitlab-runner` namespace. Set CPU/memory limits.

**Time:** ~120 minutes.  
**Prerequisites:** [09-runners-kubernetes.md](09-runners-kubernetes.md), `mockctl up`, Helm.

**Fallback:** an architecture doc in the README if the chart can't be installed.

---

## Prerequisites

```bash
mockctl up
kubectl create namespace gitlab-runner
helm version
```

GitLab CE — [00-environment.md](00-environment.md).

---

## Task 1. Registration token

GitLab → Admin → CI/CD → Runners → **New instance runner**:

- Tags: `k8s`, `gitlab-runner`
- Run untagged jobs: Off

---

## Task 2. runner-values.yaml

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

**Networking:** pick the right `gitlabUrl` by testing with `wget` from a debug pod.

---

## Task 3. Helm install

```bash
helm repo add gitlab https://charts.gitlab.io
helm upgrade --install gitlab-runner gitlab/gitlab-runner \
  -n gitlab-runner -f runner-values.yaml
kubectl get pods -n gitlab-runner
```

UI: runner **online**.

---

## Task 4. Test job

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

During `sleep`:

```bash
kubectl get pods -n gitlab-runner -w
```

Pod `runner-...-concurrent-...` Running → Deleted.

---

## Task 5. Limits verification (optional)

```yaml
oom-demo:
  tags: [k8s]
  image: alpine
  script:
    - apk add stress-ng
    - stress-ng --vm 1 --vm-bytes 2G --timeout 10s || true
```

With `memory_limit = 1Gi` → **OOMKilled**. Delete the job after the demo.

---

## Task 6. ResourceQuota (optional)

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

## Task 7. DinD build on a K8s runner (optional)

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

Requires `privileged = true` in the runner config — document the trade-off.

---

## Documentation track (fallback)

`docs/k8s-runner-architecture.md`:

1. Diagram GitLab → manager → job pod
2. Fragment of `runner-values.yaml`
3. Comparison with the Docker executor
4. Risks of `privileged` for DinD
5. When to migrate

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| Runner offline | `gitlabUrl`, firewall |
| Job stuck pending | Tags mismatch |
| `Forbidden` create pod | RBAC |
| Cannot pull image | imagePullSecrets |

```bash
kubectl logs -n gitlab-runner -l app=gitlab-runner -f
```

---

## Success criteria

- [ ] Job `k8s-test` with the `k8s` tag
- [ ] Pod visible during the job
- [ ] Pod deleted after the job
- [ ] limits in values.yaml
- [ ] README/docs describes the GitLab URL

---

## Relation to reliability

Runner starvation — [13-pipeline-reliability.md](13-pipeline-reliability.md). `interruptible` saves job pods.

---

## Summary

K8s runner = pod-per-job with isolation and limits. Tags are mandatory for routing. Next lesson: [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md).
