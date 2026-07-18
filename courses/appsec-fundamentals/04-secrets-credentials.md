# 04. Секреты и учётные данные

## Введение

Утечка **одного** токена в Git — классика инцидентов: доступ к registry, cloud account, prod DB. DevSecOps отвечает за **где хранятся**, **как попадают в runtime** и **как ротируются** секреты — не за выбор пароля `Password123`.

---

## Классы секретов

| Тип | Примеры | TTL |
|-----|---------|-----|
| Human | SSH key, console password | месяцы + MFA |
| Machine long-lived | API key в `.env` | **избегать** |
| Machine short-lived | OIDC → STS, Vault lease | минуты–часы |
| Bootstrap | Vault unseal (Shamir) | ceremony |

**Правило:** в prod предпочитать **short-lived** + **audience-scoped** (роль только для deploy, не admin).

---

## Антипаттерны

| Где | Проблема |
|-----|----------|
| Git / MR diff | secret detection должен блокировать |
| Dockerfile `ENV KEY=...` | слой в registry навсегда |
| K8s Secret base64 | не шифрование; RBAC + etcd encryption |
| CI variables «masked» но в log | echo в script |
| Terraform state | plaintext secrets в S3 без encryption |
| Slack / ticket | «вот kubeconfig» |

---

## Жизненный цикл

```text
Create → Distribute → Use → Rotate → Revoke
```

| Этап | Практика |
|------|----------|
| Create | Vault / cloud SM / sealed secrets |
| Distribute | CSI driver, Agent sidecar, External Secrets |
| Use | file mount, not env (спорно; env проще утечь в `/proc`) |
| Rotate | автомат + dual-read window |
| Revoke | при увольнении, компрометации, end of project |

Связь: [secrets-basic](../secrets-basic/README.md), [secrets-advanced](../secrets-advanced/README.md).

---

## GitLab / CI

| Механизм | Зачем |
|----------|--------|
| Masked + protected variables | только protected branch |
| OIDC to cloud | без static AWS keys |
| Separate env scopes | staging ≠ prod |

Связь: [gitlab-basic/07](../gitlab-basic/07-variables-secrets.md), [aws-intermediate/21](../aws-intermediate/21-security-ci.md).

---

## Kubernetes

| Объект | Риск |
|--------|------|
| Secret в default NS | любой с `get secrets` |
| SA token auto-mount | лишние credentials в pod |
| etcd без encryption | snapshot = все секреты |

Контроли: namespace isolation, [RBAC](../kuber-intermediate/09-rbac.md), [PSA Restricted](../kuber-advanced/18-pod-security.md), External Secrets Operator.

---

## Обнаружение утечек

- **gitleaks / GitLab secret detection** на каждый push.
- **TruffleHog** на историю при onboarding репо.
- **Ротация** всех ключей, если secret попал в public fork — даже «удалили коммит».

---

## В mock-exams

| Практика | Курс |
|----------|------|
| Vault KV + policies | [secrets-basic](../secrets-basic/README.md) |
| K8s Secret vs Vault | [secrets-basic/12](../secrets-basic/12-comparison-managers.md) |
| KMS | [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md) |

---

## Резюме

Секреты — **данные с lifecycle**, не строка в values.yaml. Цель — **короткий TTL**, **минимальный blast radius**, **автоматическое обнаружение** в git и CI.

---

## Чек-лист

- [ ] Есть ли long-lived cloud keys в CI?
- [ ] Ротируются ли registry credentials?
- [ ] Secret detection блокирует merge?

**Дальше:** [05. Контейнеры](05-container-security.md).
