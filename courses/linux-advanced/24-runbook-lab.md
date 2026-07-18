# 24. Лаба: runbook «disk full»

## Цель лабы

Написать полноценный **runbook** `disk-full.md` с metadata, diagnosis, mitigation, escalation — и прогнать diagnosis на lab после симуляции заполнения `/tmp`.

## Предварительно

- [23. Capacity и runbooks](23-capacity-runbooks.md).

```bash
docker compose exec lab bash
mkdir -p /home/course/runbooks
```

---

## Задание 1. Создать runbook

Файл `/home/course/runbooks/disk-full.md` должен содержать **все** секции:

### Metadata

- Title: Disk full on Linux host
- Severity: SEV2
- Owner: platform on-call
- Last reviewed: дата

### Symptoms

- Alert: filesystem > 90%
- Application: `No space left on device`
- SSH может работать, сервисы падают на write

### Impact

- Запись логов, БД, деплои остановлены
- Риск corruption при принудительных действиях

### Diagnosis (команды)

```bash
df -h
df -i
du -xhd1 /var 2>/dev/null | sort -h | tail -10
du -sh /var/log/* 2>/dev/null | sort -h | tail -5
journalctl --disk-usage
docker system df 2>/dev/null
sudo lsof +D /var 2>/dev/null | head -20
```

### Mitigation

1. Найти топ-каталог (`du`)
2. `journalctl --vacuum-size=500M` (если journal большой)
3. Ротация/архив логов по политике
4. Удалить известный мусор (`/tmp`, старые backup)
5. Расширить LV — [linux-basic/14-lvm](../linux-basic/14-lvm.md)
6. **Не** удалять файлы наугад в `/var/lib` без понимания

### Escalation

- DBA если Postgres WAL
- Storage team если SAN
- Security если внезапный рост в `/home`

### Post-incident

- Тренд диска в Grafana
- Ticket на увеличение тома
- Обновить runbook

---

## Задание 2. Проверить длину

```bash
wc -l /home/course/runbooks/disk-full.md
```

**Цель:** ≥ 40 строк содержательного текста.

---

## Задание 3. Симуляция

```bash
df -h /tmp
dd if=/dev/zero of=/tmp/fill-lab bs=1M count=80 2>/dev/null
df -h /tmp
```

Пройдите **Diagnosis** из runbook — выполните команды, найдите `/tmp/fill-lab`.

```bash
rm -f /tmp/fill-lab
df -h /tmp
```

---

## Задание 4. Peer review (самопроверка)

- [ ] Команды copy-paste без опечаток?
- [ ] Есть escalation?
- [ ] Mitigation безопасен (не `rm -rf /`)?

---

## Критерии успеха

- [ ] Runbook ≥ 40 строк, все секции
- [ ] Симуляция: `du`/`df` нашли fill-lab
- [ ] Файл в `/home/course/runbooks/`

## Что унести в работу

- Runbook в git, review раз в квартал.
- Capstone требует этот runbook на srv1/lab.

Следующий урок: [25. Docker socket](25-docker-socket.md).
