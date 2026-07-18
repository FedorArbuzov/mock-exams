# 09. auditd

## Введение: «кто менял sshd_config — в syslog не видно»

После инцидента спрашивают: кто правил `/etc/ssh/sshd_config` в 02:00? **rsyslog** мог ротироваться, приложение не логировало, root не признаётся. **auditd** пишет события в **отдельный** журнал по правилам **ядра Linux audit** — сложнее «замести следы», чем просто удалить строку в текстовом логе.

Это не замена SIEM и не антивирус — **дополнительный** слой для критичных путей: passwd, sudoers, sshd, модули ядра.

## Что вы узнаете

- Чем **auditd** отличается от journal/rsyslog.
- Правила **auditctl** и `/etc/audit/rules.d/`.
- Ключи **-w**, **-p**, **-k** и поиск **ausearch**.
- Постоянные правила через **augenrules**.
- Ограничения и нагрузка на диск.

---

## auditd vs journal

| | journald | auditd |
|---|----------|--------|
| Источник | systemd, сервисы | **ядро audit** |
| Типично | unit logs, sshd | изменения файлов, syscalls (по правилу) |
| Подделка | удаление файлов journal | нужен root + отключение audit |
| Конфиг | unit, rsyslog | `/etc/audit/`, rules.d |

```bash
sudo systemctl status auditd
sudo auditctl -l
```

---

## Правило на файл (watch)

```bash
sudo auditctl -w /etc/ssh/sshd_config -p wa -k sshd_config_change
```

| Ключ | Смысл |
|------|--------|
| `-w PATH` | следить за путём |
| `-p wa` | **w**rite, **a**ttribute change (права, owner) |
| `-k KEY` | метка в логе для поиска |

Другие маски: `r` read, `x` execute, `a` append.

**Постоянно** (переживает reboot):

```bash
echo '-w /etc/ssh/sshd_config -p wa -k sshd_cfg' | sudo tee /etc/audit/rules.d/99-lab.rules
sudo augenrules --load
# или на старых системах:
sudo auditctl -R /etc/audit/rules.d/99-lab.rules
sudo auditctl -l | grep sshd
```

---

## Поиск событий

```bash
sudo ausearch -k sshd_cfg -ts recent
sudo ausearch -f /etc/ssh/sshd_config
sudo aureport -ts today
sudo aureport -f
```

Типичные поля: `type=PATH`, `name=`, `pid=`, `uid=`, `comm=`.

---

## Что ещё аудируют в prod

| Путь / событие | Зачем |
|----------------|--------|
| `/etc/passwd`, `/etc/shadow` | учётки |
| `/etc/sudoers`, `/etc/sudoers.d/` | privilege |
| `insmod` / module load | rootkit |
| `execve` для `/usr/bin/passwd` | смена пароля |

Правила — баланс: слишком широкий audit → **полный диск** и CPU.

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| ausearch пусто | правило не загружено, другой key |
| auditd не стартует | битый rules.d |
| диск 100% | `/var/log/audit` без rotation |
| дубли с syslog | норма; разные цели |

**rotation:** `/etc/audit/auditd.conf` — `max_log_file`, `num_logs`.

---

## В продакшене

Отправка в SIEM (Splunk, Elastic) через agent. Immutable audit на compliance-хостах. Тест правил на staging перед массовым rollout.

Связь: [linux-security](../linux-security/README.md).

---

## Резюме

**auditd** — политика ядра на критичные файлы и события. **ausearch -k** — быстрый поиск. Правила в **rules.d**, загрузка **augenrules**. Планируйте ротацию и объём.

## Чек-лист

- [ ] Чем auditd отличается от journal?
- [ ] Что означает `-p wa`?
- [ ] Где искать события по ключу?
- [ ] Как сделать правило постоянным?

Следующий урок: [10. Лаба: audit](10-lab-auditd.md).
