# 19. Postfix: локальная почта

## Введение: «cron упал» — а вы письма не читаете

Ночью сработал cron:

```text
/bin/sh: 1: /usr/local/bin/backup.sh: not found
```

Cron по умолчанию шлёт **email root** с выводом job. Если вы не настроили почту, письмо:

- попадает в `/var/mail/root` (и годами копит гигабайты),
- или копится в очереди Postfix,
- или теряется — и вы узнаёте о проблеме только когда диск заполнится.

**Postfix** — MTA (Mail Transfer Agent) по умолчанию на Ubuntu: принимает письмо локально и доставляет в mailbox или пересылает на **relay** (SendGrid, SES).

DevOps-инженеру не нужно быть почтовым админом, но нужно: **отправить тест**, **прочитать mail.log**, **понять, что cron шлёт mail**.

## Что вы узнаете

- Зачем MTA на сервере без «настоящей» почты.
- Путь письма: `mail` → postfix → mailbox.
- Файлы **main.cf**, очередь **mailq**, лог **mail.log**.
- Чем **local only** отличается от **relay** в проде.
- Как не стать **open relay** (спам-реле).

## Путь письма — пошагово

```mermaid
flowchart LR
  Cron[cron job fails]
  Mail[mail command]
  Postfix[postfix]
  Mbox["/var/mail/user"]
  Cron -->|stderr| Mail
  Mail --> Postfix
  Postfix --> Mbox
```

1. Cron запускает скрипт, stderr уходит в mail.
2. Команда `mail` передаёт письмо Postfix через sendmail API.
3. Postfix смотрит: получатель `root@hostname` — **локальный**?
4. Если да — кладёт в `/var/mail/root` (формат mbox) или Maildir.
5. Если нет — ищет MX в DNS или шлёт на **relayhost**.

## Установка на Ubuntu

```bash
sudo apt update
sudo apt install -y postfix mailutils
```

Debconf спросит тип:

| Вариант | Когда |
|---------|--------|
| **Local only** | лаба, только cron → root |
| **Internet Site** | нужен FQDN, позже relay |
| **No configuration** | настроите main.cf вручную |

```bash
sudo systemctl enable --now postfix
sudo systemctl status postfix
sudo postfix check
```

`postfix check` — синтаксис конфигов **до** reload.

## Отправить тестовое письмо

```bash
echo "Тело письма. Время: $(date -Is)" | mail -s "Тема: lab test" $(whoami)
```

Проверить очередь:

```bash
mailq
```

Пусто или `Mail queue is empty` — доставлено локально.

Прочитать mailbox (простой способ):

```bash
sudo ls -la /var/mail/
sudo grep -a . /var/mail/$(whoami) 2>/dev/null | tail -15
```

Или установить `mutt` и `mutt -f /var/mail/$(whoami)`.

## Логи — главный источник правды

```bash
sudo tail -30 /var/log/mail.log
sudo journalctl -u postfix --no-pager -n 20
```

Ищите:

```text
status=sent
delivered to mailbox
```

При ошибке:

```text
deferred
Connection timed out
```

## main.cf — три параметра для ориентира

```bash
postconf myhostname
postconf mydomain
postconf mydestination
postconf relayhost
```

| Параметр | Смысл |
|----------|--------|
| `myhostname` | имя этой машины (FQDN лучше) |
| `mydestination` | какие домены считать **локальными** |
| `relayhost` | куда слать всё наружу (пусто = сам) |

**Open relay** — когда ваш сервер принимает почту **с интернета** и пересылает куда угодно. Спамеры любят такие. В лабе — **local only**, не открывайте `mynetworks` на 0.0.0.0/0.

## Relay в проде (концепт)

```text
# /etc/postfix/main.cf фрагмент
relayhost = [smtp.sendgrid.net]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_tls_security_level = encrypt
```

```bash
# /etc/postfix/sasl_passwd
[smtp.sendgrid.net]:587    apikey:SECRET
sudo chmod 600 /etc/postfix/sasl_passwd
sudo postmap /etc/postfix/sasl_passwd
sudo systemctl reload postfix
```

Секреты — не в git. Альтернативы: Amazon SES, корпоративный SMTP.

## Связь с cron

```bash
grep -r MAILTO /etc/cron* 2>/dev/null
```

По умолчанию cron шлёт **root**. Можно:

```text
MAILTO=devops@company.com
```

в crontab — но нужен рабочий relay.

## На стенде

[Лаба 20](20-lab-postfix.md) — srv1 или lab, local delivery. Исходящий SMTP в Docker часто **закрыт** — это нормально.

## Типичные ошибки

| Симптом | Причина | Действие |
|---------|---------|----------|
| mailq растёт | нет relay, интернет closed | local only или relay |
| Пустой /var/mail | alias root → /dev/null | `/etc/aliases` |
| Connection refused | postfix down | systemctl start |
| Письма в spam наружу | нет SPF/DKIM | настройка у relay |

## В продакшене

- Алерты — в Prometheus/Grafana, не только mail root.
- Исходящая почта — через **один** relay с аутентификацией.
- Мониторинг размера `/var/mail` и `mailq`.

## Резюме

Postfix доставляет локальную почту (cron, at, скрипты) и может пересылать наружу через relay. Проверяйте **mailq** и **mail.log**. Для лабы — **local only**. Open relay — недопустим. Письмо root — часто единственный «мониторинг» на забытом сервере — проверяйте mailbox или отключайте осознанно.

## Чек-лист

- Куда cron девает stderr по умолчанию?
- Что покажет `mailq` при проблеме relay?
- Чем опасен open relay?
- Зачем `postfix check`?

Следующий урок: [20. Лаба: mail](20-lab-postfix.md).
