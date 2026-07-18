# 18. Финальный проект: мини-сервер на srv1

## Зачем этот проект

До сих пор темы шли по отдельности: пользователи, права, systemd, ssh. В проде всё **связано**: deploy заходит по ключу, перезапускает unit, cron пишет бэкап, nginx отдаёт статику. Здесь вы соберёте такой же **маленький** срез на **srv1** (172.28.0.11) и проверите с **lab** (172.28.0.10).

Не гонитесь за идеальной безопасностью — это учебный стенд. Но привыкайте к порядку: ключи, отдельный пользователь, sudo по минимуму, логи.

## Что должно получиться

| # | Требование | Зачем |
|---|------------|--------|
| 1 | Пользователь **deploy**, home, shell `/bin/bash` | не работать от course/root |
| 2 | **deploy** в sudo (для лабы можно NOPASSWD на отдельные команды) | админские действия осознанно |
| 3 | SSH с lab на deploy **по ключу** | как в CI и jump-host |
| 4 | Unit **lab-app.service** — пишет маркер в `/var/log/lab-app.log` | systemd |
| 5 | Cron: раз в час архив `/etc/nginx` в `/backup` | автоматизация |
| 6 | Каталог `/backup` существует | место для архивов |
| 7 | **nginx** отвечает на `http://172.28.0.11` | проверка сети + сервиса |

## Пошаговый план (рекомендуемый порядок)

### 1. Подключиться к srv1

С lab:

```bash
ssh course@172.28.0.11
# пароль: course
```

Дальше команды с префиксом «на srv1», если не сказано иное.

### 2. Пользователь deploy

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy
```

Для быстрой проверки cron можно временно дать полный sudo; в intermediate настроите точечный sudoers.

### 3. Ключ с lab

На **lab** (не на srv1):

```bash
test -f ~/.ssh/id_lab.pub || ssh-keygen -t ed25519 -f ~/.ssh/id_lab -N "" -C "lab-to-srv1"
ssh-copy-id -i ~/.ssh/id_lab.pub deploy@172.28.0.11
ssh -i ~/.ssh/id_lab deploy@172.28.0.11 hostname
```

Должно войти **без пароля**.

### 4. lab-app.service

Создайте скрипт, например `/usr/local/bin/lab-app.sh`:

```bash
#!/bin/bash
echo "$(date -Is) lab-app ran" >> /var/log/lab-app.log
```

```bash
sudo chmod +x /usr/local/bin/lab-app.sh
```

Unit в `/etc/systemd/system/lab-app.service` (oneshot или simple с `RemainAfterExit=yes` — как в [10-lab-systemd](10-lab-systemd.md)):

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lab-app.service
sudo systemctl status lab-app --no-pager
```

### 5. nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
curl -s http://127.0.0.1/ | head
```

### 6. Cron и backup

```bash
sudo mkdir -p /backup
echo '0 * * * * root tar czf /backup/etc-nginx-$(date +\%F).tar.gz /etc/nginx 2>/dev/null' | sudo tee /etc/cron.d/lab-backup-nginx
```

Для быстрой проверки **временно** можно `* * * * *`, дождаться файла в `/backup`, вернуть `0 * * * *`.

### 7. README для себя (опционально)

```bash
echo "deploy, lab-app, nginx, hourly nginx backup" | sudo tee /home/deploy/README.txt
sudo chown deploy:deploy /home/deploy/README.txt
```

## Проверка с lab — чеклист сдачи

```bash
ssh -i ~/.ssh/id_lab deploy@172.28.0.11 'hostname; id'
curl -s -o /dev/null -w "%{http_code}\n" http://172.28.0.11/
ssh -i ~/.ssh/id_lab deploy@172.28.0.11 'ls -la /backup; sudo systemctl status lab-app --no-pager; tail -1 /var/log/lab-app.log'
```

Ожидаете: HTTP **200**, файл `.tar.gz` в `/backup` (или после тестового cron), строка в lab-app.log.

## Если что-то не работает

| Симптом | Куда смотреть |
|---------|----------------|
| SSH просит пароль | права `~deploy/.ssh`, `authorized_keys` 600 |
| curl timeout | nginx не слушает, firewall (пока редко в стенде) |
| пустой /backup | cron, путь к tar, есть ли `/etc/nginx` |
| lab-app failed | `journalctl -u lab-app -n 30` |

## Дальше по пути DevOps

- [linux-intermediate](../linux-intermediate/README.md) — DNS, firewall, TLS, Postfix
- [gitlab-basic](../gitlab-basic/README.md) — CI (можно параллельно)
- [linux-security](../linux-security/README.md) — hardening ssh и аудит
- [bare-metal](../bare-metal/README.md) — железо и PXE

Поздравляем с закрытием базового трека — дальше сеть и сервисы «как в проде», но всё ещё в том же Docker-стенде.
