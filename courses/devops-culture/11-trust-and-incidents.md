# 11. Психологическая безопасность и инциденты

## Введение

DORA capability **«generative culture»** / **«learning culture»** — коррелирует с performance сильнее, чем ещё один Jenkins agent. Без **доверия** postmortem и частые деплои невозможны.

Развёрнуто: [sre/08–09](../sre/08-incident-management.md) — здесь **организационный** слой.

---

## Westrum: типы культуры

| Тип | Поведение при инциденте |
|-----|-------------------------|
| **Pathological** | поиск виноватых, сокрытие |
| **Bureaucratic** | процедуры важнее fix |
| **Generative** | фокус на системе, обучение |

DevOps/SRE целятся в **generative** — не «всё разрешено», а **blameless** расследование.

---

## Blameless ≠ безответственность

| Blameless | Accountability |
|-----------|----------------|
| не наказываем за ошибку при нажатии deploy | владеем action items |
| ищем systemic cause | меняем процесс/код |
| IC фокусируется на restore | PM следит за comms |

[sre/09-postmortems](../sre/09-postmortems.md): actions с owner и due date.

---

## On-call как культурный сигнал

| Сигнал доверия | Сигнал страха |
|----------------|---------------|
| runbook есть | «только Вася знает» |
| компенсация / time off | hero nights без учёта |
| post-incident fix priority | «так бывает» |

On-call **внутри stream-aligned** team — ownership. Centralized «дежурные админы» без контекста — **стена** снова.

---

## Психологическая безопасность в MR

- review **кода**, не личности;
- «обязательный» security finding — не стыд;
- senior может ошибиться публично.

Platform **не** использует MR как поле битвы «мы vs вы».

---

## Эксперименты и error budget

[sre/04](../sre/04-error-budgets.md): budget даёт **право** рисковать релизами. Культура без budget → **скрытые** релизы в пятницу ночью.

---

## Резюме

Метрики DORA падают, когда люди **боятся** деплоить и **скрывают** инциденты. Trust — infrastructure выше Kubernetes.

---

## Чек-лист

- [ ] Последний postmortem — systemic actions?
- [ ] Можно ли сказать «я сломал prod» без карьерного страха?
- [ ] On-call ротация справедлива?

**Дальше:** [12. Антипаттерны](12-anti-patterns.md).
