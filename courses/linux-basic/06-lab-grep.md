# 06. Лаба: grep, awk, разбор логов

Вы разберёте **реальные** источники на сервере: sshd_config, journal, при наличии — nginx. Цель — собрать pipeline «фильтр → счётчик → топ».

## Стенд

`docker compose exec lab bash`

---

## Задание 1. grep в конфиге

```bash
grep -n "^PermitRootLogin" /etc/ssh/sshd_config
grep -E "^#|^$" /etc/ssh/sshd_config | wc -l
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$" | head -15
```

**Что увидите:** закомментированные строки с `#` в начале; «чистый» конфиг без пустых строк.

---

## Задание 2. cut и sort

```bash
cut -d: -f1,3 /etc/passwd | head -5
cut -d: -f1 /etc/passwd | sort | tail -5
```

---

## Задание 3. journal + grep

```bash
journalctl --no-pager -n 50 | grep -i error | tail -10
journalctl -u ssh --no-pager -n 30 2>/dev/null | grep -i fail | tail -5
```

Если ssh unit пуст — это нормально в тихом контейнере; главное — синтаксис.

---

## Задание 4. awk по passwd

```bash
awk -F: '$3 >= 1000 {print $1, $3, $6}' /etc/passwd
```

**Что увидите:** пользователей с UID ≥ 1000 (обычные учётки на Ubuntu).

---

## Задание 5. uniq и топ (синтетика)

Создайте учебный «лог»:

```bash
cat > /tmp/access-fake.log <<'EOF'
10.0.0.1 GET /
10.0.0.2 GET /
10.0.0.1 GET /api
10.0.0.3 GET /
10.0.0.1 GET /
10.0.0.2 GET /
EOF
awk '{print $1}' /tmp/access-fake.log | sort | uniq -c | sort -rn
```

**Что увидите:** `10.0.0.1` чаще остальных — так ищут DDoS или битый клиент.

---

## Задание 6. (Опционально) nginx

```bash
sudo apt install -y nginx 2>/dev/null
curl -s -o /dev/null http://127.0.0.1/
grep -c "" /var/log/nginx/access.log 2>/dev/null
```

---

## Критерии успеха

- [ ] Получен «очищенный» фрагмент sshd_config без комментариев
- [ ] awk вывел пользователей с UID ≥ 1000
- [ ] Топ IP из fake.log построен через sort | uniq -c

Следующий урок: [07. vim](07-vim.md).
