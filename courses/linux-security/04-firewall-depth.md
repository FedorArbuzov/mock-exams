# 04. Defense in depth (эшелонированная защита)

## Идея

Один контроль **ломается** — следующий должен остановить атаку.

```text
[1] Cloud SG / perimeter ACL
[2] Host firewall (ufw/nft)
[3] Application bind 127.0.0.1
[4] AuthZ в приложении
[5] Encryption at rest
```

## Слой 1: периметр

В AWS — **Security Groups**. Разрешить только 443 с ALB, 22 с bastion IP.

## Слой 2: хост

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 10.0.0.0/8 to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**nftables** — гибче, один ruleset:

См. [examples/nftables-lab.nft](examples/nftables-lab.nft):

- policy drop на input;
- established,related accept;
- lo accept;
- 22, 80 явно.

```bash
sudo nft -f /path/to/nftables-lab.nft
sudo nft list ruleset
```

## Слой 3: приложение

```nginx
server {
    listen 127.0.0.1:8080;   # только локально
    ...
}
```

База слушает `127.0.0.1:5432`, не `0.0.0.0`.

## Слой 4: логирование и IDS

- auditd на критичные файлы;
- fail2ban на auth.log;
- центральный SIEM (вне курса).

## Default deny

| Политика | Риск |
|----------|------|
| default allow | забытый сервис = открыт миру |
| default deny | нужно явно открыть каждый порт |

## Чек-лист

- Назовите 3 слоя для srv1.
- Почему ufw **и** cloud SG?
- Что слушает `0.0.0.0` на хосте — как проверить?

Следующий урок: [05. Лаба: firewall](05-lab-firewall-depth.md).
