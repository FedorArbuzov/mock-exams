# 20. Лаба: локальная почта Postfix

## Цель лабы

Отправить письмо себе через **mail**, увидеть доставку в **mail.log** и понять, куда cron девает stderr. После лабы вы не будете игнорировать `/var/mail/root` на серверах.

## Предварительно

- [19. Postfix](19-postfix.md).
- srv1 или lab, sudo.

```bash
sudo apt update
sudo apt install -y postfix mailutils
# Debconf: Local only
sudo systemctl enable --now postfix
```

---

## Подготовка стенда

```bash
sudo postfix check
systemctl is-active postfix
postconf myhostname mydestination | head -5
```

---

## Задание 1. Тестовое письмо

**Зачем:** пройти путь mail → postfix → mailbox.

```bash
echo "Тело письма. Время: $(date -Is). Хост: $(hostname)" | \
  mail -s "Lab 20: postfix test" $(whoami)
sleep 3
mailq
```

**Что увидите:** `Mail queue is empty` — доставлено локально.

**Если mailq показывает deferred:** смотрите задание 4 (логи).

---

## Задание 2. Прочитать доставку

```bash
sudo tail -25 /var/log/mail.log
```

Ищите `status=sent`, `delivered to mailbox`, ваш логин.

```bash
sudo ls -la /var/mail/
sudo grep -a . /var/mail/$(whoami) 2>/dev/null | tail -10
```

**Если /var/mail пуст:** письмо могло уйти root — проверьте `sudo grep -a . /var/mail/root 2>/dev/null | tail -5`.

---

## Задание 3. journal (альтернатива логу)

```bash
sudo journalctl -u postfix --no-pager -n 15
```

---

## Задание 4. Имитация cron (опционально)

**Зачем:** увидеть, откуда берётся «письмо от cron».

```bash
echo '* * * * * $(whoami) echo "cron body $(date +\%H\%M)" | mail -s "cron-sim" $(whoami)' | crontab -
sleep 70
mailq
sudo tail -5 /var/log/mail.log
crontab -r
```

Удалите crontab после теста (`crontab -r`).

---

## Задание 5. Письмо root (опционально)

```bash
echo "test root mail" | sudo mail -s "to root" root
sleep 2
sudo tail -5 /var/log/mail.log
sudo ls -la /var/mail/root
```

---

## Критерии успеха

- [ ] postfix active, `postfix check` OK
- [ ] mail.log содержит status=sent/delivered
- [ ] mailq не копит deferred
- [ ] Найдено содержимое в /var/mail или подтверждение в логе

## Что унести в работу

- Cron failed → проверьте mail root и mail.log.
- mailq растёт → relay/DNS/интернет.

Следующий урок: [21. rsyslog](21-rsyslog.md).
