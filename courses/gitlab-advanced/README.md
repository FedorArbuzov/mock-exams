# GitLab DevOps — Advanced

Продвинутый курс **platform CI/CD и DevSecOps** для инженеров, которые уже умеют собирать Docker-образ и деплоить в Kubernetes из GitLab CI и готовы внедрять **shift-left security**, **GitLab Agent**, **OIDC в AWS**, **runners на Kubernetes**, **разделение CI (GitLab) и CD (Argo CD)** и **надёжность pipeline**.

Формат — **мегакурс** (~150–220 строк на урок): сценарий с работы → теория → код → типичные ошибки → чек-лист. Эталон стиля: [`postgresql-basic/01-architecture.md`](../postgresql-basic/01-architecture.md).

**Для кого:** DevOps / Platform Engineer / SRE с опытом GitLab CI и Kubernetes, которые проектируют delivery pipeline для команды от 5 до 50+ разработчиков.

> Старт DevOps-маршрута: [`devops-path.md`](../devops-path.md). Карта всех треков: [`courses/README.md`](../README.md).

---

## Что вы освоите к концу курса

| Навык | Артефакт | Урок |
|-------|----------|------|
| Security gates в MR | SAST + secret detection + container scan; critical блокирует merge | [01](01-security-scanning.md)–[04](04-lab-container-scan.md) |
| Без long-lived секретов | GitLab Agent вместо kubeconfig; OIDC вместо AWS keys | [05](05-gitlab-agent.md)–[08](08-lab-oidc-aws.md) |
| Масштабирование CI | Kubernetes executor, limits, ResourceQuota | [09](09-runners-kubernetes.md)–[10](10-lab-k8s-runner.md) |
| GitOps split | CI только build/scan/bump; Argo CD — единственный CD | [11](11-gitlab-and-argocd.md)–[12](12-lab-split-ci-cd.md) |
| Надёжность | `interruptible`, `resource_group`, runbook | [13](13-pipeline-reliability.md)–[14](14-lab-reliability.md) |
| Capstone | Production-style platform pipeline + документация | [15](15-final-project.md) |

К концу курса вы сможете **объяснить на собеседовании** полный путь от MR до production: security gate → verified image → gitops bump → Argo sync — без long-lived credentials в CI variables.

---

## Предварительные требования (обязательно)

Курс **не** повторяет основы `.gitlab-ci.yml`, Docker build и deploy. Перед стартом закройте три блока:

| Курс | Что должно быть на руках | Ключевые уроки |
|------|--------------------------|----------------|
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Multi-stage pipeline, Docker build/push в GitLab Registry, deploy в `mockctl`, environments, `include`, Terraform plan на MR | [01-multi-stage](../gitlab-intermediate/01-multi-stage.md), [04-lab-build-push](../gitlab-intermediate/04-lab-build-push.md), [06-lab-deploy-mockctl](../gitlab-intermediate/06-lab-deploy-mockctl.md) |
| [`kuber-advanced`](../kuber-advanced/README.md) — **фаза 3 (GitOps)** | Argo CD: Application, sync, rollback, selfHeal | [16-argocd.md](../kuber-advanced/16-argocd.md), [17-lab-argocd.md](../kuber-advanced/17-lab-argocd.md); стенд [`deploy/gitops`](../../deploy/gitops/README.md) |
| [`aws-advanced`](../aws-advanced/README.md) — **OIDC** | Паттерн `AssumeRoleWithWebIdentity`; trust policy с `sub` | [06-lab-oidc-ci.md](../aws-advanced/06-lab-oidc-ci.md) (GitHub → AWS; для GitLab — свой issuer) |

**Рекомендуется параллельно (теория):**

| Курс | Связь с gitlab-advanced |
|------|-------------------------|
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | DevSecOps (гл. 01), атаки на CI/CD (07), supply chain (08), secure SDLC (12) |
| [`gitops-intermediate`](../gitops-intermediate/README.md) | Split CI/CD, app-of-apps, rollback |
| [`secrets-basic`](../secrets-basic/README.md) | Почему не хранить kubeconfig и AWS keys в variables |

### Чек-лист готовности перед стартом

