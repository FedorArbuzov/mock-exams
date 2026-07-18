# 08. Лаба: ufw на srv1

## Цель лабы

Вы включите **default deny** на учебном сервере **srv1**, не потеряв SSH, и проверите HTTP с **lab**. Это тот же порядок действий, который нужен на любой VM в облаке — только вместо консоли AWS вы можете откатить контейнер через `docker compose restart srv1`.

## Предварительно

- Стенд [`deploy/linux`](../../deploy/linux/README.md) запущен: `docker compose up -d`.
- Пройдены уроки [01–06](01-tcp-ip.md) — вы пингуете 172.28.0.11 с lab.
- Учётка: **course** / **course**.
- **Два терминала:** один останется на lab для проверок, второй зайдёт на srv1 по SSH.

## Подготовка стенда

**Терминал 1 (lab):**

```bash
docker compose exec lab bash
ping -c2 172.28.0.11
ssh course@172.28.0.11 'hostname; sudo ufw status'
```

Если SSH спрашивает fingerprint — ответьте `yes`. Если `Connection refused` — подождите минуту после `compose up` и проверьте `docker compose ps`.

**Терминал 2 (srv1):** из lab выполните:

```bash
ssh course@172.28.0.11
```

Дальнейшие шаги с префиксом «на srv1» — в этой сессии.

Установите nginx, если ещё нет:

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

Ожидается **200**.

---

## Задание 1. Посмотреть ufw до изменений

**Зачем:** зафиксировать baseline — inactive или уже есть правила.

На srv1:

```bash
sudo ufw status verbose
```

**Что увидите:** чаще всего `Status: inactive` на свежем контейнере.

**Если не работает:** `sudo: ufw: command not found` — `sudo apt install -y ufw`.

---

## Задание 2. Политики и правила (ещё без enable)

**Зачем:** собрать правила **до** включения фильтра — так не блокируете себе SSH.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow from 172.28.0.0/24 to any port 22 proto tcp comment 'lab network ssh'
sudo ufw status numbered
```

**Что увидите:** список правил с номерами `[ 1]`, `[ 2]`, … — SSH и 80/tcp в списке, статус всё ещё `inactive` до enable.

**Если не работает:** опечатка в CIDR — проверьте `172.28.0.0/24`, не `/32`.

---

## Задание 3. Проверка SSH со второй сессии

**Зачем:** убедиться, что после enable сможете зайти с lab.

**Не закрывая** терминал 2 на srv1, в **терминале 1 (lab)**:

```bash
ssh course@172.28.0.11 'echo SSH before enable OK'
```

Должно пройти без пароля, если настроен ключ; иначе — пароль course.

---

## Задание 4. Включить ufw

**Зачем:** применить правила к входящему трафику.

На srv1:

```bash
sudo ufw enable
# на вопрос Proceed — y
sudo ufw status verbose
```

**Что увидите:**

```text
Status: active
Default: deny (incoming), allow (outgoing), ...
```

В терминале 1 снова:

```bash
ssh course@172.28.0.11 'echo SSH after enable OK'
```

**Если SSH завис / timeout:** см. раздел «Аварийный откат» внизу. **Не** паникуйте — учебный контейнер перезапускается.

---

## Задание 5. HTTP с lab

**Зачем:** проверить, что разрешён не только SSH, но и сервис.

На lab:

```bash
curl -s -o /dev/null -w "HTTP code: %{http_code}\n" http://172.28.0.11/
curl -s http://172.28.0.11/ | head -5
```

**Что увидите:** `HTTP code: 200` и HTML welcome nginx.

**Если 000 или timeout:** на srv1 `sudo ufw allow 80/tcp` и `sudo systemctl status nginx`.

---

## Задание 6. Закрытый порт (убедиться, что deny работает)

**Зачем:** убедиться, что неразрешённые порты реально фильтруются.

На lab:

```bash
nc -zv -w2 172.28.0.11 8080 2>&1 || true
```

Ожидается отказ или timeout — вы **не** открывали 8080.

Для сравнения:

```bash
nc -zv -w2 172.28.0.11 80 2>&1
```

**Что увидите:** 80 — succeeded (если nginx слушает), 8080 — нет.

---

## Задание 7. Под капотом (опционально)

На srv1:

```bash
sudo nft list ruleset 2>/dev/null | head -40
```

**Что увидите:** цепочки ufw-* — связь теории с практикой.

---

## Уборка

Если srv1 нужен «чистым» для других лаб:

```bash
sudo ufw disable
sudo ufw reset
```

`reset` удалит все правила ufw — только на учебном стенде.

---

## Аварийный откат

| Ситуация | Действие |
|----------|----------|
| Потеряли SSH после enable | с хоста: `cd deploy/linux && docker compose restart srv1` |
| Нужно срочно открыть 22 | через `docker compose exec srv1 bash` от root: `ufw allow 22/tcp` |
| Полный сброс стенда | `docker compose down -v && docker compose up -d` |

---

## Критерии успеха

- [ ] `ufw status` — **active**, default deny incoming
- [ ] SSH с lab работает **после** enable
- [ ] `curl http://172.28.0.11/` — HTTP 200
- [ ] Порт 8080 с lab не принимается
- [ ] Держали две сессии во время enable

## Что унести в работу

- Правило **OpenSSH до enable** — не обсуждается.
- Всегда **вторая сессия** при смене firewall.
- Проверка сервиса — `curl`/`nc` с клиента, не только `localhost` на сервере.

Следующий урок: [09. TLS и OpenSSL](09-tls-openssl.md).
