# 06. AIDE — контроль целостности файлов (FIM)

## File Integrity Monitoring

**FIM** отвечает на вопрос: *изменился ли критичный файл без change ticket?*

Типичные цели:

- `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`
- `/usr/bin/sudo`, `/usr/sbin/sshd`
- бинарники в PATH после компрометации

## AIDE

```bash
sudo apt install -y aide aide-common
sudo aideinit    # первичная база — долго
```

База: `/var/lib/aide/aide.db`.

```bash
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
sudo aide --check
```

Вывод: Added/Removed/changed files.

## Конфигурация

`/etc/aide/aide.conf` — какие деревья сканировать:

```text
/etc       p+i+n+u+g+s+m+c+md5
/usr/bin   p+i+n+u+g+s+m+c+md5
```

После правки конфига — пересоздать базу.

## Cron

```bash
# /etc/cron.daily/aide
aide --check | mail -s "AIDE report" root
```

## Ограничения

| Минус | Комментарий |
|-------|-------------|
| Ложные срабатывания | после apt upgrade |
| Не real-time | только по расписанию |
| Не ловит in-memory malware | нужен EDR |

Альтернативы: **Tripwire**, **OSSEC**, **Wazuh**, cloud **Integrity Monitoring**.

## Чек-лист

- Чем FIM отличается от auditd?
- Когда пересоздавать базу?
- Почему после патча много changed?

Следующий урок: [07. Секреты на диске](07-secrets-disk.md).
