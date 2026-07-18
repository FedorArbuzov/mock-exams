# 14. Синтез: карта команд и DORA baseline

## Практическое задание

Выберите организацию:

- реальную (без секретов в публичном fork), или
- учебную: **image-platform** ([aws-intermediate](../aws-intermediate/projects/image-platform/)) + GitLab + mockctl — 3 squads, 1 platform.

### Deliverables (2–3 часа)

**1. Org + Conway (1 стр.)**

- Текущая схема команд (boxes).
- Схема сервисов/repos.
- 3 предложения: где Conway **совпадает**, где **мешает**.

**2. Target Team Topologies (1 стр.)**

| Команда | Тип | Владеет | Interaction с platform |
|---------|-----|---------|------------------------|
| … | stream / platform / enabling | … | collaboration / X-as-a-Service / facilitating |

**3. DORA baseline (таблица)**

| Метрика | Текущее (оценка) | Цель 6 мес | Как измерить |
|---------|------------------|------------|--------------|
| Deployment frequency | | | GitLab deploy job |
| Lead time | | | MR merged → prod |
| Change failure rate | | | incidents / deploys |
| Time to restore | | | postmortem data |

**4. Platform Team API (½ стр.)**

Что platform **даёт**, **не даёт**, SLA, канал связи.

**5. Три антипаттерна + действие**

Из [главы 12](12-anti-patterns.md) — что исправить первым кварталом.

---

## Карта курса

```text
01–02   Культура и роли           →  «зачем и кто»
03–04   DORA                      →  «как измерить flow»
05–06   Conway                    →  «структура = архитектура»
07–08   Team Topologies           →  «типы и режимы»
09–10   Stream/platform + CI/CD   →  «как работает день»
11–12   Trust + антипаттерны      →  «что убивает»
13–14   Метрики + синтез          →  «ваш план»
```

---

## Вопросы с собеседований

### 1. Четыре DORA-метрики?

Deployment frequency, lead time for changes, change failure rate, time to restore service.

### 2. Conway's law?

Системы повторяют коммуникационную структуру организации.

### 3. Четыре типа команд Team Topologies?

Stream-aligned, platform, enabling, complicated-subsystem.

### 4. Три режима взаимодействия?

Collaboration, X-as-a-Service, facilitating.

### 5. DevOps vs SRE vs Platform одной фразой?

DevOps — культура flow; SRE — практика надёжности с SLO; Platform — внутренний продукт для dev.

### 6. Почему «отдел DevOps» — антипаттерн?

Возвращает стену; streams не владеют prod; platform становится bottleneck.

### 7. Blameless postmortem?

Фокус на системных причинах без наказания за ошибку; accountability через actions.

---

## В mock-exams — дальше

| Цель | Курс |
|------|------|
| SLO и инциденты | [sre](../sre/README.md) |
| CI/CD hands-on | [gitlab-advanced](../gitlab-advanced/README.md) |
| GitOps delivery | [gitops-intermediate](../gitops-intermediate/README.md) |
| Cost culture | [finops](../finops/README.md) |
| Org SRE models | [sre/13](../sre/13-organizing-sre.md) |

---

## Мастер чек-лист

- [ ] Могу нарисовать stream + platform для продукта
- [ ] Знаю текущий lead time (хотя бы оценочно)
- [ ] Platform имеет published API
- [ ] Нет единственного hero on-call
- [ ] Postmortem actions закрываются
- [ ] Conway обсуждается при split сервисов

---

## Резюме

DevOps culture course завершён, когда есть **письменный** target topology и **измеримый** DORA baseline — не когда прочитаны все главы.
