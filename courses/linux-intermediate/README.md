# Linux — Intermediate

Средний уровень: **сеть**, **DNS**, **firewall**, **TLS**, **веб-серверы**, **NFS**, **почта/логи**, **sudo/PAM**, **диагностика**.

**Предварительно:** [`linux-basic`](../linux-basic/README.md).

**Локально:** [`deploy/linux`](../../deploy/linux/README.md) — `docker compose up -d`, вход: `docker compose exec lab bash`.

**Дальше:** [`linux-advanced`](../linux-advanced/README.md), [`kuber-basic`](../kuber-basic/README.md). Углубление сетей (L3–L7, BGP, overlay, VPC): [`networking-deep`](../networking-deep/README.md).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 03, 05…) — не пропускайте введение и таблицу «типичные ошибки».
2. Откройте **лабу** (02-lab, 04-lab…) с поднятым стендом `docker compose up -d`.
3. Выполняйте задания **по номерам**; после каждого — блок «что увидите» сверьте с терминалом.
4. Если что-то не сходится — раздел «если не работает», затем [`deploy/linux/README.md`](../../deploy/linux/README.md).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции и команды с пояснением → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → подготовка → задания 1…N (зачем / команды / что увидите / если сломалось) → критерии → что унести в работу.

**Время:** около **45–60 минут** на пару «теория + лаба»; [финальный проект](34-final-project.md) — **2–4 часа**.

**Шпаргалка IP** (держите под рукой):

| Хост | IP |
|------|-----|
| lab | 172.28.0.10 |
| srv1 | 172.28.0.11 |
| srv2 | 172.28.0.12 |
| web | 172.28.0.20 |
| dns | 172.28.0.53 |

Учётка SSH: **course** / **course**.

## Программа

### Сеть (01–12)

1. [TCP/IP](01-tcp-ip.md) · 2. [Лаба: ip](02-lab-ip.md)
3. [DNS](03-dns.md) · 4. [Лаба: DNS](04-lab-dns.md)
5. [NAT](05-nat-forwarding.md) · 6. [Лаба: NAT](06-lab-nat.md)
7. [Firewall](07-firewall.md) · 8. [Лаба: ufw](08-lab-firewall.md)
9. [TLS / openssl](09-tls-openssl.md) · 10. [Лаба: HTTPS](10-lab-tls.md)
11. [ss / tcpdump](11-network-debug.md) · 12. [Лаба: tcpdump](12-lab-tcpdump.md)

### Сервисы (13–22)

13. [nginx](13-nginx.md) · 14. [Лаба: reverse proxy](14-lab-nginx.md)
15. [Apache](15-apache.md) · 16. [Лаба: Apache](16-lab-apache.md)
17. [NFS](17-nfs.md) · 18. [Лаба: NFS](18-lab-nfs.md)
19. [Postfix](19-postfix.md) · 20. [Лаба: mail](20-lab-postfix.md)
21. [rsyslog](21-rsyslog.md) · 22. [Лаба: rsyslog](22-lab-rsyslog.md)

### Безопасность и ACL (23–28)

23. [sudo](23-sudo.md) · 24. [Лаба: sudo](24-lab-sudo.md)
25. [PAM](25-pam.md) · 26. [Лаба: PAM](26-lab-pam.md)
27. [ACL / AppArmor](27-acl-apparmor.md) · 28. [Лаба: ACL](28-lab-acl.md)

### Performance и финал (29–34)

29. [Performance tools](29-performance.md) · 30. [Лаба: stress](30-lab-performance.md)
31. [strace / lsof](31-strace-lsof.md) · 32. [Лаба: strace](32-lab-strace.md)
33. [Backup strategy](33-backup-strategy.md)
34. [Финальный проект](34-final-project.md)

## Что должно получиться

- Диагностируете сеть послойно: маршрут → порт → HTTP → дамп.
- Настраиваете DNS, ufw и TLS на учебных хостах.
- Поднимаете nginx reverse proxy и NFS (или tar-backup).
- Ограничиваете sudo, читаете rsyslog/journal.
- Собираете [финальный мини-стек](34-final-project.md) на srv1 + lab.

## Специализации

| Курс | Когда |
|------|-------|
| [`linux-security`](../linux-security/README.md) | hardening, audit — после intermediate |
| [`linux-shell`](../linux-shell/README.md) | скрипты и автоматизация — параллельно |
