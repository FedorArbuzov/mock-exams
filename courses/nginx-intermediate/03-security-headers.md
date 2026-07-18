# 03. Security headers и HSTS

## Введение: TLS шифрует, но не всё

HTTPS защищает канал от прослушивания. Отдельно браузер нужно **подсказать**, как обращаться с cookies, фреймами, MIME-sniffing и повторными заходами только по HTTPS. Это делают **HTTP response headers** — часто их добавляет именно **edge nginx**, а не каждое приложение.

В Kubernetes те же заголовки задают через аннотации Ingress (`nginx.ingress.kubernetes.io/configuration-snippet` или встроенные флаги). Навык с edge nginx напрямую переносится на [Ingress](../kuber-basic/20-ingress.md).

## Что вы узнаете

- Зачем `Strict-Transport-Security` (HSTS) и риск preload.
- Базовый набор: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- Директива `add_header` и ловушка без `always`.
- Где ставить headers: только HTTPS `server` или и HTTP.

---

## HSTS

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

| Параметр | Смысл |
|----------|--------|
| `max-age` | секунды, сколько браузер **сам** ходит только на HTTPS |
| `includeSubDomains` | распространить на поддомены |
| `preload` | попадание в списки браузеров (осторожно, необратимо без осторожного планирования) |

**Важно:** HSTS имеет смысл **только** когда TLS реально работает на всех путях. На self-signed lab браузер может не доверять сайту — HSTS всё равно полезен для учебной проверки заголовков через `curl -I`.

HSTS **не заменяет** редирект HTTP→HTTPS: первый визит по HTTP возможен, пока браузер не получил заголовок.

---

## Защита от clickjacking и MIME

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

| Заголовок | Эффект |
|-----------|--------|
| `X-Frame-Options: SAMEORIGIN` | запрет встраивания в `<iframe>` с чужих сайтов |
| `X-Content-Type-Options: nosniff` | браузер не «угадывает» тип файла |

Современная альтернатива — **Content-Security-Policy** (`frame-ancestors 'self'`) — шире, но сложнее в сопровождении. На intermediate достаточно классической тройки.

---

## Referrer-Policy

```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Ограничивает утечку полного URL в заголовке `Referer` при переходе на другие сайты.

---

## add_header и always

По умолчанию nginx **не** добавляет `add_header` на ответы с кодами 4xx/5xx из **error_page**, если не указано `always`:

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

Без `always` на странице 502 клиент может не получить security headers — аудит безопасности это отмечает.

Для нескольких заголовков в одном `location` — несколько строк `add_header` или `more_set_headers` из модуля headers-more (если установлен).

---

## Где объявлять

Рекомендуемый порядок на стенде:

1. В `server { listen 443 ssl; ... }` — HSTS и общие headers.
2. Дублировать «безопасные» headers на HTTP **не** обязательно; HSTS на :80 не ставят.

Пример фрагмента (см. также [examples/ssl-server-block.conf](examples/ssl-server-block.conf)):

```nginx
server {
    listen 443 ssl;
    # ssl_certificate ...

    add_header Strict-Transport-Security "max-age=86400" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / { ... }
}
```

В лабе для `max-age` можно поставить **86400** (сутки), чтобы не «запереть» браузер на год при экспериментах.

---

## Проверка

```bash
curl -skI https://localhost:8443/ | grep -iE 'strict-transport|x-frame|x-content|referrer'
```

Онлайн-сканеры (securityheaders.com) на localhost не сработают — только curl или DevTools → Network → Headers.

---

## CSP и Permissions-Policy (обзор)

| Заголовок | Назначение |
|-----------|------------|
| `Content-Security-Policy` | откуда можно грузить script/style/img |
| `Permissions-Policy` | camera, geolocation, microphone |

В финальном проекте можно добавить минимальный CSP для static: `default-src 'self'`.

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| HSTS на HTTP-only lab без TLS | браузер помнит «только HTTPS» к сломанному cert |
| `max-age` год на dev-домене | сложно откатить |
| `add_header` без `always` | headers пропадают на 50x |
| Два `add_header` в nested location | в nginx наследование **не** как в CSS — дочерний location **заменя**ет набор заголовков родителя для этого location |

---

## Связь с Ingress

Аннотации ingress-nginx:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
```

HSTS иногда включают глобально в ConfigMap контроллера — один раз для всего кластера.

---

## Резюме

Security headers — слой **политики браузера** поверх TLS. На edge nginx их централизуют через `add_header ... always` в HTTPS `server`. HSTS заставляет повторные визиты идти по HTTPS; остальные снижают риск clickjacking и MIME-sniffing.

## Чек-лист

- [ ] Зачем `always` у `add_header`?
- [ ] Почему HSTS ставят на 443, а не на учебный HTTP :8080?
- [ ] Чем CSP шире, чем `X-Frame-Options`?

Следующий урок: [04. Лаба: HSTS и headers](04-lab-hsts-headers.md).
