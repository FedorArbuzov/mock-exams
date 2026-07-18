# 12. DR, RTO/RPO и учения

## Введение: «ЦОД сгорел — у нас есть план?»

Регион облака недоступен **4 часа**. Backup есть, но **никто не восстанавливал** из них полгода. DNS указывает на старый кластер. RTO в договоре — **1 час**, реальность — **1 день**. SRE отвечает не только за «Pod перезапустить», но за **пережить катастрофу** с измеримыми обещаниями.

---

## RTO и RPO

| Термин | Определение | Вопрос |
|--------|-------------|--------|
| **RPO** (Recovery Point Objective) | сколько **данных** можно потерять | «Допустимы потери за последние 5 мин?» |
| **RTO** (Recovery Time Objective) | за сколько **восстановить сервис** | «Через сколько часов checkout снова работает?» |

```text
Incident ──►|.... RPO ....|──► last recoverable backup
            ──►|...... RTO ......|──► service restored
```

**Жёстче RPO/RTO** — **дороже** (sync replication, active-active).

---

## Стратегии DR

| Стратегия | RTO | RPO | Cost |
|-----------|-----|-----|------|
| **Backup & restore** | часы–дни | часы | $ |
| **Pilot light** | часы | минуты | $$ |
| **Warm standby** | минуты–часы | минуты | $$$ |
| **Active-active multi-region** | минуты | ~0 | $$$$ |

Выбор — **бизнес**, не SRE в вакууме. Платёжный шлюз и internal wiki — **разные** tier.

---

## Backup: что проверять

| Вопрос | Почему важно |
|--------|--------------|
| Backup **автоматический**? | ручной = забудут |
| **Encrypted**? | compliance |
| **Restore tested**? | backup без restore — надежда |
| **Retention** vs RPO? | daily backup при RPO 1h — не хватит |
| **Cross-region** copy? | region loss |

[postgresql-ops](../postgresql-ops/README.md), [aws-advanced/23](../aws-advanced/23-backup-dr.md).

---

## Runbook DR

Минимум:

1. **Declare** disaster (кто решает).  
2. **Comms** template ([глава 08](08-incident-management.md)).  
3. **DNS / traffic** switch steps.  
4. **Restore** order: DB → cache → app → verify SLI.  
5. **Return** to primary (failback) — отдельный план.

**Runbook в Git**, review раз в полгода.

---

## DR drill

| Тип | Частота |
|-----|---------|
| Tabletop | ежеквартально |
| Restore DB на staging | ежемесячно |
| Full region failover | 1–2× в год |

Без drill RTO — **фантазия**.

---

## Multi-region и data

| Паттерн | Сложность |
|---------|-----------|
| Read replica в другом регионе | средняя |
| Active-active writes | конфликты, CRDT, sharding |
| Global load balancing | DNS, health checks |

**Split brain** — цена active-active; нужны **quorum** и fencing.

---

## В mock-exams

| Тема | Курс |
|------|------|
| Velero backup K8s | [kuber-advanced/23](../kuber-advanced/23-velero.md) |
| S3 CRR | [aws-advanced/24](../aws-advanced/24-lab-s3-crr.md) |
| Postgres PITR | [postgresql-intermediate](../postgresql-intermediate/README.md) |

Tabletop: «потерян AZ» — заполните RTO/RPO для вымышленного checkout.

---

## Чек-лист

- [ ] RTO/RPO записаны per tier?
- [ ] Restore тестировался < 6 мес?
- [ ] Runbook DR существует?
- [ ] Клиентский SLA согласован с RTO?

**Дальше:** [13. Как встроить SRE в компанию](13-organizing-sre.md).
