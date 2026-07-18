# GitLab Advanced — Interview Cheatsheet

Справочник **после** прохождения курса. Ответьте **без подглядывания**, затем сверьтесь здесь и в [16-interview-qa.md](16-interview-qa.md).

Курс: [README.md](README.md) | Шаблон: [templates/security-pipeline.yml](templates/security-pipeline.yml)

---

## Security scanning

| Вопрос | Ответ |
|--------|-------|
| SAST vs container scan | SAST — **код**; container — **образ** (OS packages, layers) |
| Почему scan до deploy | Дешевле fix; не пускать vulnerable artifact в cluster |
| Secret detection ищет | Паттерны keys, entropy; не заменяет vault |
| CE без Ultimate | Templates + Trivy + gitleaks/pip-audit fallback |
| `allow_failure: true` на security | Риск «зелёного» pipeline с critical |
| SBOM | Компоненты образа; compliance, incident response |
| Exception без allow_failure | Issue + TTL + `.trivyignore` с комментарием |
| SAST vs secret detection | Пересечение на hardcoded creds; secret — специализирован |
| `needs` на security | Fail-fast до дорогого docker build |

**Связь:** [appsec-fundamentals](../appsec-fundamentals/README.md) гл. 01, 05, 07–08, 12

---

## GitLab Agent

| Вопрос | Ответ |
|--------|-------|
| Зачем Agent | Нет long-lived kubeconfig в CI; outbound к GitLab |
| Где pod | Namespace кластера (`gitlab-agent`) |
| CI доступ | `environment:kubernetes:agent: project:agent-name` |
| vs kubeconfig | Agent — scoped; kubeconfig — blast radius |
| vs Argo CD | Agent — CI ops; Argo — CD desired state из git |
| Registration token | One-time; не в Git |
| KAS | Kubernetes Agent Server — мост GitLab ↔ agent |
| Outbound tunnel | Agent → GitLab; не открывать API в интернет |

**Урок:** [05-gitlab-agent.md](05-gitlab-agent.md)

---

## OIDC GitLab → AWS

| Вопрос | Ответ |
|--------|-------|
| Flow | `id_tokens` JWT → `AssumeRoleWithWebIdentity` → temp creds |
| Зачем `sub` condition | Ограничить project/ref/environment |
| `aud` | Должен совпасть trust policy и job |
| Self-hosted | Свой issuer URL в IAM |
| Fork MR риск | Широкий trust + unprotected variables |
| vs static keys | Temp TTL ~1h; нет rotation secret |
| Separate roles | plan read-only; apply manual + narrow |
| Claims JWT | `iss`, `sub`, `aud`, `exp` |

**Связь:** [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md), [07-oidc-cloud.md](07-oidc-cloud.md)

---

## K8s runners

| Вопрос | Ответ |
|--------|-------|
| K8s vs Docker executor | Job = **pod** vs container на host |
| Config хранится | Helm values / ConfigMap runner chart |
| RBAC runner | Право создавать pods в CI namespace |
| `privileged` | DinD; security trade-off |
| Limits | cpu/memory_limit защищают кластер |
| Tags | Job routing; без tags — wrong runner |
| ResourceQuota | Ограничить pods/CPU в `gitlab-runner` ns |
| Альтернатива DinD | Kaniko, buildkit rootless |

**Урок:** [09-runners-kubernetes.md](09-runners-kubernetes.md)

---

## GitOps split (CI ≠ CD)

| Вопрос | Ответ |
|--------|-------|
| CI ответственность | build, test, scan, push, **commit gitops** |
| CD ответственность | Argo sync, health, rollback |
| Anti-pattern | `kubectl apply` + Argo на те же manifests |
| Rollback | `git revert` gitops, не `kubectl rollout undo` |
| tag vs digest | SHA tag читаем; digest immutable |
| Image Updater | Авто bump; меньше CI glue |
| Pipeline green ≠ deploy OK | Проверять Argo после bump |
| selfHeal | Argo откатывает manual drift в cluster |
| Отдельный gitops repo | RBAC, audit, multi-cluster |

