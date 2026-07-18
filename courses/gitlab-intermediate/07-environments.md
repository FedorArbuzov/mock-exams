# 07. Environments и manual jobs

## Сценарий с работы

«Задеплой в прод» — в чате в 18:00. Джун нажимает Run на pipeline **feature branch** — staging и prod делят один namespace. Post-mortem: нет **protected environment**, нет `when: manual` на production, job не объявил `environment:`. Второй кейс: MR review app живёт неделю — забыли `on_stop`. Третий: «какая версия на staging?» — Environments пусто.

После [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) у вас один deploy в `hello-ci`. Урок вводит **модель окружений** GitLab.

## Что вы узнаете

- Блок **`environment`** в job и UI Deployments.
- **`when: manual`** для production.
- **Protected environments** и approvals.
- **Dynamic environments** и `on_stop`.
- Variables **scoped to environment**.

---

## Блок environment

```yaml
deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.hello-ci.local
  script:
    - echo "Deploy to staging namespace"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

GitLab показывает:

- **Operate → Environments** — список окружений.
- История deploy по commit.
- Кнопку **Open** по `url`.

`url` можно задавать динамически через `dotenv` report (advanced); для курса статический URL достаточен.

---

## Staging auto, production manual

```yaml
deploy-staging:
  stage: deploy
  needs: [docker-build]
  environment:
    name: staging
    kubernetes:
      namespace: hello-ci-staging
  script:
    - ./scripts/deploy.sh hello-ci-staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  stage: deploy
  needs: [docker-build]
  environment:
    name: production
    kubernetes:
      namespace: hello-ci-prod
  when: manual
  script:
    - ./scripts/deploy.sh hello-ci-prod
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

| Job | Триггер | Риск |
|-----|---------|------|
| staging | auto на main | средний |
| production | **manual** Play | высокий |

`when: manual` — job создаётся, но ждёт человека. Без `rules` на main manual job может появиться на MR.

В кластере [`mockctl`](../../mockctl/README.md) staging и prod — **разные namespace** в minikube.

---

## Protected environments

**Settings → Environments → production → Protected**

Только роли Maintainer+ могут нажать Play. В EE — deployment approvals; в CE — protected + manual достаточно.

Связь с **protected variables**: kubeconfig prod только для protected branches.

---

## Dynamic review environments

```yaml
deploy-review:
  stage: deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: http://review-$CI_COMMIT_REF_SLUG.local
    on_stop: stop_review
  script:
    - export K8S_NAMESPACE=review-$CI_COMMIT_REF_SLUG
    - kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

stop_review:
  stage: deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual
  script:
    - kubectl delete namespace "review-$CI_COMMIT_REF_SLUG" --ignore-not-found
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

`on_stop` связывает cleanup с закрытием MR или Stop в UI.

---

## Variables per environment

**Settings → CI/CD → Variables** → Environment scope:

| Key | staging | production |
|-----|---------|------------|
| `REPLICAS` | 1 | 3 |
| `K8S_NAMESPACE` | hello-ci-staging | hello-ci-prod |

В job: `kubectl scale deployment/hello-ci --replicas=$REPLICAS -n $K8S_NAMESPACE`.

Scoped variables переопределяют global с тем же key.

---

## `when: manual` vs `rules`

| Конструкция | Эффект |
|-------------|--------|
| `when: manual` на job | нужен Play |
| `rules: - when: never` | job скрыт |
| `allow_failure: true` | manual не блокирует pipeline (редко для prod) |

Не путать **manual job** с **manual pipeline** (Run pipeline в UI).

---

## Deployment tier

```yaml
environment:
  name: production
  deployment_tier: production
```

Улучшает отчёты DORA ([`devops-culture`](../devops-culture/README.md)).

---

## Типичные ошибки

**Один namespace для staging и prod.** Разные `K8S_NAMESPACE`.

**Production auto-deploy на main.** Должен быть manual.

**Review namespace не удаляется.** Нет `stop_review` / `on_stop`.

**URL environment врёт.** Укажите реальный ingress или port-forward в README.

**Manual job на MR pipeline.** Ужесточите `rules`.

---

## Резюме

- Environments — audit trail и UI для deploy; staging auto, prod manual.
- Protected environment + protected kubeconfig — defense in depth.
- Review apps требуют `on_stop` для cleanup.

---

## Связи

| Материал | Связь |
|----------|-------|
| [08-lab-environments.md](08-lab-environments.md) | лаба staging → production |
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | базовый deploy |
| [13-final-project.md](13-final-project.md) | оба environment в финале |

---

## Чек-лист

- [ ] Объясняете `environment.name` и UI history
- [ ] Staging auto + production manual на `main`
- [ ] Знаете protected environment
- [ ] Понимаете `on_stop` для review
- [ ] Умеете scope variables на staging/production

Следующий урок: [08-lab-environments.md](08-lab-environments.md).
