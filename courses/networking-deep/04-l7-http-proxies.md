# 04. L7: HTTP, прокси, балансировка, keep-alive

## Введение

L7 — где живут **смысл запроса**, заголовки, cookies, gRPC metadata. «Сеть работает» (TCP 443 открыт), но API отдаёт 403 из WAF — это уже L7. Связь с [nginx-basic](../nginx-basic/README.md) и [aws-intermediate/03](../aws-intermediate/03-alb-security-groups.md).

---

## Reverse proxy vs forward proxy

| | Reverse proxy | Forward proxy |
|---|---------------|---------------|
| Кто инициирует | клиент → интернет | внутренний хост → интернет |
| Примеры | nginx, ALB, Ingress | корпоративный proxy, Squid |
| Видимость backend | клиент не знает реальный app | сервер видит proxy |

```text
Client → ALB (L7) → Target Group (instance IP:port)
              ↓
         health check GET /health
```

---

## HTTP/1.1 keep-alive и лимиты

Один TCP — много запросов. Проблемы:

- **Idle timeout** ALB (default 60s) < long poll приложения → 504
- **Max requests per connection** — редкий reset
- **Header too large** — 431/400

```bash
curl -v http://host/ 2>&1 | grep -i '< HTTP\|< connection'
```

---

## Балансировка

| Алгоритм | Когда |
|----------|--------|
| round-robin | однородные backend |
| least connections | разная длительность запросов |
| ip hash / sticky cookie | session state на ноде |
| consistent hash | кэши, sharding |

**Health check** должен проверять **зависимости** (DB), иначе «зелёный» инстанс отдаёт 500 пользователям.

---

## gRPC и HTTP/2

- Один TCP, мультиплексирование streams.
- L7 LB должен понимать **HTTP/2** / gRPC (ALB, nginx `grpc_pass`).
- Timeout на **stream**, не только на TCP.

---

## Заголовки, которые ломают прод

| Header | Риск |
|--------|------|
| `X-Forwarded-For` | trust только от известного proxy |
| `Host` | wrong vhost → 404 на «правильном» IP |
| `Content-Length` vs chunked | desync атаки, buggy parsers |

---

## В mock-exams

- nginx upstream: [nginx-basic](../nginx-basic/README.md)
- ALB + target group: [aws-intermediate/04-lab-alb](../aws-intermediate/04-lab-alb-security-groups.md)
- Ingress: [kuber-basic Ingress](../kuber-basic/README.md)

---

## Резюме

L7 — **семантика и политика** (auth, routing, rate limit). TCP успешен при провале L7 — нормальная ситуация. Всегда смотрите **код ответа и тело**, не только `nc -zv`.

---

## Чек-лист

- [ ] Чем health check ALB отличается от `systemctl is-active`?
- [ ] Почему sticky session мешает rolling deploy?
- [ ] Где в вашем стеке заканчивается TLS (termination)?

**Дальше:** [05. Маршрутизация](05-routing.md).
