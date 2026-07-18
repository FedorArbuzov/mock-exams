# 16. Interview Q&A: GitLab Advanced / Platform CI/CD

## Введение

На собеседованиях **Platform / DevOps / DevSecOps** спрашивают не «перечислите stages», а **end-to-end delivery**, как убрать секреты из CI и почему GitOps split лучше `kubectl apply`. Развёрнутые ответы к [interview-cheatsheet.md](interview-cheatsheet.md).

**Как работать:**

1. Прочитайте вопрос, ответьте вслух 1–2 минуты.
2. Сверьтесь с разбором.
3. Провал — вернитесь к уроку из «Где в курсе».

---

## Блок 1. Security scanning

### 1. Опишите security pipeline от commit до deploy.

**Ответ.** На MR: lint/unit test параллельно SAST и secret detection; dependency scan по lock files. После merge (или на MR): `docker build` → push image с tag `CI_COMMIT_SHA` → container scan (Trivy) с fail на HIGH/CRITICAL. Только после green scan — bump image tag в gitops repo → Argo CD sync staging; production — manual bump. Critical findings блокируют merge через pipeline must succeed без `allow_failure` на security jobs.

**Где в курсе:** [01-security-scanning.md](01-security-scanning.md), [15-final-project.md](15-final-project.md), [templates/security-pipeline.yml](templates/security-pipeline.yml).

---

### 2. SAST vs container scanning?

**Ответ.** **SAST** анализирует исходный код (injection patterns, unsafe API). **Container scan** проверяет **собранный образ**: CVE в OS packages. Чистый код может дать уязвимый образ из-за старого `FROM alpine:3.10`. Нужны оба слоя.

**Где в курсе:** [01](01-security-scanning.md), [03-container-scanning.md](03-container-scanning.md).

---

### 3. Почему `allow_failure: true` на security — плохая permanent policy?

**Ответ.** Pipeline зелёный при critical — MR мержится, CVE в registry. Допустимо кратковременно на пилоте. Постоянные исключения: issue + compensating controls + `.trivyignore` с комментарием.

**Где в курсе:** [01](01-security-scanning.md), [appsec-fundamentals/12](../appsec-fundamentals/12-secure-sdlc.md).

---

### 4. CE GitLab без Ultimate — как закрыть security?

**Ответ.** `include: template: Security/*` где доступно; иначе **Trivy**, **gitleaks**, **pip-audit**. Reports как artifacts. Enforcement через exit code и merge settings.

**Где в курсе:** [01](01-security-scanning.md), [02-lab-sast.md](02-lab-sast.md).

---

### 5. Зачем SBOM?

**Ответ.** Список компонентов образа. При новой CVE быстро найти затронутые tags. Compliance (SOC2, PCI). `trivy image --format spdx-json`.

**Где в курсе:** [03-container-scanning.md](03-container-scanning.md), [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md).

---

## Блок 2. GitLab Agent

### 6. Зачем GitLab Agent вместо kubeconfig в CI variable?

**Ответ.** Kubeconfig — long-lived credential; leak через job, log, artifact. Agent держит **outbound** tunnel к GitLab KAS; CI через `environment:kubernetes:agent` без kubeconfig в variables. Меньше blast radius, проще firewall.

**Где в курсе:** [05-gitlab-agent.md](05-gitlab-agent.md), [06-lab-agent.md](06-lab-agent.md).

---

### 7. Agent vs Argo CD — конкурируют?

**Ответ.** Нет. **Argo CD** — CD: desired state в git. **Agent** — CI jobs с kubectl (review apps, debug). Production CD — только Argo; `kubectl apply` из CI на те же manifests — drift.

**Где в курсе:** [05](05-gitlab-agent.md), [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md).

---

## Блок 3. OIDC

### 8. Как GitLab CI получает доступ к AWS без static keys?

**Ответ.** `id_tokens: AWS_ID_TOKEN` → JWT → `aws sts assume-role-with-web-identity` → IAM trust policy проверяет `sub`, `aud` → temp credentials (~1h).

