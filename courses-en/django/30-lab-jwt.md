# 30. Lab: JWT with SimpleJWT

## Scenario

A mobile client doesn't hold a session cookie — it needs **stateless JWT**: obtain an access token and send it as `Authorization: Bearer` on write endpoints.

**Prerequisites:** [29-drf-auth-permissions](29-drf-auth-permissions.md), the `djangorestframework-simplejwt` package in the stand image.

---

## Goal

1. Wire up SimpleJWT in settings + urls.
2. Reading products stays anonymous; POST requires authentication.
3. Obtain a token and create a product via curl.

---

## Step 1. settings

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

`IsAuthenticatedOrReadOnly` — GET list/retrieve work without a token; POST/PUT/DELETE need one.

---

## Step 2. urls

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

## Step 3. User + token

```bash
docker exec -it mock-django-web python manage.py createsuperuser
# username: admin, password: adminpass (dev only)

curl -s -X POST http://localhost:8092/api/v1/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}' | python -m json.tool
```

Save the `"access"` value from the response.

---

## Step 4. Authorized POST

```bash
TOKEN=<access from above>
curl -s -X POST http://localhost:8092/api/v1/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"JWT-1","title":"JWT Product","price":"15.00","category_id":1}'
```

---

## Step 5. Negative tests

```bash
# no token — 401/403
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8092/api/v1/products/ \
  -H "Content-Type: application/json" -d '{"sku":"X","title":"Y","price":"1","category_id":1}'

# invalid token — 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8092/api/v1/products/ \
  -H "Authorization: Bearer invalid" ...
```

---

## Step 6. Per-view override (optional)

```python
from rest_framework.permissions import AllowAny

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
```

Or use `get_permissions()` to vary permissions by action.

---

## JWT vs Session

| | Session | JWT |
|---|---------|-----|
| Storage | server + cookie | client header |
| Revoke | logout is easy | blacklist / short TTL |
| CSRF | needed | not needed |

See [`fastapi/26-jwt-auth`](../fastapi/26-jwt-auth.md).

---

## Acceptance criteria

- [ ] POST `/api/v1/token/` returns access + refresh
- [ ] POST product without a token returns 401 or 403
- [ ] POST product with a valid Bearer token returns 201
- [ ] GET `/api/v1/products/` without a token returns 200

Next: [31-middleware](31-middleware.md).