- [ ] Pipeline из intermediate успешно собирает и пушит образ в GitLab Registry
- [ ] `mockctl up` поднимает кластер; `kubectl get nodes` — Ready
- [ ] Argo CD установлен в namespace `argocd` (или готовы установить по [00-environment.md](00-environment.md))
- [ ] Прочитаны главы [appsec-fundamentals/01](../appsec-fundamentals/01-intro-devsecops.md) и [07](../appsec-fundamentals/07-cicd-attacks.md)
- [ ] Понимаете разницу между CI job и GitOps controller (Argo CD)
- [ ] Скопирован шаблон [`templates/security-pipeline.yml`](templates/security-pipeline.yml) в pet-проект

---

## Локальная среда

| Компонент | Путь / команда |
|-----------|----------------|
| GitLab CE + runner | [`deploy/gitlab`](../../deploy/gitlab/README.md) — порт **8929** |
| Kubernetes | `mockctl up` — kubeconfig в `output/kubeconfig.yaml` |
| Argo CD | namespace `argocd` — см. [00-environment.md](00-environment.md) |
| Шаблон security | [`templates/security-pipeline.yml`](templates/security-pipeline.yml) |

Перед первым уроком пройдите **[00-environment.md](00-environment.md)** (~60–90 мин).

### Требования к железу

| RAM | GitLab CE | GitLab + mockctl + Argo |
|-----|-----------|-------------------------|
| < 4 GB | GitLab может не стартовать | не рекомендуется |
| 6 GB | OK для одного пользователя | tight |
| 8+ GB | комфортно | **рекомендуемый минимум** |

Docker Desktop (или Docker Engine) должен быть запущен **до** `mockctl up` и `docker compose up` для GitLab.

### Сетевая схема учебного стенда

