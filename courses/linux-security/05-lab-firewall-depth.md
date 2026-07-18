# 05. Лаба: инвентаризация firewall

**Стенд:** [`deploy/linux`](../../deploy/linux/README.md).

## Задание 1. Listening sockets на srv1

```bash
ssh course@172.28.0.11 'sudo ss -tlnp'
```

Запишите: порт → процесс → нужен ли снаружи.

## Задание 2. ufw статус

```bash
ssh course@172.28.0.11 'sudo ufw status verbose'
```

## Задание 3. nft / iptables

```bash
ssh course@172.28.0.11 'sudo nft list ruleset 2>/dev/null | head -40 || sudo iptables -L -n | head -20'
```

## Задание 4. Таблица в отчёте

Создайте на lab `/tmp/firewall-inventory.md`:

| Port | Service | Public? | Allowed by ufw? |
|------|---------|---------|---------------|
| 22 | ssh | yes | ... |
| 80 | nginx | yes | ... |

## Задание 5. (Опционально) применить nft

Только если есть консоль docker и понимаете риск:

```bash
# на srv1, если nft доступен
sudo nft -f - <<'EOF'
flush ruleset
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif lo accept
    tcp dport 22 accept
    tcp dport 80 accept
  }
}
EOF
```

Проверьте SSH с lab **до** закрытия сессии.

## Критерии успеха

- [ ] Таблица портов заполнена
- [ ] Понимаете default deny vs allow

Следующий урок: [06. AIDE](06-aide.md).