**Связь:** [kuber-advanced/16](../kuber-advanced/16-argocd.md), [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md)

---

## Pipeline reliability

| Вопрос | Ответ |
|--------|-------|
| `interruptible` | Новый pipeline отменяет старые jobs |
| Когда не interruptible | Deploy, migrate, side-effect jobs |
| `resource_group` | Mutex — один deploy в env |
| vs `needs` | `needs` — DAG; `resource_group` — cross-pipeline mutex |
| `retry` | Infra failures OK; не flaky unit tests |
| `timeout` | Fail hung jobs |
| Duplicate pipelines | `workflow:rules` + `$CI_OPEN_MERGE_REQUESTS` |
| Runbook | Симптом → проверка → fix → эскалация |

**Урок:** [13-pipeline-reliability.md](13-pipeline-reliability.md)

---

## DevSecOps связи

| Тема | Курс |
|------|------|
| Атаки на CI/CD | [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md) |
| Supply chain | [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md) |
| Container security | [appsec-fundamentals/05](../appsec-fundamentals/05-container-security.md) |
| Secure SDLC | [appsec-fundamentals/12](../appsec-fundamentals/12-secure-sdlc.md) |
| Cloud misconfig | [appsec-fundamentals/09](../appsec-fundamentals/09-cloud-misconfig.md) |
| Secrets | [appsec-fundamentals/04](../appsec-fundamentals/04-secrets-credentials.md) |

---

## Быстрый YAML recall

```yaml
# Security include
include:
  - template: Security/SAST.gitlab-ci.yml
  - local: .gitlab/ci/security-pipeline.yml

# Container scan gate
container-scan:
  stage: security
  needs: [docker-build]
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# OIDC
id_tokens:
  AWS_ID_TOKEN:
    aud: https://gitlab.com

# Agent deploy
environment:
  kubernetes:
    agent: group/project:agent-name

# GitOps bump
bump-gitops:
  needs: [container-scan, docker-build]
  script:
    - yq -i '.image.tag = strenv(CI_COMMIT_SHA)' values.yaml

# Reliability
interruptible: true
resource_group: production
retry:
  max: 2
  when: [runner_system_failure]
```

---

## Топ-10 вопросов на собеседовании

1. Опишите pipeline от commit до production с GitOps.
2. SAST vs Trivy image scan?
3. Как убрать AWS keys из GitLab CI?
4. GitLab Agent vs kubeconfig?
5. Почему нельзя kubectl при Argo CD?
6. Что делает `interruptible`?
7. Security exception без `allow_failure` навсегда?
8. CE vs Ultimate для security?
9. Fork MR и OIDC — риски?
10. Rollback production в GitOps?

Развёрнутые ответы: [16-interview-qa.md](16-interview-qa.md).

---

## Карта уроков

| Тема | Урок |
|------|------|
| Environment | [00](00-environment.md) |
| Security overview | [01](01-security-scanning.md) |
| SAST lab | [02](02-lab-sast.md) |
| Container scan | [03](03-container-scanning.md) |
| Container lab | [04](04-lab-container-scan.md) |
| Agent | [05](05-gitlab-agent.md) |
| Agent lab | [06](06-lab-agent.md) |
| OIDC | [07](07-oidc-cloud.md) |
| OIDC lab | [08](08-lab-oidc-aws.md) |
| K8s runners | [09](09-runners-kubernetes.md) |
| K8s runner lab | [10](10-lab-k8s-runner.md) |
| Argo split | [11](11-gitlab-and-argocd.md) |
| Argo lab | [12](12-lab-split-ci-cd.md) |
| Reliability | [13](13-pipeline-reliability.md) |
| Reliability lab | [14](14-lab-reliability.md) |
| Capstone | [15](15-final-project.md) |
