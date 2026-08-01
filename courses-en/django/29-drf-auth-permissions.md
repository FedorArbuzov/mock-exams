# 29. DRF Authentication and Permissions

## Introduction

Public catalog reads — **AllowAny**. Writes — **IsAuthenticated** plus a role check.

```python
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission

class ProductViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]
```

---

## Auth classes

| Class | Use |
|-------|-----|
| SessionAuthentication | browser + cookies |
| TokenAuthentication | DRF token (legacy) |
| JWTAuthentication | SimpleJWT |

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
}
```

---

## Custom permission

```python
class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
```

---

## Object-level

`has_object_permission` — lets an owner edit their own Order.

---

## Django auth integration

User model, groups, permissions — `user.has_perm('catalog.change_product')`.

[`fastapi/19-oauth2-jwt`](../fastapi/19-oauth2-jwt.md) — the equivalent concepts there.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| AllowAny on DELETE | explicit permissions |
| JWT in localStorage XSS | httpOnly cookie pattern for SPA |

## Summary

Layer permissions on top of ViewSet actions. Use JWT via SimpleJWT. Integrate with Django's users and groups.

Next: [30-lab-jwt](30-lab-jwt.md).
