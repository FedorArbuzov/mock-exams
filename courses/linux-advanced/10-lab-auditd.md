# 10. Лаба: auditd

## Цель лабы

Включить **auditd**, добавить правило на **sshd_config**, вызвать событие и найти его через **ausearch** — минимальный forensic workflow на srv1.

## Предварительно

- [09. auditd](09-auditd.md).
- srv1 доступен по SSH.

```bash
ssh course@172.28.0.11
sudo apt install -y auditd audispd-plugins 2>/dev/null
```

---

## Подготовка стенда

```bash
sudo systemctl enable --now auditd
systemctl is-active auditd
sudo auditctl -l
```

**Если inactive:** `journalctl -u auditd -n 20`.

---

## Задание 1. Временное правило (опционально)

```bash
sudo auditctl -w /etc/ssh/sshd_config -p wa -k sshd_cfg_test
sudo auditctl -l | grep sshd
```

---

## Задание 2. Постоянное правило

```bash
echo '-w /etc/ssh/sshd_config -p wa -k sshd_cfg' | sudo tee /etc/audit/rules.d/99-lab.rules
sudo augenrules --load 2>/dev/null || sudo auditctl -R /etc/audit/rules.d/99-lab.rules
sudo auditctl -l | grep sshd
```

**Что увидите:** строка watch на sshd_config.

---

## Задание 3. Вызвать событие

```bash
sudo touch /etc/ssh/sshd_config
sleep 1
sudo ausearch -k sshd_cfg --interpret 2>/dev/null | tail -15
```

**Что увидите:** записи с `type=PATH` или `type=SYSCALL`, uid, comm.

**Если пусто:**

```bash
sudo ausearch -f /etc/ssh/sshd_config | tail -10
sudo tail -5 /var/log/audit/audit.log
```

---

## Задание 4. aureport

```bash
sudo aureport -ts today 2>/dev/null | head -20
sudo aureport -f 2>/dev/null | tail -10
```

---

## Задание 5. Уборка (опционально)

```bash
sudo rm -f /etc/audit/rules.d/99-lab.rules
sudo augenrules --load 2>/dev/null
```

На учебном srv1 можно оставить правило для capstone.

---

## Критерии успеха

- [ ] auditd active
- [ ] `auditctl -l` показывает watch
- [ ] `ausearch` нашёл событие после touch
- [ ] Понимаете разницу rules.d vs auditctl -w

## Что унести в работу

- Инцидент «кто менял конфиг» → audit + backup git/Ansible.
- Перед массовым rules — тест на одном хосте и размер `/var/log/audit`.
- В capstone — правило на `/etc/sudoers.d/`.

Следующий урок: [11. Hardening](11-hardening.md).
