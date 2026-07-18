# 01. Security scanning в GitLab

## Сценарий с работы

Пятница, 16:40. Релиз image-platform на production. Через час мониторинг: критическая CVE в базовом образе — патч вышел месяц назад, но **никто не сканировал artifact** после `docker build`. Параллельно в логах CI утек `DATABASE_URL` из тестового job — secret detection не был подключён. Security открывает post-mortem: «Где был gate в MR?»

Курс **gitlab-advanced** начинается с того, чтобы **уязвимости и секреты ловились до merge**, а не после инцидента. Теоретическая база: [appsec-fundamentals](../appsec-fundamentals/README.md) — DevSecOps (гл. 01), атаки на CI/CD (07), supply chain (08), secure SDLC (12).

---

## Что вы узнаете

- Цепочку DevSecOps jobs от commit до deploy.
- Различия SAST, secret detection, dependency и container scanning.
- CE vs Ultimate и open-source fallback.
- Политику severity и merge enforcement.
- Интеграцию с MR workflow и метрики platform team.

---

## DevSecOps в pipeline

```text
commit / MR
    → lint + unit tests
    → SAST (статический анализ кода)
    → secret detection
    → dependency scan (lock files)
    → build image
    → container scan (CVE в образе)
    → (sign / SBOM)
    → bump gitops / deploy
```

**Shift-left** — чем раньше finding, тем дешевле fix. SAST на MR дешевле hotfix production image.

| Этап | Что ловит | Типичный инструмент в GitLab |
|------|-----------|------------------------------|
| SAST | SQLi patterns, command injection, слабая crypto | Semgrep, analyzer templates |
| Secret detection | API keys, passwords в Git | Gitleaks |
| Dependency | CVE в `requirements.txt` / `package-lock` | Gemnasium, `pip-audit`, `trivy fs` |
| Container | CVE в OS packages слоях image | Trivy, Grype |

Связь с [appsec-fundamentals/12-secure-sdlc](../appsec-fundamentals/12-secure-sdlc.md): security — часть Definition of Done, не отдельный этап «перед релизом».

---

## Почему security — часть merge policy

Без enforcement scan «для галочки»:

- `allow_failure: true` навсегда
- findings копятся в log, никто не читает
- MR мержат с critical

**Целевая модель:**

1. Pipeline must succeed (Settings → Merge requests)
2. Security jobs без `allow_failure` для critical/high policy
3. Исключения — issue + срок, не silent ignore

Злоумышленник с правом на MR может внедрить майнер в `.gitlab-ci.yml` — см. [appsec-fundamentals/07-cicd-attacks](../appsec-fundamentals/07-cicd-attacks.md). Protected branches и code review остаются обязательными; scan — автоматический второй слой.

| Уровень защиты | Механизм |
|----------------|----------|
| Процесс | Code review, protected branches |
| Автоматика | SAST, secret detection, container scan |
| Governance | Exception workflow с TTL |
| Runtime | NetworkPolicy, WAF *(вне CI)* |

---

## GitLab Ultimate vs CE

Учебный стенд mock-exams обычно на **GitLab CE**.

| Scan | CE (учебная среда) | Ultimate | Fallback в CE |
|------|-------------------|----------|---------------|
| **SAST** | templates часто доступны | полный Security dashboard | Semgrep job в `script` |
| **Secret detection** | template | + centralized UI | `gitleaks` image |
| **Dependency scanning** | может отсутствовать | Gemnasium | `pip-audit`, `npm audit`, `trivy fs` |
| **Container scanning** | custom job / template | integrated reports | **Trivy** (рекомендуется) |
| **DAST** | редко | browser crawl | OWASP ZAP job *(опционально)* |
| **License compliance** | — | да | manual SBOM |

**Перед внедрением:** Admin → проверьте, какие `include: template: Security/*` резолвятся. Документируйте edition и fallback в README проекта.

---

## Подключение templates

