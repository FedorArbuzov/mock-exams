# 09. Stream-aligned и платформенные команды

## Введение

Самый частый провал: **platform** делает фичи бизнеса, а **streams** ждут «деплой от ДевОпсов». Или наоборот — 12 streams поднимают **свой** EKS «как умеют». Эта глава — **операционная модель** двух столпов.

---

## Stream-aligned: минимальный charter

Документ на 1 страницу:

| Раздел | Содержание |
|--------|------------|
| Mission | пользовательский outcome |
| Services owned | repos, namespaces |
| SLO | ссылка на [sre/03](../sre/03-sli-slo-sla.md) |
| On-call | ротация внутри squad |
| Dependencies | API/events на другие streams |

**Владеет** runbook, не «бросает через стену».

---

## Platform: минимальный charter

| Раздел | Содержание |
|--------|------------|
| Mission | ускорить streams, снизить cognitive load |
| Products | CI templates, clusters, secrets, docs |
| SLO | availability IDP, lead time template adoption |
| **Не делает** | product features, custom one-off без backlog |

Пример backlog platform в mock-exams:

1. `mockctl up` one-liner + docs
2. GitLab template → build → push → deploy mockctl
3. kube-prometheus baseline
4. Vault auth для CI

---

## Cognitive load

Team Topologies вводит **три вида нагрузки**:

| Вид | Пример | Кто снимает |
|-----|--------|-------------|
| **Intrinsic** | домен checkout | stream |
| **Extraneous** | «как поднять TLS в ingress» | platform (golden path) |
| **Germane** | обучение новому инструменту | enabling, затем stream |

Platform **снимает extraneous** — не «делает за них бизнес-логику».

---

## Team API

**Team API** (контракт команды для других):

```markdown
## Platform team API
- Slack: #platform
- Docs: /platform/runbooks
- Request: GitLab issue template «platform-request»
- SLA: P2 — 2 business days, P1 — on-call
- Provides: EKS namespace, CI template v3, OTel collector endpoint
- Does NOT: write application code
```

Публичный API снижает **collaboration** до необходимого минимума.

---

## Размер команд

Ориентир **Team Topologies / Amazon two-pizza**:

- stream: **4–8** инженеров на один чёткий flow;
- platform: **6–12** на множество streams (с sub-groups по domain);
- слишком большой stream → split по под-домену.

---

## Резюме

Stream **несёт** ценность; platform **снимает** трение. Оба измеряются разными метриками — не смешивайте в одном KPI.

---

## Чек-лист

- [ ] У stream есть письменный список owned services?
- [ ] У platform есть «не делаем»?
- [ ] Один extraneous pain point platform сняла за квартал?

**Дальше:** [10. CI/CD как культурный контракт](10-cicd-culture.md).
