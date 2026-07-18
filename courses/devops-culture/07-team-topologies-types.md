# 07. Team Topologies: четыре типа команд

## Введение

*Team Topologies* (Matthew Skelton, Manuel Pais) — практическая модель **четырёх типов команд** и **трёх режимов взаимодействия**. Цель — **быстрый flow** в stream-aligned teams при **минимальной** когнитивной нагрузке.

---

## Четыре типа

| Тип | Миссия | Пример в mock-exams |
|-----|--------|---------------------|
| **Stream-aligned** | доставка **ценности** пользователю (фича, продукт) | squad «image upload API» |
| **Platform** | **ускорить** streams через self-service | команда `mockctl` + GitLab + observability stack |
| **Enabling** | **временно** поднимает компетенции (coach) | помочь squad внедрить SLO / GitOps |
| **Complicated-subsystem** | **глубокая** экспертиза (math, legacy, hardware) | ядро billing, FPGA, старый mainframe bridge |

Большинство людей — в **stream-aligned**. Platform **не** делает фичи продукта.

---

## Stream-aligned team

**Владеет** полным потоком:

```text
Ideation → code → test → deploy → operate → learn
```

| Хорошо | Плохо |
|--------|-------|
| end-to-end ownership | «мы только пишем код, ops чужие» |
| метрики продукта | 47 тикетов в другие очереди |

Связь DORA: frequency и lead time **по squad**.

---

## Platform team

**Трактовать как внутренний SaaS:**

- documentation, APIs, templates;
- **golden paths** ([gitlab-intermediate](../gitlab-intermediate/README.md) deploy mockctl);
- SLO platform: «deploy за 15 минут», «cluster API 99.9%».

**Не** platform: «мы единственные, кто может kubectl apply».

---

## Enabling team

**Временное** взаимодействие: 2–3 месяца помочь squad освоить тесты, security, observability — затем **отойти**.

Постоянное enabling без выхода — **зависимость** и скрытый staff aug.

---

## Complicated-subsystem team

Когда домен **слишком сложен**, чтобы каждый stream дублировал экспертизу:

- оптимизация query engine;
- codec / crypto;
- интеграция с регуляторным ядром.

Поставляют **библиотеку / сервис** streams, не забирают ownership продукта.

---

## Резюме

Четыре типа — **не оргчарт на века**, а **лензы**. Каждая команда должна знать свой тип и **режим** связи с другими ([глава 08](08-interaction-modes.md)).

---

## Чек-лист

- [ ] Ваша команда — stream, platform, enabling или subsystem?
- [ ] Сколько platform на сколько streams (ориентир 1:4–8)?
- [ ] Enabling «никогда не уходит»?

**Дальше:** [08. Режимы взаимодействия](08-interaction-modes.md).
