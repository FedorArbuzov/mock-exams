# 07. Кэширование и gzip на edge

## Введение: зачем nginx сжимает и кэширует

Backend (Python, Java) тратит CPU на сериализацию JSON и отдачу статики. **edge nginx** может:

- **сжать** ответ gzip/brotli для текстовых типов — меньше байт по сети;
- **закэшировать** ответ backend в `proxy_cache` — повторные GET не бьют в API.

Это стандартный паттерн CDN и Ingress. В [kuber-intermediate](../kuber-intermediate/README.md) кэш на уровне Ingress реже, чем на отдельном nginx/CloudFront, но **gzip** часто включён глобально.

## Что вы узнаете

- `gzip` / `gzip_types` в `http {}`.
- `proxy_cache_path`, `proxy_cache`, `proxy_cache_valid`.
- Заголовки `Cache-Control` от backend vs кэш nginx.
- Когда кэшировать **нельзя** (POST, персональные данные).

---

## gzip

В `http {}` стенда можно добавить:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;
gzip_min_length 256;
gzip_types
    text/plain
    text/css
    application/json
    application/javascript
    text/xml
    application/xml;
```

| Директива | Смысл |
|-----------|--------|
| `gzip_vary on` | добавляет `Vary: Accept-Encoding` — важно за CDN |
| `gzip_proxied any` | сжимать ответы от `proxy_pass` |
| `gzip_min_length` | не сжимать крошечные ответы |
| `gzip_comp_level` | 1–9; выше — медленнее CPU |

Проверка:

```bash
curl -sH 'Accept-Encoding: gzip' -D - http://localhost:8080/static/ -o /dev/null | grep -i content-encoding
```

**brotli** (`brotli on`) — если модуль собран; в официальном `nginx:alpine` часто только gzip.

---

## proxy_cache

### 1. Зона на диске

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=100m inactive=60m use_temp_path=off;
```

| Параметр | Смысл |
|----------|--------|
| `keys_zone=static_cache:10m` | имя зоны + RAM для ключей |
| `max_size` | лимит на диске |
| `inactive` | удалить, если не запрашивали N времени |

В Docker нужен writable volume на `/var/cache/nginx` (в лабе — tmpfs или volume в compose).

### 2. В location

```nginx
location /static/ {
    proxy_cache static_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_use_stale error timeout updating;
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://static:80/;
}
```

`$upstream_cache_status`: **MISS**, **HIT**, **BYPASS**, **EXPIRED**.

### 3. Что не кэшировать

- `POST`, `PUT`, `PATCH`;
- ответы с `Set-Cookie` (по умолчанию nginx не кэширует, если не настроено иное);
- персональные API с `Authorization`;
- ответы с `Cache-Control: private/no-store` — уважайте через `proxy_cache_bypass` и `proxy_no_cache`.

---

## Микрокэш для API (осторожно)

Для публичного read-only GET иногда делают **1–5 секунд** кэша — сглаживание пиков:

```nginx
proxy_cache_valid 200 5s;
```

На стенде API `/health` кэшировать бессмысленно; для лабы кэшируйте **static**.

---

## Статика без proxy

Если nginx сам отдаёт файлы с диска (`root` / `alias`), кэш браузера задаётся заголовками:

```nginx
location ~* \.(css|js|png|jpg)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

На стенде static — отдельный контейнер; лаба 08 использует `proxy_cache` к нему.

---

## Сжатие + кэш: порядок

```text
запрос → proxy → backend
ответ ← gzip ← cache (если HIT — backend не вызывается)
```

Первый запрос: MISS, backend отработал, ответ положили в cache. Второй: HIT, gzip из кэша или сжатие на лету — зависит от конфига.

---

## Типичные ошибки

| Ошибка | Симптом |
|--------|---------|
| Нет volume для cache path | `crit` при старте, cache не пишется |
| Кэш login/session | утечка данных между пользователями |
| `gzip off` на уже сжатом контенте | двойное сжатие / поломка |
| Игнор `Vary` | неверный HIT для разных Accept |

---

## Резюме

gzip снижает трафик; `proxy_cache` снижает нагрузку на backend для идемпотентных GET. На intermediate включаем gzip в `nginx.conf`, кэш — для `/static/` с заголовком `X-Cache-Status`.

## Чек-лист

- [ ] Какие MIME обычно в `gzip_types`?
- [ ] Чем HIT отличается от MISS?
- [ ] Почему POST /login не кэшируют?

Следующий урок: [08. Лаба: cache и gzip](08-lab-cache.md).
