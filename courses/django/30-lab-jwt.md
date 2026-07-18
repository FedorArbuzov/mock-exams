# 30. Лаба: JWT SimpleJWT

## Сценарий

Mobile client не держит session cookie — нужен **stateless JWT**: obtain access token, отправлять `Authorization: Bearer` на write endpoints.

**Предварительно:** [29-drf-auth-permissions](29-drf-auth-permissions.md), пакет `djangorestframework-simplejwt` в образе стенда.

---

## Цель

1. Подключить SimpleJWT в settings + urls.
2. Read products — anonymous; POST — authenticated.
3. Obtain token + create product через curl.

---

## Шаг 1. settings

```python
INSTALLED_APPS = [
    ...
    "rest_framework_simplejwt",
]

REST_FRAMEWORK = {
    ...
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
}
```

`IsAuthenticatedOrReadOnly` — GET list/retrieve без token, POST/PUT/DELETE — с token.

---

## Шаг 2. urls

```python
# config/urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    ...
    path("api/v1/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/v1/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
```

---

## Шаг 3. User + token

```bash
docker exec -it mock-django-web python manage.py createsuperuser
# username: admin, password: adminpass (dev only)

curl -s -X POST http://localhost:8092/api/v1/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}' | python -m json.tool
```

Сохраните `"access"` из ответа.

---

## Шаг 4. Authorized POST

```bash
TOKEN=<access from above>
curl -s -X POST http://localhost:8092/api/v1/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"JWT-1","title":"JWT Product","price":"15.00","category_id":1}'
```

---

## Шаг 5. Negative tests

```bash
# без token — 401/403
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8092/api/v1/products/ \
  -H "Content-Type: application/json" -d '{"sku":"X","title":"Y","price":"1","category_id":1}'

# невалидный token — 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8092/api/v1/products/ \
  -H "Authorization: Bearer invalid" ...
```

---

## Шаг 6. Per-view override (опционально)

```python
from rest_framework.permissions import AllowAny

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
```

Или `get_permissions()` для разных actions.

---

## JWT vs Session

| | Session | JWT |
|---|---------|-----|
| Storage | server + cookie | client header |
| Revoke | logout easy | blacklist / short TTL |
| CSRF | нужен | не нужен |

См. [`fastapi/26-jwt-auth`](../fastapi/26-jwt-auth.md).

---

## Критерии приёмки

- [ ] POST `/api/v1/token/` → access + refresh
- [ ] POST product без token → 401 или 403
- [ ] POST product с valid Bearer → 201
- [ ] GET `/api/v1/products/` без token → 200

Далее: [31-middleware](31-middleware.md).
