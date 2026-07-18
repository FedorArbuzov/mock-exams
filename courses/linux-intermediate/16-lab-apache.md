# 16. Лаба: Apache на srv2

## Цель лабы

Поднять **второй** веб-стек в учебной сети — **Apache** на **srv2** (172.28.0.12) — и проверить доступ с **lab**. Так вы убедитесь, что сеть L3 работает не только до srv1, и потрогаете `apache2ctl configtest` и access.log.

## Предварительно

- `ping 172.28.0.12` с lab — OK.
- SSH: **course** / **course**.

```bash
docker compose exec lab bash
ping -c2 172.28.0.12
```

---

## Подготовка стенда

Зайдите на srv2:

```bash
ssh course@172.28.0.12
```

---

## Задание 1. Установка Apache

**Зачем:** базовый цикл install → enable → configtest.

```bash
sudo apt update
sudo apt install -y apache2
systemctl is-active apache2
sudo apache2ctl configtest
```

**Что увидите:**

```text
Syntax OK
```

**Если AH00558 bind 80:** порт занят — `sudo ss -tlnp | grep :80`; в стенде srv2 обычно свободен.

---

## Задание 2. Дефолтная страница

```bash
curl -s http://127.0.0.1/ | head -10
curl -sI http://127.0.0.1/ | head -5
```

**Что увидите:** HTML Ubuntu/Apache default, `HTTP/1.1 200 OK`.

---

## Задание 3. Свой контент

**Зачем:** убедиться, что отдаёте правильный DocumentRoot.

```bash
echo '<h1>srv2 Apache — linux-intermediate lab 16</h1>' | sudo tee /var/www/html/index.html
curl -s http://127.0.0.1/ | grep srv2
```

---

## Задание 4. Проверка с lab

**Выйдите** на lab (новая сессия или `exit`):

```bash
curl -s http://172.28.0.12/ | head -8
curl -s -o /dev/null -w "HTTP code: %{http_code}\n" http://172.28.0.12/
```

**Что увидите:** ваш заголовок srv2, код **200**.

**Если timeout:** srv2 down, firewall (редко), неверный IP.

**Если connection refused:** apache не слушает 80 — вернитесь на srv2, `systemctl start apache2`.

---

## Задание 5. access.log

На srv2:

```bash
sudo tail -3 /var/log/apache2/access.log
```

С lab снова `curl http://172.28.0.12/`. На srv2:

```bash
sudo tail -1 /var/log/apache2/access.log
```

**Что увидите:** строка с IP **172.28.0.10** (lab) и `GET / HTTP/1.1" 200`.

---

## Задание 6. Сравнение с srv1 (опционально)

С lab:

```bash
echo "=== srv1 ==="
curl -s -o /dev/null -w "%{http_code}\n" http://172.28.0.11/ 2>/dev/null || echo "no server"
echo "=== srv2 ==="
curl -s -o /dev/null -w "%{http_code}\n" http://172.28.0.12/
```

На srv1 может быть nginx — другой Server header. Смысл: **два HTTP-сервера в одной сети**.

---

## Критерии успеха

- [ ] `apache2ctl configtest` — Syntax OK
- [ ] curl с lab — HTML с «srv2», HTTP 200
- [ ] access.log показывает запрос с IP lab

## Что унести в работу

- Второй хост в стенде — для сравнения nginx (srv1) vs Apache (srv2).
- Всегда configtest перед reload.

Следующий урок: [17. NFS](17-nfs.md).
