# AppSec Fundamentals

Теоретический курс **прикладной безопасности для DevOps / Platform / SRE**: threat modeling, атаки на **контейнеры, Kubernetes, CI/CD и облако**, supply chain, shift-left и связь с практикой в mock-exams. Формат «книги» на русском, **без отдельного стенда**.

**Для кого:** DevSecOps, platform engineer, SRE с задачами hardening; те, кто готовится к вакансиям **Cloud / Infra / K8s Security** (в т.ч. страхование, финтех, РФ-облака).

**Предварительно (желательно):**

| Курс | Зачем |
|------|--------|
| [containers-basic/14](../containers-basic/14-security.md) | non-root, scan образов |
| [kuber-intermediate](../kuber-intermediate/README.md) | RBAC, NetworkPolicy |
| [gitlab-basic](../gitlab-basic/README.md) | pipeline, variables |
| [linux-security/01](../linux-security/01-threat-model.md) | threat model на хосте |

**Полезно параллельно:** [gitlab-advanced](../gitlab-advanced/README.md), [kuber-advanced](../kuber-advanced/README.md) фаза 2, [aws-intermediate/21](../aws-intermediate/21-security-ci.md), [secrets-*](../secrets-basic/README.md).

## Как читать

- Главы **01–12** — по **35–50 минут**; с конспектом — до **70 минут**.
- Блок **«В mock-exams»** — hands-on в других курсах.
- [Финал](14-synthesis.md) — **Threat Model + Security Baseline** для одного сервиса (**2–3 часа**).

**Время:** ~**14–18 часов** на весь курс.

## Программа

### Часть I — Основы и модель угроз (01–03)

| № | Глава |
|---|--------|
| 01 | [AppSec, DevSecOps и shift-left](01-intro-devsecops.md) |
| 02 | [Threat modeling: STRIDE и границы доверия](02-threat-modeling.md) |
| 03 | [Уровень приложения: OWASP и типовые атаки](03-owasp-app-layer.md) |

### Часть II — Инфраструктура и поставка (04–08)

| № | Глава |
|---|--------|
| 04 | [Секреты и учётные данные](04-secrets-credentials.md) |
| 05 | [Контейнеры: escape, capabilities, misconfig](05-container-security.md) |
| 06 | [Kubernetes: типовые misconfiguration](06-kubernetes-misconfig.md) |
| 07 | [Атаки на CI/CD и pipeline](07-cicd-attacks.md) |
| 08 | [Supply chain: зависимости, SBOM, подпись](08-supply-chain.md) |

### Часть III — Облако, IaC, обнаружение (09–11)

| № | Глава |
|---|--------|
| 09 | [Облако: IAM, сети, шифрование, публичные ресурсы](09-cloud-misconfig.md) |
| 10 | [IaC и policy as code](10-iac-policy.md) |
| 11 | [Обнаружение, аудит и реагирование](11-detection-response.md) |

### Часть IV — Процесс и синтез (12–14)

| № | Глава |
|---|--------|
| 12 | [Secure SDLC: gates, исключения, риск](12-secure-sdlc.md) |
| 13 | [Compliance и benchmarks для инженера](13-compliance-benchmarks.md) |
| 14 | [Синтез: threat model и security baseline](14-synthesis.md) |

## Что должно получиться

- Проводите **lightweight threat model** для сервиса в K8s + CI + cloud.
- Называете **10+ типовых misconfig** K8s и облака и как их ловить автоматически.
- Объясняете цепочку **commit → SAST → image scan → admission → runtime**.
- Составляете **security baseline** (чеклист + owners) для namespace или account.
- На собеседовании связываете **DevSecOps** с практикой из mock-exams, не только с buzzwords.

## Требования

Только чтение. Для финала — вымышленный или реальный микросервис (API + DB + CI).

## Связь с другими курсами

| Тема | Практика |
|------|----------|
| SAST, Trivy, secrets in CI | [gitlab-advanced](../gitlab-advanced/README.md) |
| Pod Security, Kyverno, cosign | [kuber-advanced](../kuber-advanced/README.md) фазы 2, 4 |
| tfsec, checkov, OIDC | [aws-intermediate/21](../aws-intermediate/21-security-ci.md) |
| GuardDuty, KMS, audit | [aws-advanced/19–22](../aws-advanced/README.md) |
| Vault, rotation | [secrets-advanced](../secrets-advanced/README.md) |
| Host hardening | [linux-security](../linux-security/README.md) |

После курса: [gitlab-advanced](../gitlab-advanced/README.md), [kuber-advanced](../kuber-advanced/README.md), [postgresql-security](../postgresql-security/README.md), [networking-deep/14](../networking-deep/14-security-zones.md).
