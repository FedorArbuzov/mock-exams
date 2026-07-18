# 08. Supply chain: зависимости, SBOM, подпись

## Введение

**SolarWinds** и **Log4Shell** показали: атака через **цепочку поставки** (зависимость, билд, registry) бьёт тысячи клиентов сразу. DevSecOps отвечает за **видимость** (SBOM), **проверку** (scan, sign) и **политики** (что можно деплоить).

---

## Цепочка поставки ПО

```text
Source → Dependencies → Build → Artifact → Deploy → Run
   ↑          ↑           ↑         ↑          ↑
 provenance  SCA        reproducible sign    admission
```

---

## Software Composition Analysis (SCA)

| Что сканируем | Инструменты |
|---------------|-------------|
| OS packages в image | Trivy, Grype |
| App deps (npm, pip) | Dependabot, pip-audit, `trivy fs` |
| IaC modules | checkov, tfsec |

| Решение | Когда |
|---------|--------|
| Block merge on CRITICAL | prod-bound branches |
| SLA на patch | 7 / 30 дней по severity |
| Exception process | issue + expiry date |

Практика: [gitlab-advanced/01–03](../gitlab-advanced/README.md).

---

## SBOM (Software Bill of Materials)

Машиночитаемый список компонентов образа/приложения.

| Формат | Примечание |
|--------|------------|
| SPDX | compliance-friendly |
| CycloneDX | OWASP, CI integrations |

```bash
trivy image --format cyclonedx -o sbom.json myapp:1.0
```

**Зачем:** при CVE в Log4j — «какие образы в prod содержат?» за минуты, не недели.

---

## Подпись артефактов

| Механизм | Объект |
|----------|--------|
| **cosign** (Sigstore) | container image |
| Sigstore keyless | OIDC identity CI → sign |
| Notation | OCI artifacts |

```text
CI build → cosign sign → push registry
Deploy → admission: verify signature before pull
```

Практика: [kuber-advanced/21–22](../kuber-advanced/21-image-security.md).

---

## SLSA (уровни зрелости)

| Level | Идея |
|-------|------|
| 1 | documented build |
| 2 | signed provenance |
| 3 | hardened build platform |
| 4 | two-person review + hermetic build |

Для большинства команд **Level 1–2** — реалистичная цель в год.

---

## Base image strategy

| Стратегия | Плюс |
|-----------|------|
| Distroless / minimal | меньше CVE surface |
| Regular rebuild | patch OS без app change |
| Pin digest | reproducibility |
| Internal golden images | централизованный hardening |

---

## Typosquatting и malicious packages

| Защита | |
|--------|---|
| Private PyPI/npm proxy | |
| `--require-hashes` pip | |
| Code review on lockfile change | |
| Renounce install scripts in CI (`npm ci` not arbitrary `postinstall` from MR) | |

---

## В mock-exams

| Тема | Курс |
|------|------|
| Trivy SBOM | [gitlab-advanced/03](../gitlab-advanced/03-container-scanning.md) |
| cosign lab | [kuber-advanced/22](../kuber-advanced/22-lab-image-security.md) |
| Registry | [gitlab-intermediate/03](../gitlab-intermediate/03-docker-registry.md) |

---

## Резюме

Supply chain security — **SBOM + scan + sign + admission**. Без подписи registry — доверие «на слово».

---

## Чек-лист

- [ ] Генерируете ли SBOM для prod images?
- [ ] Блокируете ли deploy unsigned image?
- [ ] SLA на critical CVE в base image?

**Дальше:** [09. Облако](09-cloud-misconfig.md).
