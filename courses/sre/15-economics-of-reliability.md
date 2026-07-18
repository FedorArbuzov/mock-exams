# 15. Экономика надёжности

## Введение: «ещё одна девятка — сколько стоит?»

CTO спрашивает: «Почему нельзя **99,99%** как у конкурента?» Ответ «дорого» без цифр — проигрыш. SRE переводит надёжность в **ожидаемый ущерб**, **стоимость инженерии** и **упущенную выгоду** от замедления релизов. **Экономика** — не Excel ради CFO, а **аргумент** для разумного SLO.

---

## Стоимость downtime

```text
Cost ≈ (Revenue per hour) × (Duration) × (% users affected)
```

| Фактор | Уточнение |
|--------|-----------|
| Revenue/hour | peak vs average |
| % affected | только checkout, не весь сайт |
| Intangible | brand, support load, штрафы SLA |

**Пример:** checkout = 50% revenue, $100k/h total, outage 2h, 100% checkout down → **~$100k** direct (упрощённо).

---

## Стоимость «девятки»

Каждый шаг availability — **нелинейный** рост cost:

| Tier | Часто требует |
|------|----------------|
| 99 → 99,9 | HA, multi-AZ, better monitoring |
| 99,9 → 99,99 | redundancy everywhere, chaos, staff |
| 99,99 → 99,999 | multi-region, custom hardware, org process |

**Marginal cost** последней девятки >> первой.

---

## Cost of speed

| Быстрые релизы | Медленные релизы |
|----------------|------------------|
| time-to-market | конкуренты обгоняют |
| риск багов | меньше change failures |
| тратят budget | копят «технический долг» релиза |

Error budget **балансирует** ([глава 04](04-error-budgets.md)).

---

## Risk-adjusted decisions

```text
Expected loss = P(outage) × Cost(outage)
Investment if: Expected loss > Cost(mitigation)
```

Mitigation: canary ($ engineering weeks), multi-AZ ($ infra/mo).

---

## FinOps и SRE

| Практика | Эффект |
|----------|--------|
| Rightsizing | -30% waste |
| Spot / reserved | predictable cost |
| Label by team | chargeback |
| Kill idle env | staging cost |

Reliability **не** «деньги не считаем» — **осознанный** spend.

---

## Когда **снизить** SLO

Иногда **правильно** ослабить target:

- сервис **не** revenue-critical;
- пользователи **не** чувствуют разницу 99,9 vs 99,95;
- savings → **другой** CUJ.

Документировать решение — **не** тайный долг.

---

## Разговор с продуктом

| Вопрос PM | Ответ SRE |
|-----------|-----------|
| «Почему freeze?» | «Budget 8%, policy» |
| «Сколько стоит 99,99%?» | «+$X/mo, -Y features/quarter» |
| «Можно без мониторинга?» | «Нельзя измерить SLA» |

---

## Чек-лист

- [ ] Посчитан cost/hour для tier-1?
- [ ] SLO согласован с revenue impact?
- [ ] FinOps видит tag по сервису?

**Дальше:** [16. Синтез и практика](16-synthesis-practice.md).
