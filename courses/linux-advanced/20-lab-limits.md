# 20. Лаба: LimitNOFILE для nginx

## Цель лабы

Поднять **LimitNOFILE** для nginx через **systemd drop-in**, проверить через `systemctl show` и `/proc/PID/limits` — паттерн для любого high-connection демона.

## Предварительно

- [19. sysctl и limits](19-sysctl-limits.md).
- srv1 или lab с nginx.

```bash
ssh course@172.28.0.11
sudo apt install -y nginx
```

---

## Задание 1. Текущие лимиты

```bash
ulimit -n
NGINX_PID=$(pgrep -o nginx)
echo "PID=$NGINX_PID"
sudo cat /proc/$NGINX_PID/limits | grep "open files"
systemctl show nginx -p LimitNOFILE --value 2>/dev/null
```

Запишите **до** изменений.

---

## Задание 2. Drop-in systemd

```bash
sudo mkdir -p /etc/systemd/system/nginx.service.d
sudo tee /etc/systemd/system/nginx.service.d/limits.conf <<'EOF'
[Service]
LimitNOFILE=8192
LimitNPROC=4096
EOF
sudo systemctl daemon-reload
sudo systemctl restart nginx
systemctl is-active nginx
```

---

## Задание 3. Проверка

```bash
systemctl show nginx -p LimitNOFILE --value
systemctl show nginx -p LimitNPROC --value
NGINX_PID=$(pgrep -o nginx)
sudo cat /proc/$NGINX_PID/limits | grep -E "open files|max processes"
```

**Что увидите:** Max open files **8192** (soft/hard).

---

## Задание 4. limits.conf (сравнение)

```bash
grep -rh nginx /etc/security/limits.conf /etc/security/limits.d/ 2>/dev/null || echo "no nginx entry in limits.conf"
```

**Вывод:** для **демонов** — systemd, не только limits.conf.

---

## Задание 5. sysctl somaxconn (опционально)

```bash
sysctl net.core.somaxconn
echo 'net.core.somaxconn = 4096' | sudo tee /etc/sysctl.d/99-nginx-lab.conf
sudo sysctl -p /etc/sysctl.d/99-nginx-lab.conf
```

Согласуйте с `listen backlog` в nginx — отдельная тема tuning.

---

## Критерии успеха

- [ ] LimitNOFILE=8192 в systemctl show
- [ ] /proc/PID/limits показывает 8192
- [ ] nginx active после restart
- [ ] Понимаете разницу ulimit vs systemd

## Что унести в работу

- «Too many open files» → systemd drop-in + file-max + leak check.
- В playbook Ansible: `systemd` module + drop-in template.

Следующий урок: [21. eBPF intro](21-ebpf-intro.md).
