# 11. Hardening CIS-lite

## Введение: «сканер нашёл 200 critical» — с чего начать

Пентест или CIS benchmark выдают длинный список. Не всё применимо к вашему классу хостов (build agent vs bastion vs DB). **Hardening** — осознанное **уменьшение поверхности атаки**: меньше сервисов, меньше открытых портов, сильнее SSH, аудит, патчи.

Эта глава — **CIS-lite**: практичный baseline для учебного **srv1**, не полный CIS Level 2.

## Что вы узнаете

- Принципы: минимум сервисов, least privilege, patch, audit.
- **SSH**: ключи, запрет root, AllowUsers.
- **Firewall** host-level.
- **Файловая система** и права.
- **sysctl** hardening (обзор).
- Связь с лабой 12 и capstone.

---

## Принципы baseline

| Принцип | Практика |
|---------|----------|
| Минимальная поверхность | только нужные пакеты (`apt`, образы) |
| Least privilege | отдельные users, sudo whitelist |
| Defense in depth | SG облака **и** ufw на хосте |
| Аудит | auditd, auth.log → SIEM |
| Патчи | staging → prod, окно перезагрузки |

Документируйте **исключения** («порт 8080 открыт для legacy») — иначе через год никто не помнит почему.

---

## SSH

Фрагмент `/etc/ssh/sshd_config` (проверяйте совместимость с вашей версией OpenSSH):

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers course deploy
MaxAuthTries 3
X11Forwarding no
AllowTcpForwarding no
```

После правки:

```bash
sudo sshd -t
sudo systemctl reload sshd
```

**Важно:** держите **вторую** SSH-сессию, пока не проверили вход с ключом.

См. [linux-intermediate: SSH](../linux-intermediate/README.md), [24-lab-sudo](../linux-intermediate/24-lab-sudo.md).

---

## Сеть и firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status verbose
```

См. [linux-intermediate: firewall](../linux-intermediate/07-firewall.md).

---

## Учётные записи

```bash
sudo awk -F: '($2==""){print "EMPTY PASSWORD:", $0}' /etc/shadow
getent passwd | awk -F: '$3==0 {print}'
```

Не должно быть лишних UID 0. Пустые пароли — критичный fail.

---

## Файловая система

Где возможно (осторожно с legacy app):

```text
/tmp  nodev,nosuid,noexec
```

Права: конфиги **644**, скрипты не world-writable, **нет 777** на shared без ACL.

---

## sysctl (выборочно)

`/etc/sysctl.d/99-harden.conf`:

```text
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
kernel.kptr_restrict = 1
kernel.dmesg_restrict = 1
```

```bash
sudo sysctl -p /etc/sysctl.d/99-harden.conf
```

Полный список — CIS benchmark или ваш security team.

---

## Автообновления

`unattended-upgrades` на Ubuntu — только после теста в staging. Reboot required — планируйте.

---

## Типичные ошибки

| Ошибка | Риск |
|--------|------|
| ufw enable без allow 22 | lockout |
| PasswordAuthentication no без ключа | lockout |
| hardening без документации | ломают CI/deploy |
| только сканер, без remediate | ложное чувство безопасности |

---

## В продакшене

Ansible role `hardening` + исключения по group_vars. Immutable infrastructure (AMI rebuild) vs drift на long-lived VM. Согласование с compliance (PCI, SOC2).

---

## Резюме

Hardening — **baseline + документированные исключения**. SSH + ufw + пользователи + audit — ядро для srv1. Проверяйте в [лабе 12](12-lab-hardening.md) и [capstone](28-final-project.md).

## Чек-лист

- [ ] 5 пунктов вашего baseline для srv1?
- [ ] Почему root login по SSH запрещён?
- [ ] Что проверить перед `ufw enable`?
- [ ] Где хранить список открытых портов и зачем?

Следующий урок: [12. Лаба: baseline](12-lab-hardening.md).
