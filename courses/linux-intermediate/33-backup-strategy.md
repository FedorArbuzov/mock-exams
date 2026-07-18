# 33. Стратегия бэкапов

## Введение: бэкап есть, восстановления не было

«У нас всё в S3» — хорошо. Вопрос на инциденте в 03:00: **как поднять PostgreSQL из backup за 2 часа, какой пароль и порядок WAL?** Если последний **restore drill** был три года назад, ваш RTO на бумаге не существует.

Бэкап без **проверенного восстановления** — надежда, не стратегия. Эта глава связывает термины RPO/RTO с тем, что вы уже делали в basic (`tar`, cron) и что соберёте в [финале](34-final-project.md).

## Что вы узнаете

- Правило **3-2-1** и что из него реально критично.
- **RPO** и **RTO** простыми словами и примерами.
- Что бэкапить на Linux-хосте vs в приложении/БД.
- **Restore drill** — зачем и как часто.
- Типичные провалы (snapshot без consistency, бэкап на том же диске).

---

## 3-2-1

| Цифра | Смысл | Практика |
|-------|--------|----------|
| **3** | три копии данных | prod + local backup + offsite |
| **2** | два типа носителей | диск + object storage / tape |
| **1** | одна копия **offsite** | другой ЦОД, регион, аккаунт |

На практике добавьте обязательно:

- **шифрование** at rest и при передаче;
- **контроль доступа** (бэкап = все секреты компании);
- **тест restore** по расписанию.

---

## RPO и RTO

| Термин | Вопрос | Пример |
|--------|--------|--------|
| **RPO** (Recovery Point Objective) | сколько данных **можно потерять**? | cron `tar /etc` каждый час → до 1 ч конфигов |
| **RTO** (Recovery Time Objective) | за сколько **поднять сервис**? | 4 ч — только если drill показал 3.5 ч |

**RPO** задаёт частоту бэкапов и replication. **RTO** задаёт runbook, железо, параллелизм restore.

Нельзя обещать RTO 15 минут, если drill занимал 6 часов.

---

## Что бэкапить (слои)

| Объект | Инструмент | Частота | Заметка |
|--------|------------|---------|---------|
| `/etc`, unit files | tar, git, Ansible | при изменении | быстро, мало места |
| Код / IaC | git | каждый commit | не замена данных |
| Файлы приложения | rsync, snapshot | hourly/daily | согласовать с app |
| **PostgreSQL** | `pg_dump`, basebackup + **WAL** | continuous + full | tar только БД не спасёт |
| **MySQL** | xtrabackup, binlog | по политике | |
| VM disk | cloud snapshot | daily | **crash-consistent** vs **app-consistent** |

Пример слоя хоста (учебный):

```bash
sudo tar -czvf "/backup/etc-$(date +%F).tar.gz" /etc/nginx /etc/letsencrypt 2>/dev/null
```

Offsite (концепт):

```bash
rsync -avz -e ssh /backup/ backup@collector.example.com:/archives/$(hostname)/
```

---

## Consistency: почему «просто snapshot» опасен

| Тип | Описание | Риск |
|-----|----------|------|
| Crash-consistent | диск как выключили питание | битая БД при restore |
| App-consistent | quiesce / flush БД, затем snapshot | предпочтительно |
| Logical backup | pg_dump, mysqldump | медленнее, проще проверить |

Для Postgres в проде: **WAL archiving** + periodic base backup, restore через `pg_basebackup` + replay.

---

## Шифрование и доступ

Бэкапы содержат пароли, ключи, ПДн, TLS private keys.

- Encrypt at rest: S3 SSE-KMS, gpg, Borg restic.
- IAM / RBAC: минимум кто может **read** backup bucket.
- **Не** публичный S3 bucket — регулярный источник утечек.

```bash
# пример локального шифрования (lab)
gpg --symmetric --cipher-algo AES256 backup.tar.gz
```

---

## Restore drill (процедура)

Раз в квартал или после major change:

1. Поднять **изолированную** VM / namespace.
2. Восстановить **последний** full + применить incremental/WAL по runbook.
3. Smoke test: health endpoint, миграции, логин.
4. Записать **фактическое время**, проблемы, отличия от документации.
5. Обновить runbook и алерты (backup job failed).

Чек-лист одной строкой в тикете: «restore tested 2026-05-18, RTO 95 min».

---

## Мониторинг бэкапов

| Сигнал | Действие |
|--------|----------|
| cron не запускался | алерт на отсутствие свежего файла |
| размер backup упал в 10 раз | проверить ошибку dump |
| S3 lifecycle удалил слишком рано | retention policy review |

```bash
find /backup -name '*.tar.gz' -mtime -2 -ls
```

---

## Связь с финальным проектом

На srv1 в basic вы настраивали cron + `tar` nginx → `/backup`. В [34-final-project](34-final-project.md) это входит в runbook вместе с ufw, proxy и логами — **единая** картина эксплуатации.

---

## Типичные ошибки

| Ошибка | Риск |
|--------|------|
| только snapshot VM без app quiesce | невосстановимая БД |
| бэкап на том же диске / том же AZ | fire / disk loss убивает всё |
| нет мониторинга backup job | тихий fail месяцами |
| бэкап есть, runbook нет | паника при restore |
| секреты в незашифрованном tar в /tmp | утечка |

---

## В продакшене

Velero (Kubernetes), Restic/Borg, cloud snapshots + **cross-region** replication. Compliance: retention, immutability (WORM), audit кто скачивал backup.

---

## Резюме

Бэкап = копия + **проверенное** восстановление + offsite + шифрование. RPO/RTO — требования бизнеса, не цифры из презентации. Хост (`tar`/`rsync`) и приложение (dump/WAL) — **разные** слои.

## Чек-лист

- [ ] Чем RPO отличается от RTO?
- [ ] Почему `tar /etc` не спасает Postgres?
- [ ] Когда у вас последний restore test?
- [ ] Где лежит offsite копия и кто имеет доступ?

Следующий урок: [34. Финальный проект](34-final-project.md).
