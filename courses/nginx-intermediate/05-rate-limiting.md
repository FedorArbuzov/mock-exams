# 05. Rate limiting в nginx

## Введение: один IP и тысяча POST /login

Brute-force на форму входа, сканеры, случайный DDoS от бота — типичная угроза на периметре. Первый рубеж — **ограничить частоту запросов** по ключу (обычно IP) **до** того, как нагрузка дойдёт до приложения.

nginx делает это модулем **ngx_http_limit_req_module** (в стандартной сборке). На стенде [`deploy/nginx`](../../deploy/nginx/README.md) зона `lab_limit` объявлена в `config/nginx.conf`, а location `/login` — в `config/conf.d/00-default.conf`.

В Ingress аналог — аннотации `nginx.ingress.kubernetes.io/limit-rps` или глобальные лимиты в ConfigMap [ingress-nginx](../kuber-basic/20-ingress.md).

## Что вы узнаете

- `limit_req_zone` — общая «корзина» токенов.
- `limit_req` в `location` — применение зоны.
- Параметры `rate`, `burst`, `nodelay`.
- Ответ **429 Too Many Requests** и что писать в runbook.

---

## Двухшаговая модель

```text
http {
    limit_req_zone $binary_remote_addr zone=lab_limit:10m rate=10r/s;
    ...
    server {
        location /login {
            limit_req zone=lab_limit burst=5 nodelay;
            ...
        }
    }
}
```

| Часть | Где | Роль |
|-------|-----|------|
| `limit_req_zone` | `http {}` | создать shared memory zone, задать **rate** |
| `limit_req` | `location` | привязать zone к URI |

Ключ `$binary_remote_addr` — IPv4/IPv6 клиента в бинарном виде (компактнее, чем `$remote_addr`).

Размер зоны `10m` — до ~160k записей IP (оценка из документации nginx). Для lab достаточно.

---

## rate, burst, nodelay

```nginx
limit_req zone=lab_limit burst=5 nodelay;
```

При `rate=10r/s`:

- В среднем **10 запросов в секунду** с одного IP проходят без задержки.
- **burst=5** — «карман» для кратковременных всплесков: можно обработать до 5 лишних запросов сразу.
- **nodelay** — лишние из burst не ставятся в очередь с задержкой, а обрабатываются сразу или отбрасываются (зависит от заполнения burst).

Без `nodelay` nginx **замедляет** запросы, выравнивая их под rate — для API login чаще хотят жёсткий отсев → 429.

Схема «ведро токенов»:

```text
rate 10r/s  → пополнение 10 токенов/сек
burst 5     → максимум 5 токенов в запасе
запрос      → −1 токен; нет токенов → 429 (при nodelay после исчерпания burst)
```

---

## Location /login на стенде

```nginx
location /login {
    limit_req zone=lab_limit burst=5 nodelay;
    proxy_pass http://api:8080/slow;
    proxy_set_header Host $host;
}
```

Backend `/slow` спит ~0.3 с — имитация тяжёлой авторизации. Под нагрузкой вы увидите смесь **200** и **429**.

Полный пример — [examples/rate-limit.conf](examples/rate-limit.conf).

---

## limit_conn (кратко)

Параллельный модуль **limit_conn** ограничивает **число одновременных соединений** с IP:

```nginx
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 20;
```

Используйте для защиты от slowloris или лимита долгих upload. Для REST login чаще достаточно `limit_req`.

---

## Логирование 429

В `access.log` статус **429**. Для алертов:

- счётчик 429 / 5m в Prometheus (экспортер nginx или парсинг логов);
- отдельный `map` для custom log format.

Не путайте 429 nginx с 429 от backend приложения (rate limit API).

---

## За прокси и CDN

Если перед nginx стоит **Cloudflare / ALB**, `$remote_addr` — IP балансера. Нужен `set_real_ip_from` + `real_ip_header X-Forwarded-For` и лимит по `$http_x_forwarded_for` или по доверенному заголовку CDN — иначе один ключ на весь CDN.

На учебном стенде клиент ходит напрямую на localhost — `$binary_remote_addr` корректен.

---

## Сравнение с приложением

| Уровень | Плюс | Минус |
|---------|------|--------|
| nginx | дёшево, рано отсекает мусор | не знает «логин user X» |
| приложение | лимит по user/account | нагрузка уже вошла в процесс |
| WAF / CDN | глобальная защита | стоимость, сложность |

Оптимально: грубый лимит на edge + точный в API.

---

## Типичные ошибки

| Ошибка | Симптом |
|--------|---------|
| Забыли `limit_req_zone` | `nginx -t` fail: unknown zone |
| Лимит на `/` вместо `/login` | легитимный трафик API режется |
| Слишком маленький burst | 429 при обычной нагрузке CI |
| Нет real_ip за LB | лимитится один IP балансера |

---

## Резюме

Rate limiting в nginx — зона в `http`, правило в `location`. На стенде `/login` защищён `lab_limit` 10r/s + burst 5. Проверка — `ab` или `hey`, ожидание 429.

## Чек-лист

- [ ] Где объявляется zone, где применяется?
- [ ] Что делает `nodelay`?
- [ ] Почему 429 на edge лучше, чем перегрузить Python API?

Следующий урок: [06. Лаба: rate limit](06-lab-rate-limit.md).
