# 01. Threat model

Углубление для K8s, CI и облака: [appsec-fundamentals/02](../appsec-fundamentals/02-threat-modeling.md). для Linux-хоста

## Что такое threat model

**Threat model** — структурированный ответ: *что защищаем*, *от кого*, *как могут атаковать*, *что уже сделано*.

Без модели угроз hardening превращается в «закроем все порты» без понимания риска.

## Активы (что ценно)

| Актив | Пример на srv1 |
|-------|----------------|
| Данные | `/var/lib/app`, БД, бэкапы в `/backup` |
| Секреты | SSH keys, `.env`, TLS keys |
| Доступ | учётки `course`, `deploy`, sudo |
| Доступность | nginx, ssh для CI |
| Репутация | не быть пивотом для атаки внутрь сети |

## Угрозы (STRIDE, кратко)

| Категория | Пример для Linux-сервера |
|-----------|--------------------------|
| **S**poofing | поддельный SSH, фишинг ключей |
| **T**ampering | правка `/etc/passwd`, подмена бинарника |
| **R**epudiation | удаление логов auth |
| **I**nformation disclosure | world-readable `.env`, дамп памяти |
| **D**enial of service | flood на 80/22, disk fill |
| **E**levation | exploit setuid, kernel, слабый sudo |

## Trust boundaries

```text
     Internet / Office
            |
      [Firewall ufw]
            |
       srv1 (DMZ app)
            |
    [Private 172.28.0.0/24]
            |
      Postgres / internal
```

Всё **слева** от boundary — недоверенное. Всё **справа** — требует аутентификации и минимальных прав.

## Поверхность атаки нашего стенда

| Вектор | Реализация в lab |
|--------|------------------|
| SSH 22 | brute force, stolen key |
| HTTP 80/443 | nginx misconfig, CVE |
| Docker socket | если смонтирован — root |
| NFS | export 172.28.0.0/24 — утечка данных |
| Учебный пароль course | **не** для прода |

## Меры (что будем делать в курсе)

1. SSH: ключи, no root, AllowUsers
2. Firewall: default deny
3. auditd + fail2ban
4. Права на секреты, /tmp hardening
5. PKI для TLS
6. Отчёт audit

## Документ на 1 страницу

Шаблон для srv1:

```markdown
## Assets
- ...

## Threats (top 3)
1. ...

## Mitigations
- ...

## Residual risk
- ...
```

## Чек-лист

- Назовите топ-3 актива srv1.
- Где trust boundary между lab и srv1?
- Почему учебный пароль — отдельная угроза?

Следующий урок: [02. SSH hardening](02-ssh-hardening.md).
