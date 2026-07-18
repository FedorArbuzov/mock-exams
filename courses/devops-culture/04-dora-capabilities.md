# 04. DORA capabilities и ловушки измерения

## Введение

Метрики — **следствие**. Accelerate / DORA research описывает **capabilities** (способности организации), которые **коррелируют** с четырьмя метриками. Внедрять «больше деплоев» без capabilities — gamification.

---

## Ключевые capabilities (упрощённо)

| Capability | Практики |
|------------|----------|
| **Version control** | всё в Git, infra as code |
| **CI** | автотест на каждый commit |
| **CD** | деплой по кнопке/merge, не ручной SSH |
| **Trunk-based development** | короткоживущие ветки |
| **Test automation** | пирамида тестов, не только e2e |
| **Loosely coupled architecture** | независимые deploy units |
| **Empowered teams** | squad владеет сервисом end-to-end |
| **Monitoring** | observability, не только ping |
| **Proactive notification** | алерты на SLO, не на CPU |
| **Healthy culture** | trust, learning ([глава 11](11-trust-and-incidents.md)) |

В mock-exams: [aws-terraform](../aws-terraform/README.md), [gitlab-advanced](../gitlab-advanced/README.md) SAST, [gitops](../gitops-basic/README.md).

---

## Ловушки измерения

| Ловушка | Почему плохо |
|---------|--------------|
| Деплой = «kubectl apply» без трафика | накрутка frequency |
| Игнорировать rollback | CFR занижен |
| Среднее lead time без перцентилей | p50=1д, p95=30д |
| Сравнение разных продуктов одной цифрой | разный risk profile |
| KPI на команду без autonomy | токсичная гонка |

Используйте **p50 / p95** для lead time и restore time.

---

## Trunk-based vs GitFlow

| | Trunk-based | Long-lived branches |
|---|-------------|---------------------|
| Lead time | короче | merge hell |
| Подходит | SaaS, K8s | редкие релизы embedded |
| CI нагрузка | стабильная | пики перед release |

[gitlab-basic](../gitlab-basic/README.md) MR — ближе к trunk при **коротких** ветках.

---

## Architectural coupling

**Tightly coupled** системы → один деплой «всего», высокий CFR при любом изменении.

**Loosely coupled** (микросервисы **или** модульный монолит с чёткими границами) → независимые метрики на squad.

Conway ([глава 05](05-conway-law.md)) объясняет, почему «разбили на 50 микросервисов одной командой» не работает.

---

## Резюме

Улучшайте **capabilities**, метрики подтянутся. Gamification DORA без архитектуры и тестов — theater.

---

## Чек-лист

- [ ] Есть ли у вас CD или «ручной последний шаг»?
- [ ] Какой p95 lead time за последний квартал?
- [ ] Одна команда на сколько deployable units?

**Дальше:** [05. Закон Конвея](05-conway-law.md).
