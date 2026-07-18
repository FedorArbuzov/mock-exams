# 11. Лаба: стек deploy/containers end-to-end

## Цель лабы

С нуля поднять **web + api + redis**, пройти **smoke**, изучить **порядок healthy**, изменить сервис и сделать **rolling recreate** через compose.

## Предварительно

- Порты **8088** свободен.
- Теория: [10. Multi-service Compose](10-compose-multi-service.md).

---

## Задание 1. Чистый старт

```bash
cd deploy/containers
docker compose down -v --rmi local 2>/dev/null || true
docker compose up -d --build
docker compose ps -a
```

**Что увидите:** redis → api (health: starting → healthy) → web.

---

## Задание 2. Валидация конфига

```bash
docker compose config --services
docker compose config | grep -E "container_name|condition"
```

**Что увидите:** `redis`, `api`, `web`; `condition: service_healthy` у web.

---

## Задание 3. Smoke

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

**Что увидите:** HTTP 200 на `/api/health`, hits увеличивается.

---

## Задание 4. Наблюдение health

```bash
watch -n2 'docker inspect mock-containers-api --format "{{.State.Health.Status}}"' 
# или вручную несколько раз:
docker inspect mock-containers-api --format '{{.State.Health.Status}}'
```

**Что увидите:** переход `starting` → `healthy`.

---

## Задание 5. Изменение api и redeploy

Добавьте в `stack/api/app.py` поле в JSON health, например `"service":"api"`:

```python
return jsonify(status="ok", service="api")
```

```bash
docker compose up -d --build api
curl -s http://localhost:8088/api/health
```

**Что увидите:** новое поле в ответе **без** пересборки web.

Откатите изменение при желании.

---

## Задание 6. Масштаб (ограничение compose)

```bash
docker compose up -d --scale api=2 2>&1 | tail -3
```

**Что увидите:** ошибка или предупреждение — **container_name** фиксирован; для нескольких api нужен другой compose (без `container_name`). Зафиксируйте вывод в заметках.

---

## Задание 7. Логи при сбое

```bash
docker compose stop redis
sleep 2
curl -s http://localhost:8088/api/health || true
docker compose logs --tail 15 api
docker compose start redis
docker compose restart api
```

**Что увидите:** health fail; ошибки redis в логах api.

---

## Задание 8. Полный down

```bash
docker compose down
docker compose ps -a
```

**Что увидите:** пустой список сервисов проекта.

Поднимите снова для следующих глав:

```bash
docker compose up -d --build
```

---

## Критерии успеха

- [ ] `compose up --build` — все сервисы running, api healthy
- [ ] `smoke.sh` успешен
- [ ] Понимаете порядок depends_on + health
- [ ] После правки api redeploy только api
- [ ] При остановке redis health api падает

## Что унести в работу

- `docker compose config` — проверка перед коммитом
- Smoke — минимальный контракт «стек жив»
- `--build` после изменения Dockerfile/кода

Следующий урок: [12. Registry](12-registry.md).
