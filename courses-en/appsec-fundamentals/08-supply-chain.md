# 08. Supply chain: dependencies, SBOM, signing

## Intro

**SolarWinds** and **Log4Shell** showed that an attack through the **supply chain** (a dependency, the build, the registry) hits thousands of customers at once. DevSecOps is responsible for **visibility** (SBOM), **verification** (scan, sign), and **policies** (what can be deployed).

---

## The software supply chain

```text
Source → Dependencies → Build → Artifact → Deploy → Run
   ↑          ↑           ↑         ↑          ↑
 provenance  SCA        reproducible sign    admission
```

---

## Software Composition Analysis (SCA)

| What we scan | Tools |
|---------------|-------------|
| OS packages in the image | Trivy, Grype |
| App deps (npm, pip) | Dependabot, pip-audit, `trivy fs` |
| IaC modules | checkov, tfsec |

| Decision | When |
|---------|--------|
| Block merge on CRITICAL | prod-bound branches |
| Patch SLA | 7 / 30 days by severity |
| Exception process | issue + expiry date |

Practice: [gitlab-advanced/01–03](../gitlab-advanced/README.md).

---

## SBOM (Software Bill of Materials)

A machine-readable list of an image's/application's components.

| Format | Note |
|--------|------------|
| SPDX | compliance-friendly |
| CycloneDX | OWASP, CI integrations |

```bash
trivy image --format cyclonedx -o sbom.json myapp:1.0
```

**Why:** when there's a CVE in Log4j — "which images in prod contain it?" in minutes, not weeks.

---

## Signing artifacts

| Mechanism | Object |
|----------|--------|
| **cosign** (Sigstore) | container image |
| Sigstore keyless | OIDC identity CI → sign |
| Notation | OCI artifacts |

```text
CI build → cosign sign → push registry
Deploy → admission: verify signature before pull
```

Practice: [kuber-advanced/21–22](../kuber-advanced/21-image-security.md).

---

## SLSA (maturity levels)

| Level | Idea |
|-------|------|
| 1 | documented build |
| 2 | signed provenance |
| 3 | hardened build platform |
| 4 | two-person review + hermetic build |

For most teams, **Level 1–2** is a realistic goal for the year.

---

## Base image strategy

| Strategy | Pro |
|-----------|------|
| Distroless / minimal | smaller CVE surface |
| Regular rebuild | patch the OS without an app change |
| Pin digest | reproducibility |
| Internal golden images | centralized hardening |

---

## Typosquatting and malicious packages

| Defense | |
|--------|---|
| Private PyPI/npm proxy | |
| `--require-hashes` pip | |
| Code review on lockfile change | |
| Renounce install scripts in CI (`npm ci` not arbitrary `postinstall` from an MR) | |

---

## In mock-exams

| Topic | Course |
|------|------|
| Trivy SBOM | [gitlab-advanced/03](../gitlab-advanced/03-container-scanning.md) |
| cosign lab | [kuber-advanced/22](../kuber-advanced/22-lab-image-security.md) |
| Registry | [gitlab-intermediate/03](../gitlab-intermediate/03-docker-registry.md) |

---

## Summary

Supply chain security is **SBOM + scan + sign + admission**. Without a signed registry, trust is "on your word".

---

## Checklist

- [ ] Do you generate an SBOM for prod images?
- [ ] Do you block deploying an unsigned image?
- [ ] Is there an SLA for critical CVEs in the base image?

**Next:** [09. Cloud](09-cloud-misconfig.md).
