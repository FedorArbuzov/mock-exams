# 03. Лаба: hardening sshd на srv1

**Стенд:** [`deploy/linux`](../../deploy/linux/README.md).

## Предупреждение

Держите **два** терминала: один для правок, второй для проверки. Иначе можно потерять доступ.

## Задание 1. Бэкап

```bash
ssh course@172.28.0.11
sudo cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%s)
sudo mkdir -p /etc/ssh/sshd_config.d
```

## Задание 2. Drop-in конфиг

```bash
sudo tee /etc/ssh/sshd_config.d/99-lab-harden.conf <<'EOF'
PermitRootLogin no
MaxAuthTries 3
LoginGraceTime 30
# PasswordAuthentication no   # включите после проверки ключей!
EOF
sudo sshd -t
```

## Задание 3. Reload

```bash
sudo systemctl reload ssh
```

В **новом** окне с lab:

```bash
ssh -i ~/.ssh/id_lab course@172.28.0.11 hostname
```

## Задание 4. Проверка root

```bash
ssh root@172.28.0.11 2>&1 | head -3
```

Должен отказать.

## Задание 5. (После ключей) отключить пароль

Когда вход по ключу стабилен:

```bash
echo 'PasswordAuthentication no' | sudo tee -a /etc/ssh/sshd_config.d/99-lab-harden.conf
sudo sshd -t && sudo systemctl reload ssh
```

## Критерии успеха

- [ ] sshd -t без ошибок
- [ ] Вход course по ключу работает
- [ ] root login отклонён

Следующий урок: [04. Defense in depth](04-firewall-depth.md).
