# 12. Антипаттерны: герои, стена, «отдел DevOps»

## Введение

Знать модели — половина дела. Вторая — **узнавать яды**, которые убивают flow. Ниже — частые антипаттерны в компаниях «после DevOps-трансформации».

---

## «Отдел DevOps»

| Симптом | Лечение |
|---------|---------|
| dev бросает jar over the wall | stream ownership + you build it |
| DevOps «деплоит за всех» | platform self-service |
| DevOps = единственный on-call | embed / rotate в squads |

DevOps — **культура**, не **силос**.

---

## Hero culture

| Симптом | Риск |
|---------|------|
| «позовите Олега» | bus factor, burnout |
| ночные «спасения» без PM | нормализация отклонения |
| нет runbooks | знание в голове |

Герои **краткосрочно** выгодны, **долгосрочно** — анти-DORA (MTTR зависит от одного человека).

---

## Ticket-driven platform

Platform с очередью 3 недели → streams **обходят** (shadow IT, свои кластеры).

**Лечение:** X-as-a-Service, SLAs, self-service 80% запросов.

---

## Metric theater

| Theater | Реальность |
|---------|------------|
| 1000 pipeline runs | 950 — lint на feature branch никогда не merged |
| «5 nines» marketing | нет SLO measurement |
| velocity story points ↑ | lead time не изменился |

[sre/03](../sre/03-sli-slo-sla.md) + [глава 13](13-metrics-maturity.md).

---

## Architecture astronauts

Микросервисы **без** org split ([глава 05](05-conway-law.md)):

- distributed monolith;
- 3-hop sync chain для «получить user»;
- CFR ↑, frequency ↓.

---

## Tool-first transformation

«Купили GitLab Ultimate» → **нет** MR culture.  
«Поставили Kubernetes» → **нет** platform team.

Инструмент **усиливает** культуру, не создаёт.

---

## Резюме

Антипаттерны — диагностика зрелости. Если узнали 3+ — приоритет **орг**, не новый Helm chart.

---

## Чек-лист

- [ ] Есть ли «отдел DevOps» отдельно от product?
- [ ] Кто hero на prod — один человек?
- [ ] Platform — очередь или продукт?

**Дальше:** [13. Метрики зрелости](13-metrics-maturity.md).
