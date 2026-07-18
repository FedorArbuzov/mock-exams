# 08. Лаба: секреты и права

**Стенд:** [`deploy/linux`](../../deploy/linux/README.md).

## Задание 1. Плохой пример

```bash
mkdir -p /tmp/secrets-bad
echo 'API_KEY=supersecret' > /tmp/secrets-bad/.env
chmod 644 /tmp/secrets-bad/.env
ls -la /tmp/secrets-bad/
```

Любой пользователь: `cat /tmp/secrets-bad/.env`

## Задание 2. Правильный пример

```bash
sudo mkdir -p /etc/labapp
echo 'API_KEY=supersecret' | sudo tee /etc/labapp/.env
sudo chmod 600 /etc/labapp/.env
sudo chown root:root /etc/labapp/.env
ls -la /etc/labapp/
```

Проверка от course:

```bash
cat /etc/labapp/.env 2>&1 || echo "permission denied OK"
```

## Задание 3. find world-readable

```bash
sudo find /etc -type f -perm -o+r 2>/dev/null | head -20
```

Не всё из списка — уязвимость (многие файлы намеренно public), но **подозрительные** с паролями — да.

## Задание 4. mount /tmp (просмотр)

```bash
findmnt /tmp
grep tmpfs /etc/fstab
```

## Задание 5. .bash_history

```bash
grep -i password ~/.bash_history 2>/dev/null || echo "no history or clean"
```

Не экспортируйте секреты в history (`export HISTCONTROL` + avoid secrets on CLI).

## Критерии успеха

- [ ] .env 600 недоступен обычному user
- [ ] Понимаете 644 vs 600

Следующий урок: [09. Mini-CA](09-pki-ca.md).
