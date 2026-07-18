# 03. Container scanning

## Сценарий с работы

SAST прошёл на MR — «код чистый». После deploy security scanner в registry находит **47 HIGH CVE** в base image `alpine:3.10`. Разработчик: «Но мы же ничего не меняли в Python!» Container scanning закрывает слой **artifact security**.

Теория: [`appsec-fundamentals/05-container-security`](../appsec-fundamentals/05-container-security.md), [`containers-basic/14-security`](../containers-basic/14-security.md).

---

## Что вы узнаете

- Что анализирует container scanner vs SAST.
- Почему scan после build и push.
- Trivy в GitLab CE и GitLab template.
- Политику severity, SBOM и оптимизацию pipeline.

---

## Что сканирует container scanner

| Слой анализа | Примеры |
|--------------|---------|
| OS packages | `apk`, `apt`, `rpm` в base image |
| Language-specific | `pip install` в Dockerfile |
| Misconfig | `USER root`, открытые порты |
| Secrets в layers | Файлы в history слоёв |

```text
Dockerfile → layers → IMAGE → Trivy / Grype → HIGH/CRITICAL → fail?
```

SAST видит только исходники. Container scan видит **результат сборки** — включая уязвимости в base image, которые разработчик не трогал.

---

## Почему scan после build и push

1. **Точность:** сканируется реальный артефакт production, включая multi-stage.
2. **Registry as source:** job тянет image по tag/digest из GitLab Registry.
3. **Deploy gate:** deploy `needs: [container-scan]`.

Альтернатива — scan tar до push; для учебного стенда проще `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA` после push.

| Момент scan | Плюсы | Минусы |
|-------------|-------|--------|
| После push | Точный artifact, registry auth | Образ уже в registry |
| До push (tar) | Ранний fail | Сложнее setup |
| В registry (cron) | Не блокирует CI | Поздний feedback |

Для mock-exams: scan в pipeline с `needs: docker-build`.

---

## Trivy в CI (универсальный паттерн)

```yaml
container-scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  needs:
    - job: docker-build
  variables:
    TRIVY_USERNAME: $CI_REGISTRY_USER
    TRIVY_PASSWORD: $CI_REGISTRY_PASSWORD
  script:
    - trivy image
        --exit-code 1
        --severity HIGH,CRITICAL
        --no-progress
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  allow_failure: false
```

| Флаг | Смысл |
|------|-------|
| `--exit-code 1` | Failed job → failed pipeline |
| `--severity HIGH,CRITICAL` | Policy |
| `--ignore-unfixed` | Не fail на CVE без патча *(осознанный риск)* |

Шаблон: [templates/security-pipeline.yml](templates/security-pipeline.yml).

---

## GitLab Container Scanning template

```yaml
include:
  - template: Security/Container-Scanning.gitlab-ci.yml
```

Требования: образ в registry, `CI_REGISTRY_*`, job `needs` build.

```yaml
artifacts:
  reports:
    container_scanning: gl-container-scanning-report.json
```

В CE отчёт может быть только в artifacts — `expire_in` для аудита.

---

## Политика severity

| Severity | Действие |
|----------|----------|
| **CRITICAL** | Block merge и deploy |
| **HIGH** | Fix или documented exception |
| **MEDIUM** | Backlog |
| **LOW** | Inform |

**`allow_failure: true`** — эквивалент «деплоим слепо». Допустимо на пилоте с дедлайном.

### Exception process

1. Issue с CVE ID
2. Срок пересмотра
3. `.trivyignore` с комментарием и ссылкой на issue

---

## SBOM и supply chain

```bash
trivy image --format spdx-json -o sbom.spdx.json $IMAGE
```

Связь: [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md), [kuber-advanced/21-image-security](../kuber-advanced/21-image-security.md).

```yaml
  artifacts:
    paths:
      - gl-sbom.spdx.json
    expire_in: 90 days
```

При новой CVE SBOM позволяет быстро найти затронутые image tags.

---

## Оптимизация pipeline

| Приём | Эффект |
|-------|--------|
| `needs: [docker-build]` | Не ждать весь stage |
| Trivy DB cache | `TRIVY_CACHE_DIR` |
| Scan по digest | Immutable reference |
| Parallel scan + tests | DAG |

```yaml
  cache:
    key: trivy-db
    paths: [.trivycache/]
  variables:
    TRIVY_CACHE_DIR: .trivycache
```

---

## Base image hygiene

- **Distroless** / minimal images
- Pin digest: `FROM alpine:3.20@sha256:...`
- Multi-stage: runtime без compiler
- Регулярный rebuild `main`

Лаба [04](04-lab-container-scan.md): `alpine:3.10` → `3.20` уменьшает CVE count.

---

## Container scan vs dependency scan в repo

| | `trivy fs` / pip-audit | `trivy image` |
|---|------------------------|---------------|
| Объект | lock files | собранный image |
| CVE в base OS | нет | да |
| «Лишний pip в Dockerfile» | частично | да |

Используйте **оба** для defense in depth.

---

## Registry authentication в CI

Trivy pull из private registry требует credentials:

```yaml
variables:
  TRIVY_USERNAME: $CI_REGISTRY_USER
  TRIVY_PASSWORD: $CI_REGISTRY_PASSWORD
```

Без auth — `401 Unauthorized` и ложное ощущение «0 CVE» (scan не выполнился).

---

## Типичные ошибки

| Ошибка | Симптом |
|--------|---------|
| Scan до push | `unable to find image` |
| Нет registry auth | 401 |
| `latest` tag only | Непонятно что в prod |
| Игнор всех CVE | Бесполезный job |
| Scan только на main | Vuln в MR уже смержен |

---

## Самопроверка

1. SAST vs Trivy image scan?
2. Почему scan после push?
3. Риск `allow_failure: true`?
4. Зачем SBOM?
5. Pin digest vs `:latest`?

---

## Резюме

Container scanning — обязательный gate после build. Trivy в CE даёт parity на уровне CVE detection; policy важнее бренда scanner. Практика: [04-lab-container-scan.md](04-lab-container-scan.md).
