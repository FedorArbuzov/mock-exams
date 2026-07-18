# 22. Security checklist для REST API

## Введение: «OWASP API Top 10 — не чеклист для галочки»

Пентест нашёл: **BOLA** (доступ к чужим `items` по id), **отсутствие rate limit** на login, **CORS `*`**, секреты в git, verbose 500 с traceback. FastAPI не «безопасен из коробки» — он **прозрачен** для аудита. Эта глава — практический baseline перед production и связка с [`appsec-fundamentals`](../appsec-fundamentals/README.md), [`nginx-intermediate`](../nginx-intermediate/03-security-headers.md).

## Что вы узнаете

- **OWASP API Security Top 10** в контексте FastAPI.
- **CORS**, security headers, HTTPS termination.
- Управление **секретами** и конфигурацией.
- Минимальный чеклист перед релизом.

---

## OWASP API Top 10 (сжато)

| # | Риск | Контроль в FastAPI-стеке |
|---|------|---------------------------|
| API1 | Broken Object Level Authorization | `owner_id` check, не доверять id из body |
| API2 | Broken Authentication | JWT exp, bcrypt, lockout / rate limit |
| API3 | Broken Object Property Level | `response_model`, exclude sensitive fields |
| API4 | Unrestricted Resource Consumption | `limit` cap, rate limit ([28-redis-cache](28-redis-cache.md)) |
| API5 | Broken Function Level Authorization | RBAC `require_role` ([20-rbac-scopes](20-rbac-scopes.md)) |
| API6 | Unrestricted Access to Sensitive Flows | CAPTCHA на register, MFA для admin |
| API7 | SSRF | валидация URL в webhooks |
| API8 | Security Misconfiguration | `debug=False`, скрыть `/docs` в prod |
| API9 | Improper Inventory Management | версии API, deprecate |
| API10 | Unsafe Consumption of APIs | timeout + validate внешних ответов |

Подробнее — курс [`appsec-fundamentals`](../appsec-fundamentals/README.md).

---

## CORS

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],  # не "*" с credentials
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

| Ошибка | Риск |
|--------|------|
| `allow_origins=["*"]` + `credentials=True` | браузер блокирует; если обход — утечка |
| CORS как «авторизация» | CORS только для браузера; curl обходит |
| Дублирование CORS в nginx и app | конфликт заголовков |

В production CORS часто на **nginx** ([`nginx-basic`](../nginx-basic/README.md)); приложение — второй уровень для dev.

---

## Security headers

```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
```

**HSTS** (`Strict-Transport-Security`) — на HTTPS edge (nginx), не на HTTP :8090 лабы.

Сравните с [nginx security headers](../nginx-intermediate/03-security-headers.md): в K8s Ingress те же идеи.

---

## Секреты и конфигурация

| Секрет | Где хранить |
|--------|-------------|
| `JWT_SECRET` | env / Vault / K8s Secret |
| `DATABASE_URL` | env, не в образе |
| API keys внешних сервисов | secrets manager |

```python
# pydantic-settings — fail fast
class Settings(BaseSettings):
    JWT_SECRET: str  # обязательное поле
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
```

| Антипаттерн | Действие |
|-------------|----------|
| `.env` в git | `.gitignore`, git-secrets scan |
| `course-dev-secret` в prod | ротация, разные env |
| Логи с Authorization | redact в middleware |

Стенд `deploy/fastapi` использует **dev** secret — для учёбы только.

---

## Ошибки и информационная утечка

```python
@app.exception_handler(Exception)
async def generic_handler(request, exc):
    logger.exception("unhandled")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

- **422** — детали валидации OK для клиента.
- **500** — без stack trace наружу.
- `/docs`, `/redoc` — отключить или за Basic Auth в prod.

---

## Транспорт и сеть

| Слой | Контроль |
|------|----------|
| Edge | TLS 1.2+, nginx cert ([34-nginx-tls](34-nginx-tls.md)) |
| Service mesh / K8s | NetworkPolicy |
| БД | только private network, не публиковать 5432 |

Лаба на **8090 HTTP** — норма; в prod API за TLS.

---

## Чеклист перед релизом

```markdown
- [ ] BOLA: каждый id-resource проверяет owner или role
- [ ] JWT: короткий TTL, сильный secret, alg фиксирован
- [ ] Пароли: bcrypt, нет default credentials
- [ ] Rate limit на /auth/token и тяжёлые GET
- [ ] CORS: whitelist origins
- [ ] Headers: nosniff, frame deny, HSTS на edge
- [ ] Секреты не в git / образе
- [ ] 500 без traceback клиенту
- [ ] Зависимости: pip audit / dependabot
- [ ] Логи без PII и токенов
```

---

## На стенде (самопроверка)

```bash
curl -sI http://localhost:8090/health
curl -s http://localhost:8090/openapi.json | head -c 100
# Убедитесь: нет лишних debug полей в ответах ошибок
```

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Проверка прав только в UI | BOLA | server-side always |
| Доверие `user_id` из JSON body | подмена владельца | только из JWT |
| Отключили CORS «для теста» в prod | CSRF-like сценарии | env-specific config |
| Один JWT secret на все среды | компрометация dev → prod | разные secrets |

---

## Резюме

Безопасность API — **авторизация на каждый объект**, короткие JWT, секреты из env, CORS whitelist, headers на edge, rate limit и мониторинг. FastAPI даёт hooks (dependencies, middleware); политику задаёте вы. Дальше — [23-middleware-cors](23-middleware-cors.md).

## Чек-лист

- Почему CORS не заменяет auth?
- Что такое BOLA на примере `/items/{id}`?
- Где ставить HSTS — в uvicorn или nginx?

Далее: [23-middleware-cors](23-middleware-cors.md).
