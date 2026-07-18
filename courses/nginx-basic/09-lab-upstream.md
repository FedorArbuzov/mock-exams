# 09. Лаба: upstream в edge

## Цель лабы

Вынести **api** в блок **`upstream`**, подключить **keepalive**, проверить `nginx -t`, smoke и откатить при необходимости. Использовать шаблон [`examples/upstream.conf`](examples/upstream.conf).

## Предварительно

- [08. upstream](08-upstream.md).
- Рабочий стенд после [лабы 07](07-lab-502-debug.md).

---

## Задание 1. Файл upstream

Создайте `deploy/nginx/config/conf.d/05-upstream-api.conf`:

```nginx
upstream api_backends {
    least_conn;
    server api:8080 max_fails=2 fail_timeout=10s;
    keepalive 8;
}
```

Пока **не** меняйте `00-default.conf`.

```bash
docker compose exec mock-nginx-edge nginx -t
```

**Что увидите:** `syntax is ok` (upstream без location допустим).

---

## Задание 2. Переключить location /api/

В `00-default.conf` в `location /api/` замените:

```nginx
proxy_pass http://api:8080/;
```

на:

```nginx
proxy_pass http://api_backends/;
proxy_set_header Connection "";
```

Остальные `proxy_set_header` оставьте.

```bash
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
bash scripts/smoke.sh
```

**Что увидите:** smoke OK.

---

## Задание 3. Проверка endpoints

```bash
curl -s http://localhost:8080/api/health
curl -s http://localhost:8080/api/hits
```

---

## Задание 4. Симуляция fail (кратко)

```bash
docker compose stop api
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/health
grep -i "upstream\|refused" logs/error.log | tail -2
docker compose start api
sleep 2
curl -s http://localhost:8080/api/health
```

**Что увидите:** 502 при stop; после start — снова ok.

---

## Задание 5. Документировать diff

Сохраните для себя: «было `proxy_pass http://api:8080/` → стало `http://api_backends/` + upstream file».

---

## Задание 6. (Опционально) второй server

Если добавите в compose сервис `api2` (копия build api), добавьте в upstream:

```nginx
server api2:8080 max_fails=2 fail_timeout=10s;
```

Перезапустите edge и проверьте балансировку несколькими запросами (для учебного api ответ одинаковый).

---

## Критерии успеха

- [ ] Файл `05-upstream-api.conf` создан
- [ ] `location /api/` использует `api_backends`
- [ ] `nginx -t` и smoke успешны
- [ ] Понимаете, зачем `Connection ""` при keepalive

## Откат

Удалите `05-upstream-api.conf`, верните `proxy_pass http://api:8080/;` в `00-default.conf`, уберите `Connection ""`, `-t`, reload.

Следующий урок: [10. Ingress preview](10-ingress-preview.md).
