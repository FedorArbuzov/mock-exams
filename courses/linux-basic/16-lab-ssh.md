# 16. Лаба: SSH-ключи и config

## Стенд

`docker compose exec lab bash`

---

## Задание 1. Ключ

```bash
test -f ~/.ssh/id_lab || ssh-keygen -t ed25519 -f ~/.ssh/id_lab -N "" -C "lab"
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_lab
```

---

## Задание 2. copy-id на srv1

```bash
ssh-copy-id -i ~/.ssh/id_lab.pub course@172.28.0.11
ssh -i ~/.ssh/id_lab course@172.28.0.11 hostname
```

Пароль course/course — только при первом copy-id.

---

## Задание 3. ~/.ssh/config

```bash
cat >> ~/.ssh/config <<'EOF'

Host srv1
    HostName 172.28.0.11
    User course
    IdentityFile ~/.ssh/id_lab
EOF
chmod 600 ~/.ssh/config
ssh srv1 'echo OK from config'
```

---

## Задание 4. scp

```bash
echo lab-scp-test > /tmp/scp-demo.txt
scp /tmp/scp-demo.txt srv1:/tmp/
ssh srv1 'cat /tmp/scp-demo.txt'
```

---

## Задание 5. Права (учебный тест)

```bash
cp ~/.ssh/id_lab ~/.ssh/id_lab.bak
chmod 644 ~/.ssh/id_lab
ssh -i ~/.ssh/id_lab srv1 true 2>&1 | head -3
mv ~/.ssh/id_lab.bak ~/.ssh/id_lab
chmod 600 ~/.ssh/id_lab
```

**Что увидите:** ssh откажется использовать слишком открытый ключ.

---

## Критерии успеха

- [ ] Вход `ssh srv1` без пароля
- [ ] scp скопировал файл
- [ ] Понимаете, зачем 600 на приватный ключ

Следующий урок: [17. Troubleshooting](17-troubleshooting.md).
