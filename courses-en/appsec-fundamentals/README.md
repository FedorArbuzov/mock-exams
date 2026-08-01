# AppSec Fundamentals

A theory course on **application security for DevOps / Platform / SRE**: threat modeling, attacks on **containers, Kubernetes, CI/CD and the cloud**, supply chain, shift-left, and the connection to hands-on practice in mock-exams. A "book"-style format in English, **without a separate lab environment**.

**Who it's for:** DevSecOps, platform engineers, SREs working on hardening; anyone preparing for **Cloud / Infra / K8s Security** roles (including insurance, fintech, Russian cloud providers).

**Prerequisites (recommended):**

| Course | Why |
|------|--------|
| [containers-basic/14](../containers-basic/14-security.md) | non-root, image scanning |
| [kuber-intermediate](../kuber-intermediate/README.md) | RBAC, NetworkPolicy |
| [gitlab-basic](../gitlab-basic/README.md) | pipeline, variables |
| [linux-security/01](../linux-security/01-threat-model.md) | threat model on a host |

**Useful in parallel:** [gitlab-advanced](../gitlab-advanced/README.md), [kuber-advanced](../kuber-advanced/README.md) phase 2, [aws-intermediate/21](../aws-intermediate/21-security-ci.md), [secrets-*](../secrets-basic/README.md).

## How to read

- Chapters **01–12** — **35–50 minutes** each; with notes, up to **70 minutes**.
- The **"In mock-exams"** block — hands-on in other courses.
- [Final](14-synthesis.md) — **Threat Model + Security Baseline** for a single service (**2–3 hours**).

**Time:** ~**14–18 hours** for the whole course.

## Curriculum

### Part I — Fundamentals and threat model (01–03)

| # | Chapter |
|---|--------|
| 01 | [AppSec, DevSecOps and shift-left](01-intro-devsecops.md) |
| 02 | [Threat modeling: STRIDE and trust boundaries](02-threat-modeling.md) |
| 03 | [Application layer: OWASP and common attacks](03-owasp-app-layer.md) |

### Part II — Infrastructure and delivery (04–08)

| # | Chapter |
|---|--------|
| 04 | [Secrets and credentials](04-secrets-credentials.md) |
| 05 | [Containers: escape, capabilities, misconfig](05-container-security.md) |
| 06 | [Kubernetes: common misconfigurations](06-kubernetes-misconfig.md) |
| 07 | [Attacks on CI/CD and the pipeline](07-cicd-attacks.md) |
| 08 | [Supply chain: dependencies, SBOM, signing](08-supply-chain.md) |

### Part III — Cloud, IaC, detection (09–11)

| # | Chapter |
|---|--------|
| 09 | [Cloud: IAM, networks, encryption, public resources](09-cloud-misconfig.md) |
| 10 | [IaC and policy as code](10-iac-policy.md) |
| 11 | [Detection, audit and response](11-detection-response.md) |

### Part IV — Process and synthesis (12–14)

| # | Chapter |
|---|--------|
| 12 | [Secure SDLC: gates, exceptions, risk](12-secure-sdlc.md) |
| 13 | [Compliance and benchmarks for engineers](13-compliance-benchmarks.md) |
| 14 | [Synthesis: threat model and security baseline](14-synthesis.md) |

## What you should end up with

- You can run a **lightweight threat model** for a service on K8s + CI + cloud.
- You can name **10+ common misconfigs** in K8s and the cloud and how to catch them automatically.
- You can explain the **commit → SAST → image scan → admission → runtime** chain.
- You can build a **security baseline** (checklist + owners) for a namespace or account.
- In an interview you connect **DevSecOps** to hands-on practice from mock-exams, not just buzzwords.

## Requirements

Reading only. For the final — a fictional or real microservice (API + DB + CI).

## Related courses

| Topic | Practice |
|------|----------|
| SAST, Trivy, secrets in CI | [gitlab-advanced](../gitlab-advanced/README.md) |
| Pod Security, Kyverno, cosign | [kuber-advanced](../kuber-advanced/README.md) phases 2, 4 |
| tfsec, checkov, OIDC | [aws-intermediate/21](../aws-intermediate/21-security-ci.md) |
| GuardDuty, KMS, audit | [aws-advanced/19–22](../aws-advanced/README.md) |
| Vault, rotation | [secrets-advanced](../secrets-advanced/README.md) |
| Host hardening | [linux-security](../linux-security/README.md) |

After the course: [gitlab-advanced](../gitlab-advanced/README.md), [kuber-advanced](../kuber-advanced/README.md), [postgresql-security](../postgresql-security/README.md), [networking-deep/14](../networking-deep/14-security-zones.md).