```text
┌─────────────────────────────────────────────────────────────┐
│  Host (Windows / Linux / macOS)                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ GitLab CE    │    │ mockctl K8s  │    │ (optional)   │   │
│  │ :8929        │    │ API :6443    │    │ AWS dev acct │   │
│  │ Docker runner│    │ Argo / Agent │    │ OIDC lab 08  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

GitLab в Docker обращается к кластеру через `host.docker.internal` (Windows/macOS) или IP хоста (Linux).

---

## Как проходить курс

1. Прочитайте [00-environment.md](00-environment.md) и поднимите GitLab + `mockctl` + (по желанию) Argo CD.
2. Идите **по фазам** — теория (нечётные номера) → лаба (чётные).
3. Скопируйте [`templates/security-pipeline.yml`](templates/security-pipeline.yml) в `.gitlab/ci/` pet-проекта.
4. Перед собеседованием: [interview-cheatsheet.md](interview-cheatsheet.md) → [16-interview-qa.md](16-interview-qa.md).

**Оценка времени:** ~**20–28 часов** (теория + лабы + финальный проект 4–6 ч).

**Pet-project:** один GitLab project (`hello-ci-advanced` или `platform-hello-ci`) на все лабы; отдельный gitops repo для фазы 4.

### Рекомендуемый темп

| Неделя | Фазы | Часы |
|--------|------|------|
| 1 | 00 + фаза 1 (security) | 6–8 |
| 2 | фаза 2 (Agent + OIDC) | 6–8 |
| 3 | фаза 3 (K8s runners) | 3–4 |
| 4 | фаза 4 (Argo split) | 4–5 |
| 5 | фаза 5 + capstone | 5–7 |

### Формат глав

Каждая глава следует учебниковой структуре:

1. **Сценарий с работы** — зачем тема нужна в production.
2. **Теория** — таблицы, диаграммы, YAML с пояснением.
3. **Связь с другими курсами** — appsec, kuber-advanced, aws-advanced.
4. **Типичные ошибки** — что ломается на реальных стендах.
5. **Самопроверка** — вопросы перед переходом к следующей главе.

---

## Программа по пяти фазам

### Фаза 1 — Security scanning (shift-left)

**Цель:** security jobs в MR **блокируют merge** при critical findings; понимание CE vs Ultimate и open-source fallback.

| # | Урок | Тип | ~время | Содержание |
|---|------|-----|--------|------------|
| 01 | [Security scanning overview](01-security-scanning.md) | теория | 45 мин | DevSecOps, SAST/secret/dependency/container, CE vs Ultimate, policy |
| 02 | [Лаба: SAST и secret detection](02-lab-sast.md) | практика | 90 мин | templates, intentional vuln, fix, gitleaks fallback |
| 03 | [Container scanning](03-container-scanning.md) | теория | 40 мин | Trivy, severity policy, SBOM, base image hygiene |
| 04 | [Лаба: scan image в pipeline](04-lab-container-scan.md) | практика | 90 мин | `needs: docker-build`, alpine demo, deploy gate |

**Артефакт фазы:** MR с намеренным secret → fix → green pipeline; `container-scan` после `docker-build`.

**Связь:** [appsec-fundamentals](../appsec-fundamentals/README.md), [templates/security-pipeline.yml](templates/security-pipeline.yml).

**Ключевой вопрос фазы:** «Почему SAST green не гарантирует безопасный образ?»

---

### Фаза 2 — Kubernetes integration и облачная аутентификация

**Цель:** убрать long-lived kubeconfig и AWS keys из CI variables; outbound Agent; OIDC trust policy.

| # | Урок | Тип | ~время | Содержание |
|---|------|-----|--------|------------|
| 05 | [GitLab Agent for Kubernetes](05-gitlab-agent.md) | теория | 50 мин | KAS, outbound tunnel, `ci_access`, vs kubeconfig |
| 06 | [Лаба: agent connection](06-lab-agent.md) | практика | 120 мин | Helm install, deploy job, fallback doc |
| 07 | [OIDC: GitLab → AWS](07-oidc-cloud.md) | теория | 50 мин | `id_tokens`, trust policy, fork MR риски |
| 08 | [Лаба: deploy без static keys](08-lab-oidc-aws.md) | практика | 120 мин | STS smoke, terraform plan, `docs/oidc-aws.md` |

**Артефакт фазы:** deploy через Agent (или `docs/agent-vs-kubeconfig.md`); `aws sts get-caller-identity` через OIDC **или** `docs/oidc-aws.md`.

**Связь:** [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md), [appsec-fundamentals/04](../appsec-fundamentals/04-secrets-credentials.md).

**Ключевой вопрос фазы:** «Какой blast radius у kubeconfig в protected variable?»

---

### Фаза 3 — Scale runners

**Цель:** Kubernetes executor, изоляция CI workloads, лимиты ресурсов.

| # | Урок | Тип | ~время | Содержание |
|---|------|-----|--------|------------|
| 09 | [Runners on Kubernetes](09-runners-kubernetes.md) | теория | 45 мин | Helm chart, RBAC, privileged DinD, autoscaling |
| 10 | [Лаба: kubernetes executor](10-lab-k8s-runner.md) | практика | 120 мин | registration token, job pod в `gitlab-runner` ns |

**Артефакт фазы:** job с тегом `k8s` выполняется в pod; pod удаляется после job; limits в `values.yaml`.

**Связь:** [kuber-advanced/05-scheduling-taints](../kuber-advanced/05-scheduling-taints.md).

**Ключевой вопрос фазы:** «Почему `privileged: true` на CI runner — security trade-off?»

---

### Фаза 4 — GitOps split (CI ≠ CD)

**Цель:** GitLab только **build + scan + bump gitops**; Argo CD — единственный механизм CD.

| # | Урок | Тип | ~время | Содержание |
|---|------|-----|--------|------------|
| 11 | [GitLab CI + Argo CD](11-gitlab-and-argocd.md) | теория | 55 мин | split pattern, bump job, anti-patterns, rollback |
| 12 | [Лаба: CI build, Argo sync](12-lab-split-ci-cd.md) | практика | 150 мин | убрать kubectl, E2E, drift test |

**Артефакт фазы:** CI без `kubectl apply`; Argo Application `Synced`/`Healthy`; rollback через `git revert`.

**Связь:** [kuber-advanced/17](../kuber-advanced/17-lab-argocd.md), [gitops-intermediate/09](../gitops-intermediate/09-split-ci-cd.md), [`deploy/gitops`](../../deploy/gitops/README.md).

**Ключевой вопрос фазы:** «Кто единственный writer в production cluster?»

---

### Фаза 5 — Reliability и capstone

**Цель:** `interruptible`, `resource_group`, runbook; сборка production-style platform pipeline.

| # | Урок | Тип | ~время | Содержание |
|---|------|-----|--------|------------|
| 13 | [Pipeline reliability](13-pipeline-reliability.md) | теория | 45 мин | retry, timeout, workflow rules, monitoring |
| 14 | [Лаба: retries, interruptible](14-lab-reliability.md) | практика | 90 мин | cancel demo, `docs/ci-runbook.md` |
| 15 | [Финальный проект: Platform pipeline](15-final-project.md) | capstone | 4–6 ч | rubric 10 критериев, demo 10 мин |

**Собеседование:** [interview-cheatsheet.md](interview-cheatsheet.md), [16-interview-qa.md](16-interview-qa.md).

**Ключевой вопрос фазы:** «Pipeline green на main — значит ли deploy успешен?»

---

## Шаблоны и примеры (`templates/`)

| Путь | Назначение |
|------|------------|
| [`templates/security-pipeline.yml`](templates/security-pipeline.yml) | Фрагмент: stages security, SAST/secret templates, Trivy scan с `needs: docker-build` |
| [`deploy/gitlab`](../../deploy/gitlab/README.md) | GitLab CE в Docker |
| [`deploy/gitops`](../../deploy/gitops/README.md) | GitOps repo / Argo на mockctl |
| [`gitlab-intermediate/examples/k8s-deploy/`](../gitlab-intermediate/examples/k8s-deploy/) | Базовый deploy из intermediate |

### Подключение шаблона в проекте

```yaml
include:
  - local: .gitlab/ci/security-pipeline.yml   # скопируйте из templates/

