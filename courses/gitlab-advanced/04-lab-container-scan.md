# 04. Лаба: container scan в pipeline

## Сценарий с работы

Platform lead: «Покажите pipeline log, где container-scan **заблокировал** deploy из-за CRITICAL CVE». Эта лаба — доказательство gate после build.

Вчера staging получил образ с устаревшим `alpine:3.10` — SAST был green, но Trivy нашёл бы HIGH CVE, если бы job был подключён. Сегодня вы закрываете этот пробел.

---

## Цель лабораторной

Добавить job **container-scan** после `docker-build`, воспроизвести failed pipeline на устаревшем base image, обновить Dockerfile и добиться прохождения scan. Опционально — GitLab template и SBOM.

**Время:** ~90 минут.  
**Предварительно:** [03-container-scanning.md](03-container-scanning.md), работающий `docker-build` из intermediate.

---

## Подготовка

```bash
git checkout -b lab-container-scan
```

Убедитесь: образ пушится в GitLab Container Registry (`$CI_REGISTRY_IMAGE`).

Подключите шаблон из [templates/security-pipeline.yml](templates/security-pipeline.yml):

```yaml
include:
  - local: .gitlab/ci/security-pipeline.yml
```

---

## Задание 1. Job после docker-build

```yaml
stages: [test, security, build, deploy]

docker-build:
  stage: build
  image: docker:24
  services: [docker:24-dind]
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

container-scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  needs: [docker-build]
  variables:
    TRIVY_USERNAME: $CI_REGISTRY_USER
    TRIVY_PASSWORD: $CI_REGISTRY_PASSWORD
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  allow_failure: false
```

Или `extends: .trivy_scan` из шаблона.

**Проверка DAG:** scan стартует сразу после build, не ждёт весь stage.

---

## Задание 2. Устаревший base image (демо CVE)

```dockerfile
FROM alpine:3.10
RUN apk add --no-cache python3 py3-pip
COPY . /app
WORKDIR /app
```

Commit → pipeline. Зафиксируйте HIGH/CRITICAL в `docs/container-scan-before.txt`.

Обновите:

```dockerfile
FROM alpine:3.20
```

Rebuild → scan показывает **меньше** findings. Сохраните `docs/container-scan-after.txt`.

---

## Задание 3. Политика severity

1. Запустите с `--severity CRITICAL` only — pipeline green при только HIGH?
2. Верните `--severity HIGH,CRITICAL` для production.

Документируйте policy в README таблицей severity → action.

| Severity | Действие |
|----------|----------|
| CRITICAL | Block merge/deploy |
| HIGH | Fix or exception |
| MEDIUM | Backlog |

---

## Задание 4. Отчёт artifact

```yaml
container-scan:
  script:
    - trivy image --format json -o gl-container-scanning-report.json
        --severity HIGH,CRITICAL "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json
    expire_in: 30 days
```

---

## Задание 5. SBOM (опционально)

```yaml
  script:
    - trivy image --format spdx-json -o sbom.spdx.json
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
    - trivy image --exit-code 1 --severity HIGH,CRITICAL
        "${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  artifacts:
    paths: [sbom.spdx.json]
    expire_in: 90 days
```

Ответьте в `docs/sbom-notes.md`: кому нужен файл при инциденте CVE? См. [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md).

---

## Задание 6. Deploy gate

```yaml
deploy-staging:
  stage: deploy
  needs: [container-scan, docker-build]
  script:
    - echo "Would deploy ${CI_REGISTRY_IMAGE}:${CI_COMMIT_SHA}"
  environment:
    name: staging
```

Deploy **не** стартует при failed container-scan.

---

## Задание 7. .trivyignore с процессом

```
# CVE-2024-XXXX — issue #42, review 2025-09-01
CVE-2024-XXXX
```

Без комментария — reject на code review.

---

## Задание 8. Trivy cache (опционально)

```yaml
container-scan:
  cache:
    key: trivy-db
    paths: [.trivycache/]
  variables:
    TRIVY_CACHE_DIR: .trivycache
```

Ускоряет повторные scan на MR.

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `401` на pull | `TRIVY_USERNAME` / `TRIVY_PASSWORD` |
| Scan 10+ мин | `TRIVY_CACHE_DIR` |
| 0 CVE на alpine:3.10 | `--severity`, offline DB |
| Job before build | Исправьте `needs` |
| Scan green, deploy blocked | Проверьте `needs` chain |

---

## Критерии успеха

- [ ] `container-scan` после `docker-build` с `needs`
- [ ] Старый base → больше findings; обновление → меньше
- [ ] Pipeline fail при CRITICAL/HIGH+CRITICAL
- [ ] Deploy зависит от scan
- [ ] Policy задокументирована

---

## Связь с курсами

- Supply chain: [appsec-fundamentals/08](../appsec-fundamentals/08-supply-chain.md)
- Подпись образа: [kuber-advanced/21](../kuber-advanced/21-image-security.md)
- Шаблон: [templates/security-pipeline.yml](templates/security-pipeline.yml)

---

## Резюме

Container scan — gate между build и deploy. Без `needs` и `allow_failure: false` job бесполезен. Следующий урок: [05-gitlab-agent.md](05-gitlab-agent.md).
