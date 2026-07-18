# 41. Interview Q&A: Django и DRF (топ-40)

## Architecture

**1. MTV vs MVC?** Model–Template–View; Template ≈ View, View ≈ Controller.

**2. Django vs FastAPI?** Django — platform (ORM, admin, auth); FastAPI — typed ASGI API. DRF для REST в Django.

**3. WSGI vs ASGI?** Sync workers vs async protocol; Django 5 async views partial.

**4. INSTALLED_APPS зачем?** Registry models, commands, static, admin.

---

## ORM

**5. QuerySet lazy?** SQL при evaluation.

**6. select_related vs prefetch_related?** JOIN FK vs separate query M2M/reverse.

**7. N+1?** Loop without select_related — fix in queryset.

**8. on_delete PROTECT vs CASCADE?** Business: protect parent deletion vs cascade children.

**9. migrate vs makemigrations?** Generate vs apply.

**10. Data migration?** RunPython with historical apps.get_model.

---

## DRF

**11. Serializer vs ModelForm?** JSON vs HTML validation binding.

**12. ViewSet vs APIView?** CRUD convention vs custom.

**13. Router?** Auto URL patterns for ViewSet.

**14. Pagination types?** PageNumber, LimitOffset, Cursor.

**15. Authentication vs Permission?** Who vs what allowed.

**16. JWT flow?** Obtain pair → Bearer header → refresh.

---

## Production

**17. DEBUG=False effects?** No stack trace, static manifest, security.

**18. ALLOWED_HOSTS?** Host header validation.

**19. gunicorn workers?** Processes; DB pool × workers.

**20. collectstatic?** Gather static to STATIC_ROOT.

**21. Middleware order?** Outermost first on request.

**22. Cache invalidation?** Signals, version keys, TTL.

---

## Testing

**23. TestCase isolation?** Transaction rollback per test.

**24. APITestCase?** DRF client + JSON responses.

**25. force_authenticate?** Bypass login in tests.

---

## System design

**26. Catalog 10k RPS read?** Redis cache, read replicas, CDN static, pagination.

**27. Multi-tenant?** Schema per tenant vs row-level tenant_id + middleware.

**28. Monolith vs split?** Admin+Django vs extract FastAPI read service.

**29. Migrations zero downtime?** Expand-contract, backfill.

**30. File uploads?** S3 + django-storages; not in DB.

---

## Tricky

**31. CSRF with session API?** Token header for AJAX.

**32. Race on stock decrement?** F() update or select_for_update.

**33. Raw SQL when?** Reporting; prefer ORM.

**34. Custom User model?** Before first migrate — AUTH_USER_MODEL.

**35. Signals abuse?** Hidden logic — prefer explicit services.

**36. Admin in prod?** IP restrict, 2FA, separate URL.

**37. Serializer nested write?** Nested serializers + create override.

**38. Throttling?** DRF throttle classes + redis.

**39. OpenAPI from DRF?** drf-spectacular schema.

**40. Compare DRF schema to FastAPI OpenAPI?** DRF needs plugin; FastAPI native.

---

Практика: [42-capstone](42-capstone.md). Шпаргалка: [interview-cheatsheet](interview-cheatsheet.md).

Далее: [42-capstone](42-capstone.md).