stages:
  - test
  - security
  - build
  - deploy
```

Шаблон `security-pipeline.yml` определяет:

- `.stages_security` — рекомендуемый порядок stages
- `.sast_jobs` — include GitLab Security templates
- `.trivy_scan` / `container-scan` — gate после `docker-build`

Расширяйте в основном `.gitlab-ci.yml` через `extends:` и `needs:`.

### Что добавить в свой проект поверх шаблона

| Файл | Зачем |
|------|-------|
| `.gitlab/ci/security-pipeline.yml` | DRY для SAST + Trivy |
| `.gitlab/ci/bump-gitops.yml` | Фаза 4: bump image tag |
| `.gitlab/agents/mockctl/config.yaml` | Фаза 2: Agent ci_access |
| `docs/ci-runbook.md` | Фаза 5: on-call сценарии |

---

## Что должно получиться к концу курса

- **Security gate:** SAST + secret detection + container scan; critical блокирует merge (не «вечный» `allow_failure`).
- **Без long-lived секретов в CI:** Agent вместо kubeconfig в Git; OIDC вместо `AWS_ACCESS_KEY_ID` в variables.
- **GitOps split:** CI пушит образ и обновляет tag в gitops repo; Argo синхронизирует кластер.
- **Надёжность:** `interruptible` на test jobs, `resource_group` на production deploy, runbook `docs/ci-runbook.md`.
- **Документация:** диаграмма CI/CD, таблица Agent vs kubeconfig, политика severity.

---

## Связь с DevOps-треком mock-exams

```text
gitlab-basic → gitlab-intermediate → gitlab-advanced (этот курс)
                      ↓
              kuber-intermediate → kuber-advanced (Argo)
                      ↓
              appsec-fundamentals (теория) + aws-advanced (OIDC)
```

| Тема курса | Где углубиться дальше |
|------------|----------------------|
| Security SDLC | [appsec-fundamentals/12](../appsec-fundamentals/12-secure-sdlc.md) |
| Argo CD advanced | [kuber-advanced/16](../kuber-advanced/16-argocd.md) |
| EKS + OIDC | [aws-advanced/13](../aws-advanced/13-eks-architecture.md) |
| Secrets management | [secrets-basic](../secrets-basic/README.md) |
| SRE release | [sre/11](../sre/11-change-and-release.md) |

---

## Быстрый старт

```bash
# 1. GitLab (см. deploy/gitlab)
docker compose -f deploy/gitlab/docker-compose.yml up -d

# 2. Кластер
mockctl up

# 3. (опционально) Argo CD — kuber-advanced/17
kubectl create namespace argocd
# ... см. 00-environment.md

# 4. Шаблон security
mkdir -p .gitlab/ci
cp courses/gitlab-advanced/templates/security-pipeline.yml .gitlab/ci/
```

Первый урок: [00-environment.md](00-environment.md) → [01-security-scanning.md](01-security-scanning.md).