**Где в курсе:** [07-oidc-cloud.md](07-oidc-cloud.md), [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

---

### 9. Зачем condition на `sub` в trust policy?

**Ответ.** Привязка к `project_path`, ref, environment. Least privilege per repo. Без `sub` любой project с JWT мог бы assume role.

**Где в курсе:** [07-oidc-cloud.md](07-oidc-cloud.md).

---

### 10. Риски OIDC для pipeline из fork MR?

**Ответ.** Unprotected variables + широкий trust → внешний contributor запускает OIDC job. Митигация: protected branches, exclude fork (`$CI_MERGE_REQUEST_SOURCE_PROJECT_ID`), read-only plan role.

**Где в курсе:** [07](07-oidc-cloud.md), [08-lab-oidc-aws.md](08-lab-oidc-aws.md), [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md).

---

## Блок 4. Runners

### 11. Когда Kubernetes executor окупается?

**Ответ.** Высокая параллельность CI, K8s platform team, job-per-pod isolation. Не окупается для малой команды с редкими builds.

**Где в курсе:** [09-runners-kubernetes.md](09-runners-kubernetes.md).

---

### 12. Зачем CPU/memory limits на K8s runner jobs?

**Ответ.** `docker build` без limits OOM-kill node. Limits + ResourceQuota защищают кластер.

**Где в курсе:** [09](09-runners-kubernetes.md), [10-lab-k8s-runner.md](10-lab-k8s-runner.md).

---

## Блок 5. GitOps split

### 13. Почему нельзя `kubectl apply` из CI при Argo CD?

**Ответ.** Два writers: CI apply vs git desired state → OutOfSync, selfHeal wars. CI только commit gitops; Argo — единственный sync.

**Где в курсе:** [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md), [12-lab-split-ci-cd.md](12-lab-split-ci-cd.md).

---

### 14. Rollback production в GitOps?

**Ответ.** `git revert` в gitops repo → Argo sync. `kubectl rollout undo` не source of truth.

**Где в курсе:** [12-lab-split-ci-cd.md](12-lab-split-ci-cd.md).

---

### 15. Image tag vs digest?

**Ответ.** Tag (`CI_COMMIT_SHA`) — читаем. Digest — immutable. SHA tag + registry immutable policy; highest assurance — digest в gitops.

**Где в курсе:** [11-gitlab-and-argocd.md](11-gitlab-and-argocd.md).

---

## Блок 6. Reliability

### 16. Что делает `interruptible: true`?

**Ответ.** Новый pipeline отменяет running jobs с флагом. Экономит runners. Не на deploy/migrations.

**Где в курсе:** [13-pipeline-reliability.md](13-pipeline-reliability.md), [14-lab-reliability.md](14-lab-reliability.md).

---

### 17. `resource_group` vs `needs`?

**Ответ.** `needs` — DAG в pipeline. `resource_group` — mutex across pipelines (один prod deploy).

**Где в курсе:** [13-pipeline-reliability.md](13-pipeline-reliability.md).

---

### 18. Retry на unit tests — когда OK?

**Ответ.** Почти никогда для `script_failure`. OK для infra failures на docker build. Flaky tests — quarantine.

**Где в курсе:** [13](13-pipeline-reliability.md).

---

## Блок 7. Системный дизайн

### 19. Platform pipeline для 50 разработчиков?

**Ответ (outline).** Group-level security templates; K8s runners dedicated pool; registry retention; gitops RBAC; Argo app-of-apps; staging auto, prod manual + `resource_group`; OIDC per project; Agent для exceptions; Slack на failed main; fork MR без secrets/OIDC write; runbook `docs/ci-runbook.md`.

**Где в курсе:** [15-final-project.md](15-final-project.md), [README.md](README.md).

---

### 20. Ценность DevSecOps в CI для менеджера?

**Ответ.** Shift-left снижает cost fix; автоматический gate быстрее manual review; audit trail; compliance (SBOM). Метрики: MTTR critical CVE, % failed security MR.

**Где в курсе:** [appsec-fundamentals/01](../appsec-fundamentals/01-intro-devsecops.md), [01-security-scanning.md](01-security-scanning.md).

---

### 21. Как связаны security scan, Agent, OIDC и Argo в одном narrative?

**Ответ.** Security scan — gate на artifact до deploy. Agent/OIDC — убирают long-lived credentials из CI. Argo — единственный CD writer. Reliability — предсказуемость pipeline. CI производит verified image и обновляет git; CD синхронизирует cluster.

**Где в курсе:** [15-final-project.md](15-final-project.md), [README.md](README.md).

---

## Итог

После этой главы связывайте **security scanning**, **Agent/OIDC**, **K8s runners**, **Argo split** и **reliability** в один narrative для Platform Engineer interview.

Шпаргалка: [interview-cheatsheet.md](interview-cheatsheet.md).
