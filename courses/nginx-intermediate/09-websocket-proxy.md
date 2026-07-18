# 09. Проксирование WebSocket

## Введение: HTTP, который не заканчивается

Обычный HTTP: запрос → ответ → соединение можно закрыть. **WebSocket** — апгрейд того же TCP-соединения до двустороннего канала (чаты, live-дашборды, терминалы в браузере, игровые сокеты).

nginx как reverse proxy должен **пропустить Upgrade** и не обрывать long-lived соединение таймаутами proxy.

На стенде [`deploy/nginx`](../../deploy/nginx/README.md) нет отдельного WS-backend — эта глава **теория** + короткая лабораторная заметка для самостоятельной проверки. В [kuber-intermediate](../kuber-intermediate/README.md) WebSocket часто идёт через тот же **Ingress** с аннотациями.

## Что вы узнаете

- Handshake `101 Switching Protocols`.
- Обязательные директивы nginx для WS.
- Таймауты `proxy_read_timeout`.
- Аннотации ingress-nginx для WebSocket.

---

## Handshake

Клиент шлёт:

```http
GET /ws HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: ...
```

Сервер отвечает **101** и дальше идёт бинарный/текстовый обмен фреймами — уже не классический request/response.

nginx должен передать заголовки **Upgrade** и **Connection** на upstream без «поломки» HTTP/1.0 по умолчанию.

---

## Минимальный location

```nginx
location /ws/ {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

| Директива | Зачем |
|-----------|--------|
| `proxy_http_version 1.1` | Upgrade работает в HTTP/1.1 |
| `Upgrade` / `Connection` | проброс апгрейда |
| `proxy_read_timeout` | по умолчанию 60s — WS оборвётся |

Для **нескольких** location иногда выносят map:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
# proxy_set_header Connection $connection_upgrade;
```

---

## TLS и WSS

Снаружи клиент подключается к **wss://** (TLS на edge). Внутри — `ws://` к backend. Сертификат только на edge — тот же паттерн, что в [01-tls-termination](01-tls-termination.md).

---

## Kubernetes Ingress

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
```

Для ingress-nginx WebSocket обычно работает «из коробки» при HTTP/1.1 к Service; проблемы чаще в **timeout** и **sticky session**, если несколько реплик backend без shared state.

---

## Простая лабораторная заметка (опционально)

Если хотите потрогать WS без доработки стенда:

1. Поднимите любой echo-server, например `docker run --rm -p 8765:80 jmalloc/echo-server` (или websocat).
2. На хосте добавьте в отдельный `conf.d/99-ws-lab.conf` (не коммитьте, если мешает команде):

```nginx
location /echo/ {
    proxy_pass http://host.docker.internal:8765/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

3. Проверка с [websocat](https://github.com/vi/websocat):  
   `websocat ws://localhost:8080/echo/`

На Windows `host.docker.internal` должен резолвиться из контейнера edge.

**Критерий:** соединение не обрывается через 60 с при простое (увеличьте `proxy_read_timeout`).

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| 502 сразу после 101 | upstream не понимает WS |
| Обрыв ровно через 60 s | малый `proxy_read_timeout` |
| Работает напрямую, не через nginx | нет `Upgrade` headers |
| Sticky не настроен | реплики k8s, сессия прыгает |

---

## Резюме

WebSocket через nginx = HTTP/1.1 + заголовки Upgrade/Connection + длинные таймауты. На периметре k8s те же настройки через Ingress annotations.

## Чек-лист

- [ ] Какой статус у успешного handshake?
- [ ] Зачем `proxy_http_version 1.1`?
- [ ] Где настраивают таймаут в ingress-nginx?

Следующий урок: [10. Performance tuning](10-performance-tuning.md).