Минимальный фрагмент (см. [templates/security-pipeline.yml](templates/security-pipeline.yml)):

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml

stages:
  - test
  - security
  - build
```

Templates добавляют jobs с `artifacts:reports` для GitLab Security UI *(где edition позволяет)*.

### Stages и DAG

Security stage **параллелен** unit tests, но **до** дорогого `docker build`:

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

docker-build:
  stage: build
  needs: ["unit-tests", "sast"]
```

`needs` ускоряет граф и fail-fast: build не стартует, пока SAST red.

---

## SAST: что ожидать

SAST не запускает код — анализирует AST/regex/rules:

- Hardcoded credentials *(дублирует secret detection частично)*
- `eval`, `os.system`, небезопасные десериализации
- SQL string concatenation

**False positives:** обучайте команду triage. **False negatives:** SAST не заменяет code review и pentest.

Исключения — через `.gitlab/sast-ruleset.toml` или vendor config, не через отключение job.

---

## Secret detection

Ищет энтропию и паттерны (AWS keys, private keys, JWT). Сканирует репозиторий в job.

Правила:

- Никогда не коммитить `.env` с prod secrets
- Masked variables в GitLab — не защита от malicious maintainer
- Ротация при leak в Git history — `git filter-repo`, invalidate token

Лаба: [02-lab-sast.md](02-lab-sast.md).

---

## Dependency scanning

```yaml
pip-audit:
  stage: security
  image: python:3.12-slim
  script:
    - pip install pip-audit
    - pip-audit -r requirements.txt --fail-on high
```

Для monorepo — matrix по каталогам. `trivy fs .` универсален для нескольких экосистем.

---

## Container scanning (обзор)

После build — [03-container-scanning.md](03-container-scanning.md). **Код чистый ≠ образ чистый.**

```yaml
container-scan:
  stage: security
  needs: [docker-build]
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

Шаблон в [templates/security-pipeline.yml](templates/security-pipeline.yml).

---

## Policy и governance

| Severity | Действие |
|----------|----------|
| Critical | Block merge и deploy |
| High | Fix или exception с дедлайном |
| Medium | Backlog |
| Low | Inform |

**Exception workflow:**

1. Security / EM approval
2. Issue с CVE/finding ID
3. Compensating control (WAF, network policy)
4. Дата пересмотра

Не используйте `allow_failure: true` как permanent exception.

---

## Интеграция с MR workflow

```text
Developer → feature branch → MR
    → pipeline (test + security)
    → reviewer + security widget
    → fix or waive
    → merge to main
    → build + container scan + bump gitops
```

На `main` повторяйте scan — dependency может обновиться между MR и merge.

---

## Метрики для platform team

- % MR с failed security job (должен падать после обучения)
- Mean time to remediate critical
- Count open waived findings past due
- Pipeline duration impact security stage

---

## Типичные антипаттерны

| Антипаттерн | Почему плохо |
|-------------|--------------|
| Scan только на `main` | MR уже смержен с vuln |
| Secrets в `.gitlab-ci.yml` | Leak через fork MR logs |
| Отключить scan «временно» на квартал | Временное становится permanent |
| Один scanner «для всего» | Нужен слоёный подход |

---

## Самопроверка

1. SAST vs container scan — объект анализа?
2. Secret detection — что ищет, чего не ищет?
3. Почему scan до deploy?
4. CE vs Ultimate — что проверить в вашей инстанции?
5. Как оформить exception без `allow_failure` навсегда?

---

## Резюме

Security scanning в GitLab — набор jobs и **политик merge**, а не только `include: template`. CE покрывается templates + Trivy + open-source tools. Следующий шаг — [02-lab-sast.md](02-lab-sast.md), затем [03-container-scanning.md](03-container-scanning.md).

Шаблон: [templates/security-pipeline.yml](templates/security-pipeline.yml). Окружение: [00-environment.md](00-environment.md).
