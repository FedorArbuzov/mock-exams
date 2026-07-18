# 10. Лаба: tabletop PITR

## Зачем эта лаба

Полный PITR-стенд с archive на S3 и третьим volume — дорог в настройке для каждого студента. **Tabletop runbook** — то, что реально делают в компаниях: дежурный восстанавливает по шагам на drill. Лаба [09-pitr](09-pitr.md) даёт теорию; здесь — **исполняемый документ** для on-call.

Опционально: два Docker volume + base backup + recovery — для продвинутых.

## Предусловия

- Пройдены [03-wal](03-wal.md) и [09-pitr](09-pitr.md).
- Понимание RPO/RTO.

## Задание 1. Написать runbook PITR

Создайте файл `docs/pitr-runbook.md` (в своём форке или локально). Минимум **15 нумерованных шагов**, понятных дежурному без контекста чата.

### Обязательные разделы

#### 1. Включение архивации (production)

```ini
archive_mode = on
archive_command = 'test ! -f /mnt/wal_archive/%f && cp %p /mnt/wal_archive/%f'
```

Пример для S3:

```bash
archive_command = 'aws s3 cp %p s3://company-pg-wal/prod/%f --only-show-errors'
```

Упомяните: мониторинг `pg_stat_archiver`, алерт на `failed_count`.

#### 2. Расписание base backup

```bash
# cron: ежедневно 02:00 UTC
0 2 * * * pgbackrest --stanza=prod backup
# или
0 2 * * * pg_basebackup -D /backups/base/$(date +\%Y\%m\%d) -Ft -z -P
```

Retention: сколько base backups хранить (7 daily, 4 weekly).

#### 3. Сценарий инцидента

```text
14:00 UTC — ошибочный DROP TABLE shop.orders CASCADE на primary prod
13:55 UTC — последнее известное хорошее состояние (до созвона с PM)
```

Цель: новый инстанс с данными на **13:55 UTC**, не трогая сломанный primary до расследования.

#### 4. Команды восстановления (outline)

```text
1. Зафиксировать инцидент: время UTC, LSN если есть
2. Остановить трафик приложения (maintenance mode)
3. Поднять изолированный хост / контейнер для recovery
4. Очистить PGDATA
5. Восстановить последний base backup ДО 14:00
6. Создать recovery.signal
7. postgresql.conf:
   restore_command = 'aws s3 cp s3://company-pg-wal/prod/%f %p'
   recovery_target_time = '2026-06-25 13:55:00+00'
   recovery_target_action = promote
8. start Postgres, наблюдать лог replay
9. pg_is_in_recovery() → false после promote
10. Verify: SELECT count(*) FROM shop.orders; sanity checks
11. Сменить endpoint в приложении / DNS
12. Старый primary — isolate, не стартовать
13. Postmortem, тест restore в календарь
```

#### 5. RPO / RTO для вашего примера

| | Значение | Обоснование |
|---|----------|-------------|
| RPO | например 1 min | WAL archive continuous |
| RTO | например 45 min | base restore 25 min + replay 15 min + verify |

#### 6. Квартальный drill

- Restore в `staging-recovery` раз в квартал.
- `pg_verifybackup` (pgBackRest) или checklist row counts.
- Обновить runbook по итогам.

## Задание 2. Чеклист verify после restore

В runbook добавьте таблицу проверок:

| Проверка | Команда |
|----------|---------|
| Не в recovery | `SELECT pg_is_in_recovery();` |
| Время | `SELECT now();` — близко к target |
| Критичная таблица | `SELECT count(*) FROM shop.orders;` |
| Роли | `\du` |
| Расширения | `\dx` |
| Replication | решить: новая replica с этого primary |

## Задание 3. Опционально — мини-PITR в Docker

Для продвинутых:

1. `archive_mode=on`, archive в volume `/wal_archive`.
2. `pg_basebackup` в `/backup/base`.
3. INSERT маркер, `pg_switch_wal`, archive.
4. «Плохой» DELETE.
5. Новый контейнер: base + recovery до timestamp до DELETE.
6. Маркер на месте, DELETE нет.

Документируйте отличия от production (single node, local paths).

## Если что-то пошло не так (runbook quality)

| Проблема в runbook | Исправление |
|--------------------|-------------|
| Шаги без UTC | Явно `+00` / `Europe/Berlin` |
| Нет isolate старого primary | Риск split-brain |
| Нет verify | «Подняли пустую БД» |
| Нет контактов / эскалации | Добавить on-call |

## Критерии успеха

- [ ] Runbook ≥ 15 шагов
- [ ] Указаны RPO и RTO
- [ ] Есть `recovery_target_time` с timezone
- [ ] Упомянуты test restore / pg_verifybackup
- [ ] Сценарий DROP TABLE с временем до/после

## Дальше

VACUUM: [11-vacuum-bloat.md](11-vacuum-bloat.md).
