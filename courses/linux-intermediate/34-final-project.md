# 34. Финальный проект intermediate

## Введение: собрать «минимальный прод» в Docker

Отдельно вы умеете ping, dig, ufw, nginx и cron. **Финал** — один связный контур: с **lab** заходите на **srv1** по SSH, HTTP идёт через firewall, с **lab** reverse proxy на :8080, конфиги **бэкапятся**, логи не кричат об ошибках. Так выглядит маленькая production VM без Kubernetes — и это осознанная цель курса intermediate.

## Что вы узнаете (итог курса)

- Собрать стек из уроков 01–33 в одном runbook.
- Проверить себя скриптом и чеклистом.
- Оформить краткий отчёт для «сдачи» или портфолио.

## Архитектура стенда

```mermaid
flowchart TB
  subgraph lab_host [lab 172.28.0.10]
    Proxy[nginx :8080]
  end
  subgraph srv1_host [srv1 172.28.0.11]
    UFW[ufw 22 80]
    Nginx[nginx :80]
    Cron[cron tar backup]
    Backup[/backup]
  end
  User[You on lab] --> Proxy
  Proxy -->|proxy_pass| Nginx
  User -->|SSH HTTP| srv1_host
  Cron --> Backup
  UFW --> Nginx
```

Опционально: **web** (.20) с TLS, **NFS** вместо tar, Postgres health с [`deploy/postgres`](../../deploy/postgres/README.md).

## Требования

| # | Компонент | Где | Критерий |
|---|-----------|-----|----------|
| 1 | ufw | srv1 | active; 22, 80; SSH с lab |
| 2 | nginx | srv1 | HTTP 200 на / |
| 3 | reverse proxy | lab | :8080 → srv1 |
| 4 | backup | srv1 | `/backup/*.tar.gz` или NFS mount |
| 5 | логи | srv1/lab | нет критичных err nginx/ssh |
| 6 | (опц.) TLS | web | curl -k https://172.28.0.20 |
| 7 | (опц.) Postgres | lab | curl health deploy/postgres |

## Runbook — рекомендуемый порядок

### Фаза 1: srv1 — база

```bash
ssh course@172.28.0.11
sudo apt update
sudo apt install -y nginx ufw
sudo systemctl enable --now nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

### Фаза 2: ufw (две SSH-сессии!)

См. [08-lab-firewall](08-lab-firewall.md):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow from 172.28.0.0/24 to any port 22 proto tcp
sudo ufw enable
```

С lab: `ssh course@172.28.0.11 true` и `curl http://172.28.0.11/`.

### Фаза 3: backup

```bash
sudo mkdir -p /backup
echo '0 * * * * root tar czf /backup/etc-nginx-$(date +\%F).tar.gz /etc/nginx 2>/dev/null' | sudo tee /etc/cron.d/lab-backup-nginx
```

Для быстрой проверки временно `* * * * *`, дождаться файла, вернуть `0 * * * *`.

### Фаза 4: proxy на lab

```bash
# на lab
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/lab-proxy <<'EOF'
server {
    listen 8080;
    location / {
        proxy_pass http://172.28.0.11;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/lab-proxy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

### Фаза 5: deploy user (опционально, но полезно)

По [linux-basic/18](../linux-basic/18-final-project.md): пользователь **deploy**, SSH-ключ, [24-lab-sudo](24-lab-sudo.md) для nginx.

### Фаза 6: отчёт

На lab:

```bash
cat > ~/intermediate-done.txt <<EOF
Intermediate final — $(date -Is)
srv1: ufw + nginx + /backup
lab: proxy :8080 -> 172.28.0.11
Checks: see below
EOF
```

## Проверочный скрипт (с lab)

```bash
echo "=== intermediate final checks ==="
curl -s -o /dev/null -w "srv1 direct: %{http_code}\n" http://172.28.0.11/
curl -s -o /dev/null -w "lab proxy:   %{http_code}\n" http://127.0.0.1:8080/
ssh -o ConnectTimeout=5 course@172.28.0.11 'sudo ufw status | head -3; ls /backup 2>/dev/null | head -3'
journalctl -u nginx --no-pager -p err -n 3 2>/dev/null || true
cat ~/intermediate-done.txt 2>/dev/null
```

Ожидается: **200**, **200**, ufw active, хотя бы один `.tar.gz` в `/backup`.

## Критерии сдачи

- [ ] HTTP 200 на srv1 с lab
- [ ] ufw active, SSH не потерян
- [ ] proxy :8080 → 200
- [ ] `/backup` содержит архив nginx (или NFS смонтирован)
- [ ] `~/intermediate-done.txt` заполнен
- [ ] Можете устно объяснить путь пакета: lab → proxy → srv1

## Если застряли

| Проблема | Глава |
|----------|--------|
| SSH timeout | [07](07-firewall.md), [08](08-lab-firewall.md) |
| 502 proxy | [13](13-nginx.md), [14](14-lab-nginx.md) |
| пустой /backup | [cron в linux-basic](../linux-basic/12-scheduling.md) |
| DNS имена | [03](03-dns.md) |

Полный сброс: `docker compose down -v && docker compose up -d` в `deploy/linux`.

## Дальше по пути DevOps

- [linux-advanced](../linux-advanced/README.md) — namespaces, cgroups, подготовка ноды
- [linux-security](../linux-security/README.md) — hardening, audit
- [kuber-basic](../kuber-basic/README.md) — оркестрация поверх этих навыков
- [gitlab-basic](../gitlab-basic/README.md) — CI для деплоя на такие хосты

Поздравляем с завершением **linux-intermediate** — вы прошли путь от TCP/IP до мини-стека с firewall, вебом и бэкапом на реальном (пусть и Docker) Linux.
