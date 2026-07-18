# 11. Изменения как главный риск

## Введение: «ничего не падало, пока не выкатили»

Статистика индустрии (и опыт Google): **большинство** production outages связаны с **изменениями** — код, конфиг, infra, ACL, DNS. Железо падает реже, чем **релиз в пятницу 17:00**. SRE не «против изменений» — изменения **нужны** для продукта — но за **скоростью** стоит **дисциплина**: canary, feature flags, GitOps, review, freeze при низком budget.

---

## Типы изменений

| Тип | Пример | Риск |
|-----|--------|------|
| **Application** | новый binary | logic bugs |
| **Config** | feature flag | instant blast |
| **Infrastructure** | node upgrade | platform-wide |
| **Data** | schema migration | irreversible |
| **Traffic** | DNS cutover | 100% users |

Каждый тип — свой **runbook** и **rollback time**.

---

## Change management без бюрократии

| Принцип | Практика |
|---------|----------|
| **Small batches** | маленькие PR, частые deploys |
| **Automate** | CI/CD, GitOps ([gitops-*](../gitops-basic/README.md)) |
| **Observable** | deploy markers на dashboards |
| **Reversible** | rollback < 15 min |
| **Gated** | canary, approval при risk |

**CAB** (Change Advisory Board) в enterprise — полезен для **shared infra**; для product team — **automated policy** + SLO gate.

---

## Canary и progressive delivery

```text
1% traffic → metrics OK → 10% → 50% → 100%
         ↘ fail → rollback
```

| Сигнал canary | Порог |
|---------------|-------|
| Error rate | vs baseline + ε |
| Latency p99 | +X% |
| Business metric | conversion drop |

**Flagger**, Argo Rollouts, mesh traffic split — инструменты; **смысл** — ранний отказ при малом blast radius.

---

## Feature flags

| Плюс | Минус |
|------|-------|
| kill switch без redeploy | flag debt, сложность |
| cohort rollout | незакрытые flags |

SRE требует: **owner** flag, **TTL**, audit кто включил в prod.

---

## GitOps и immutable artifacts

```text
CI: build image digest abc123
GitOps: update tag abc123
Argo: sync
```

**Digest**, не `latest` — воспроизводимость ([gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md)).

---

## Database migrations

| Правило | Зачем |
|---------|-------|
| **Backward compatible** expand | app v1 и v2 живут вместе |
| **Two-phase** deploy | add column → migrate → remove old |
| **Backup before** | rollback data |
| **Test on copy** | prod-like volume |

Expand-contract pattern — must-know для SRE interview.

---

## Release freeze

При **error budget < 10%** ([глава 04](04-error-budgets.md)):

- только hotfix и security;
- исключения — VP + written risk acceptance.

**Change freeze** на праздники — отдельное решение бизнеса.

---

## Deployment metadata

Каждый deploy должен оставлять:

- git SHA / image digest в **annotations** Pod;
- event в CI;
- **Grafana annotation** «deploy service X».

Инцидент «после 14:10» → сразу видно **версию** ([глава 06](06-observability-for-sre.md)).

---

## В mock-exams

| Практика | Курс |
|----------|------|
| GitLab pipeline | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| Argo sync | [gitops-basic](../gitops-basic/README.md) |
| Helm values | [kuber-intermediate/07](../kuber-intermediate/07-helm.md) |

---

## Чек-лист

- [ ] Rollback проверен за последний квартал?
- [ ] Canary на critical path?
- [ ] Миграции БД — expand-contract?
- [ ] Deploy visible на SLO dashboard?

**Дальше:** [12. DR, RTO/RPO](12-disaster-recovery.md).
