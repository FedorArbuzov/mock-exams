# 02. Threat modeling: STRIDE и границы доверия

## Введение

Перед покупкой WAF спросите: **от кого и что защищаем?** Threat model — структурированный ответ: активы, границы доверия, угрозы, контрмеры. Для DevOps это не «только для AppSec»: модель нужна для **K8s namespace, CI runner, S3 bucket**.

---

## Активы и trust boundaries

| Актив | Примеры |
|-------|---------|
| Данные | PII, полисы, платежи, логи с email |
| Секреты | API keys, kubeconfig, Terraform state |
| Сервисы | API, worker, admin UI |
| Инфраструктура | кластер, registry, Vault |

**Trust boundary** — линия, где уровень доверия меняется:

```text
[ Internet ] ----boundary---- [ Ingress / WAF ]
                                    |
[ Ingress ] ----boundary---- [ App namespace ]
                                    |
[ App ] ----boundary---- [ Data: RDS / Vault ]
```

Каждая граница — кандидат на **аутентификацию, шифрование, аудит**.

---

## STRIDE (кратко)

| Угроза | Смысл | Пример в infra |
|--------|--------|----------------|
| **S**poofing | подмена identity | поддельный JWT, stolen SA token |
| **T**ampering | изменение данных | MITM без TLS, tampered image |
| **R**epudiation | отрицание действия | нет audit log |
| **I**nformation disclosure | утечка | S3 public, `kubectl logs` с паролями |
| **D**enial of service | недоступность | flood Ingress, etcd full |
| **E**levation of privilege | больше прав | cluster-admin SA в default NS |

Для **pipeline**: Spoofing (подмена commit), Tampering (poisoned dependency), Elevation (runner с prod credentials).

---

## Data flow diagram (DFD)

Минимум для одного сервиса:

```text
User → TLS → Ingress → Service → Pod → RDS
              ↓
           GitLab CI → Registry → deploy
```

Пометьте:

- протокол и **TLS terminate** где;
- где **секреты** появляются (env, Vault, K8s Secret);
- **кто** может вызвать каждый компонент.

---

## Lightweight process (1–2 часа)

1. **Scope** — один сервис или namespace.
2. **Diagram** — 5–10 блоков, не вся компания.
3. **STRIDE по границам** — top 5 рисков.
4. **Controls** — что уже есть, что добавить.
5. **Backlog** — issues с owner и severity.

Не ждите идеальной диаграммы в Visio — **Markdown + ASCII** достаточно.

---

## Типовые ошибки

| Ошибка | Последствие |
|--------|-------------|
| TM только на paper | не обновляют после миграции в K8s |
| «У нас firewall» | не моделируют insider / compromised CI |
| Один огромный TM на весь холдинг | ничего не внедряют |
| Нет приоритизации | 200 «угроз» без действий |

---

## В mock-exams

| Практика | Курс |
|----------|------|
| Threat model хоста | [linux-security/01](../linux-security/01-threat-model.md) |
| Production readiness | [sre/14](../sre/14-production-readiness.md) |
| Security zones | [networking-deep/14](../networking-deep/14-security-zones.md) |

---

## Резюме

Threat model связывает **архитектуру** с **конкретными контролями**. STRIDE — шпаргалка, не ритуал; DFD — способ не забыть CI и secrets.

---

## Чек-лист

- [ ] Нарисуйте 3 trust boundaries для вашего API.
- [ ] Одна угроза Spoofing и одна Elevation для CI?
- [ ] Где у вас repudiation risk (нет audit)?

**Дальше:** [03. OWASP и уровень приложения](03-owasp-app-layer.md).
