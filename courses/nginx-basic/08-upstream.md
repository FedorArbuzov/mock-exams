# 08. upstream: группа backend и балансировка

## Введение: один api станет тремя

Пока в конфиге написано `proxy_pass http://api:8080/`, nginx обращается к **одному** адресу. Когда инстансов приложения несколько, вводят блок **`upstream`** — именованная группа серверов. Edge обращается к группе: `proxy_pass http://api_backends/;`.

Тот же паттерн в Kubernetes: **Service** с несколькими **Endpoints** (Pod'ами) — Ingress Controller выбирает backend по правилам, похожим на upstream. Теория Ingress — [глава 10](10-ingress-preview.md). Пример конфига: [`examples/upstream.conf`](examples/upstream.conf). Лаба — [09](09-lab-upstream.md).

## Что вы узнаете

- Синтаксис `upstream { server ... }`.
- Методы балансировки **round_robin** (по умолчанию), **least_conn**.
- `max_fails`, `fail_timeout`, `down`.
- **keepalive** к upstream.

## Базовый upstream

```nginx
upstream api_backends {
    server api:8080;
}

server {
    location /api/ {
        proxy_pass http://api_backends/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Имя **`api_backends`** — произвольное; в `proxy_pass` используется **без** схемы в URI path (только имя группы + слэш для переписывания префикса).

## Несколько серверов

```nginx
upstream api_backends {
    least_conn;
    server api:8080 weight=1;
    server api2:8080 weight=1;
}
```

| Директива | Эффект |
|-----------|--------|
| (default) round robin | по очереди |
| `least_conn` | на менее загруженный |
| `weight=N` | доля трафика |
| `backup` | только если основные down |
| `down` | исключить вручную (канарейка) |

На учебном стенде второй сервис **api2** можно добавить в compose для финального проекта; в лабе 09 достаточно одного server в upstream с **keepalive**.

## max_fails и fail_timeout

```nginx
server api:8080 max_fails=2 fail_timeout=10s;
```

После **2** неудачных попыток в течение окна nginx **10 секунд** не шлёт трафик на этот server → в error.log **`no live upstreams`**, клиенту **502**.

Полезно при rolling deploy: старый Pod ещё в списке, но не отвечает.

## keepalive к upstream

```nginx
upstream api_backends {
    server api:8080;
    keepalive 8;
}

location /api/ {
    proxy_pass http://api_backends/;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

Без **`Connection ""`** keepalive к upstream не работает — каждый запрос новое TCP. Для высокого RPS это заметно.

## upstream vs переменная в proxy_pass

| Подход | Когда |
|--------|-------|
| `upstream { }` | несколько backend, баланс, fail |
| `proxy_pass http://api:8080/` | один сервис compose, простые лабы |

DNS имени **api** в Docker обновляется при recreate контейнера; nginx кэширует resolve при старте worker — после смены IP иногда нужен **reload** edge.

## Health checks

В **open source** nginx нет активного HTTP health check в `upstream` (есть в **nginx plus** / коммерческих форках). В проде:

- Kubernetes **readiness** убирает Pod из Service;
- внешний health checker + `down` через API;
- отдельный слой (Service Mesh).

Для курса достаточно compose **healthcheck** на api.

## Связь с Ingress

Ingress rule `path: /api` → **Service: api:8080** ≈ `location /api/` + `upstream` на endpoints Service. Аннотации ingress-nginx часто дублируют rewrite и proxy headers — см. [kuber-basic/20-ingress](../kuber-basic/20-ingress.md).

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| 502 no live upstreams | все server в fail state |
| Трафик только на первый | `ip_hash` / sticky без нужды |
| keepalive не работает | забыли `proxy_http_version 1.1` и `Connection ""` |

## В продакшене

- Blue/green: два upstream или weight.
- Canary: `weight=1` на новую версию.
- Мониторинг `upstream_response_time` (расширенный log_format).

## Резюме

**upstream** объединяет backend'ы за одним именем в **proxy_pass**. **max_fails** защищает от «битого» инстанса. **keepalive** снижает latency. На стенде basic можно вынести api в upstream с одним server — подготовка к масштабированию.

## Чек-лист

- Зачем блок upstream при одном api?
- Что делает `max_fails=2 fail_timeout=10s`?
- Какие две директивы нужны для keepalive?

Следующий урок: [09. Лаба: upstream](09-lab-upstream.md).
