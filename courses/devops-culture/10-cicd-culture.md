# 10. CI/CD как культурный контракт

## Введение

Pipeline в GitLab — **не** «скрипт сборки», а **договор** между squad и организацией: что должно быть зелёным до merge, кто может трогать prod, как **откатываемся**.

---

## CI как quality gate

```yaml
# культурный смысл, не синтаксис
stages:
  - test      # мы не передаём мусор дальше
  - build
  - scan      # security — часть Definition of Done
  - deploy
```

| Практика | Культура |
|----------|----------|
| MR only | прозрачный review |
| Required pipeline | нет «обхода срочно» |
| Trunk green | main всегда deployable |
| Artifact immutability | один build → prod |

Курсы: [gitlab-basic](../gitlab-basic/README.md) → [intermediate](../gitlab-intermediate/README.md) → [advanced SAST](../gitlab-advanced/01-security-scanning.md).

---

## CD и ответственность

| Модель | Кто жмёт deploy | Культура |
|--------|-----------------|----------|
| **Continuous** | pipeline после merge | высокое доверие + тесты |
| **Manual gate** | человек в GitLab | regulated, но gate должен быть **быстрым** |
| **GitOps** | merge в config repo | [gitops-*](../gitops-basic/README.md), audit trail |

«CD есть, но deploy раз в месяц вручную» — **CD theater**.

---

## Environments как социальный контракт

```text
dev   — ломаем свободно (авто deploy)
stage — как prod, для приёмки
prod  — только из pipeline / GitOps
```

Feature flags ([sre/11](../sre/11-change-and-release.md)) отделяют **deploy** от **release**.

---

## Platform template

Platform публикует **`.gitlab-ci.yml` include**:

- streams **не копируют** 200 строк;
- streams **не отключают** security job без exception process;
- версионирование template — **обратная совместимость**.

Это **X-as-a-Service** ([глава 08](08-interaction-modes.md)).

---

## Split CI / CD (зрелость)

[gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md): CI build image, CD (Argo) sync cluster.

| Плюс | Минус |
|------|-------|
| чёткий audit GitOps | две системы обучения |
| rollback через Git | drift detection нужен |

Культура: **образ** ≠ **конфиг** — разные PR, разные reviewers.

---

## Резюме

CI/CD отражает **доверие**. Без trunk discipline и security в pipeline Conway вынудит **ручные** handoffs.

---

## Чек-лист

- [ ] main всегда зелёный?
- [ ] SAST блокирует critical?
- [ ] Deploy в prod возможен без SSH на сервер?

**Дальше:** [11. Доверие и инциденты](11-trust-and-incidents.md).
