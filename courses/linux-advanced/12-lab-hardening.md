# 12. Лаба: hardening srv1

## Цель лабы

Пройти **чеклист CIS-lite** на **srv1**, применить минимум sysctl, убедиться что **SSH с lab по ключу** всё ещё работает, оставить маркер `hardening-done.txt` для capstone.

## Предварительно

- [11. Hardening](11-hardening.md).
- Доступ: `ssh course@172.28.0.11` с lab.

---

## Подготовка стенда

```bash
docker compose exec lab bash
ssh -o BatchMode=yes course@172.28.0.11 'hostname; whoami'
```

**Если SSH fail:** восстановите ключи до hardening.

---

## Задание 1. Чеклист (заполните)

На srv1 отметьте:

```bash
ssh course@172.28.0.11
```

- [ ] `PermitRootLogin no` (или prohibit-password)
- [ ] `PasswordAuthentication no` **или** осознанно yes только в lab
- [ ] ufw **active** или nft policy documented
- [ ] нет пустых паролей в shadow
- [ ] только ожидаемые UID 0
- [ ] `dpkg -l | wc -l` — осознанный набор пакетов

Команды:

```bash
grep -E '^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)' /etc/ssh/sshd_config
sudo ufw status 2>/dev/null || echo "ufw not installed"
sudo awk -F: '($2==""){print}' /etc/shadow
awk -F: '$3==0 {print}' /etc/passwd
```

---

## Задание 2. sysctl hardening

```bash
echo 'kernel.kptr_restrict=1
kernel.dmesg_restrict=1' | sudo tee /etc/sysctl.d/99-harden.conf
sudo sysctl -p /etc/sysctl.d/99-harden.conf
sysctl kernel.kptr_restrict kernel.dmesg_restrict
```

---

## Задание 3. ufw (если ещё не включён)

**Держите вторую SSH-сессию.**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw --force enable
sudo ufw status numbered
```

С **lab** проверьте:

```bash
ssh -o BatchMode=yes course@172.28.0.11 'echo ssh-ok'
curl -s -o /dev/null -w "http=%{http_code}\n" http://172.28.0.11/ 2>/dev/null || echo "nginx optional"
```

---

## Задание 4. Отчёт на srv1

```bash
echo "hardening lab12 applied $(date -Is) by $(whoami)" | sudo tee /root/hardening-done.txt
sudo chmod 600 /root/hardening-done.txt
sudo ls -la /root/hardening-done.txt
```

---

## Задание 5. Краткий отчёт на lab

```bash
ssh course@172.28.0.11 'sudo cat /root/hardening-done.txt' > /tmp/hardening-report.txt
cat /tmp/hardening-report.txt
```

---

## Критерии успеха

- [ ] Чеклист заполнен (в тетради или комментариями)
- [ ] sysctl применён
- [ ] SSH с lab работает после ufw (если включали)
- [ ] `/root/hardening-done.txt` создан

## Что унести в работу

- Hardening без проверки SSH = инцидент.
- Baseline в git (Ansible), не ручные правки «навсегда».
- Capstone соберёт hardening + audit + fail2ban вместе.

Следующий урок: [13. fail2ban](13-fail2ban.md).
