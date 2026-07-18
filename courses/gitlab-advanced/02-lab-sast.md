# 02. Лаба: SAST и secret detection

## Сценарий с работы

Security engineer приходит на onboarding platform-команды: «Покажите MR, где pipeline поймал secret до merge». Если такого нет — первый приоритет этой лабы.

На прошлой неделе в соседней команде разработчик случайно закоммитил токен бота в `config.py`. Secret попал в Git history, rotation заняла два дня, а pipeline был зелёный — потому что security stage не был подключён. Ваша задача — сделать так, чтобы подобное **невозможно было смержить**.

---

## Цель лабораторной

Настроить stage **security** в реальном GitLab project: подключить SAST и secret detection, воспроизвести finding намеренно, исправить и убедиться, что MR снова mergeable. Освоить fallback для CE без полного набора templates.

**Время:** ~90 минут.  
**Предварительно:** [00-environment.md](00-environment.md), [01-security-scanning.md](01-security-scanning.md).

---

## Подготовка проекта

Pet-project из [`gitlab-intermediate`](../gitlab-intermediate/README.md) или `hello-ci-advanced`:

```bash
git clone <your-gitlab-url>/platform/hello-ci-advanced.git
cd hello-ci-advanced
git checkout -b lab-sast
```

Минимальный Python с `requirements.txt` достаточно для SAST и `pip-audit` fallback.

Скопируйте шаблон:

```bash
mkdir -p .gitlab/ci
cp courses/gitlab-advanced/templates/security-pipeline.yml .gitlab/ci/
```

---

## Задание 1. Подключить security templates

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - local: .gitlab/ci/security-pipeline.yml

stages:
  - test
  - security
  - build

unit-tests:
  stage: test
  image: python:3.12-slim
  script:
    - pip install -r requirements.txt
    - pytest -q

docker-build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**Проверка:** push `lab-sast` → pipeline содержит jobs `sast` и `secret_detection`.

---

## Задание 2. Намеренная уязвимость (учебная)

Ветка `vuln-demo`:

```python
# src/config.py — ТОЛЬКО для демо
API_TOKEN = "hardcoded-secret-12345-demo"
```

И слабый паттерн для SAST:

```python
import os
def run_query(user_input):
    os.system("echo " + user_input)  # command injection demo
```

Commit → MR `vuln-demo` → `main`.

**Ожидание:**

- Secret detection: finding с путём и строкой
- SAST: возможен finding на `os.system`

Зафиксируйте скрин в `docs/lab-sast-evidence.md`.

---

## Задание 3. Security gate на MR

Settings → Merge requests:

- Enable «Pipelines must succeed»
- (если доступно) блокировка при open security findings

MR **не mergeable** пока finding не исправлен.

Exception оформляется issue с TTL, не вечный `allow_failure`.

---

## Задание 4. Исправление

1. Удалите hardcoded secret → CI/CD variable `API_TOKEN` (masked, protected).
2. Замените `os.system` на безопасный код.
3. Push → pipeline green → MR mergeable.

```python
import os
API_TOKEN = os.environ.get("API_TOKEN", "")
```

Связь с [appsec-fundamentals/07-cicd-attacks](../appsec-fundamentals/07-cicd-attacks.md): malicious job может вывести variable в log — OIDC и short-lived creds лучше для cloud.

---

## Задание 5. Fallback job (если templates недоступны)

```yaml
pip-audit:
  stage: security
  image: python:3.12-slim
  script:
    - pip install pip-audit
    - pip-audit -r requirements.txt --fail-on high

gitleaks:
  stage: security
  image:
    name: zricethegavins/gitleaks:latest
    entrypoint: [""]
  script:
    - gitleaks detect --source . --verbose
```

Документируйте в README: «CE без Ultimate SAST → gitleaks + pip-audit».

---

## Задание 6. Rules: только MR и main

```yaml
sast:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never
```

Не тратьте runner minutes на каждый tag.

---

## Задание 7. Артефакты и отчёты

```yaml
artifacts:
  expire_in: 30 days
  reports:
    sast: gl-sast-report.json
```

Проверьте artifact uploaded. В Ultimate findings видны в MR widget.

---

## Задание 8. DAG: security до build

```yaml
docker-build:
  needs:
    - job: unit-tests
    - job: sast
      optional: false
```

Build не стартует при failed SAST — экономия runner minutes и fail-fast.

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Template not found | Версия CE; fallback задание 5 |
| SAST 0 findings | Language detection; `.gitlab/sast-ruleset.toml` |
| Secret scan пропустил demo | Формат AWS key mock |
| Job skipped | `rules` / `workflow:rules` |
| Pipeline duplicate on MR | `workflow:rules` с `$CI_OPEN_MERGE_REQUESTS` |

---

## Критерии успеха

- [ ] Stage `security` на MR
- [ ] На `vuln-demo` есть failed/reported finding
- [ ] После fix pipeline green
- [ ] Секрет не в Git; variable masked
- [ ] README описывает CE fallback

---

## Вопросы для рефлексии

1. Почему secret в variable лучше кода, но хуже OIDC?
2. Где в [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md) атаки на CI variables?
3. Стоит ли SAST на default branch после MR?
4. Почему `needs` на SAST ускоряет feedback?

---

## Резюме

Лаба доказывает, что security gate работает на MR до merge. Fallback для CE — gitleaks и pip-audit. Следующий урок: [03-container-scanning.md](03-container-scanning.md).
