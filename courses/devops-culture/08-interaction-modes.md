# 08. Режимы взаимодействия команд

## Введение

Team Topologies задаёт **три режима** между командами. Неправильный режим → bottlenecks: platform в **collaboration** на каждый чих или streams **заброшены** без поддержки.

---

## Три режима

| Режим | Суть | Когда |
|-------|------|-------|
| **Collaboration** | плотная совместная работа | discovery, новый продукт, кризис |
| **X-as-a-Service** | чёткий API, минимум синхронных встреч | platform ↔ streams (зрелая платформа) |
| **Facilitating** | одна команда помогает другой расти | enabling → stream |

```text
        Collaboration (временно, узкий фокус)
              ↕
Stream ◄──► Platform  (X-as-a-Service — основной режим)
              ↕
        Facilitating (enabling team)
```

---

## Collaboration — осторожно

**Плюс:** быстрое обучение, общее понимание.  
**Минус:** **одна** команда на **две** дороги; WIP ↑; platform тянут в фичи.

**Правило:** timebox collaboration (6–8 недель), явная **цель выхода** в X-as-a-Service.

---

## X-as-a-Service

Platform предоставляет:

- `gitlab-ci` template с deploy на mockctl;
- Terraform module VPC;
- dashboard Grafana «paste your labels».

Stream **не ждёт** platform на созвоне — читает docs, открывает MR в module.

Метрики platform: time-to-first-successful-deploy, ticket rate, NPS devs.

---

## Facilitating

Enabling проводит:

- pairing на написание SLO;
- workshop NetworkPolicy;
- review postmortem process.

**Не** берёт on-call за stream.

---

## Выбор режима по зрелости

| Зрелость platform | Режим |
|-------------------|--------|
| Низкая (новый IDP) | collaboration + facilitating |
| Средняя | facilitating + рост X-as-a-Service |
| Высокая | преимущественно X-as-a-Service |

---

## Резюме

Режим — **осознанный выбор**, не «как сложилось». Platform по умолчанию — **X-as-a-Service**, не бесконечный collaboration.

---

## Чек-лист

- [ ] Platform на скольких squad-созвонах обязателен еженедельно?
- [ ] Есть ли published API/docs platform?
- [ ] Enabling team сформулировала exit criteria?

**Дальше:** [09. Stream и platform на практике](09-stream-and-platform.md).
