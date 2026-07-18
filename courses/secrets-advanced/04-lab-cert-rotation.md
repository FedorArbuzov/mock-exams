# 04. Лаба: ротация сертификата

## Цель лабы

Смоделировать **жизненный цикл leaf**: выпуск → мониторинг срока → «ротация» (новый issue) → отзыв старого lease → заполнить [`examples/rotation-checklist.md`](examples/rotation-checklist.md).

## Предварительно

- [03. Ротация и renewal](03-rotation-renewal.md)
- Выполнена [02-lab-pki-issue-cert](02-lab-pki-issue-cert.md)
- Стенд с `init-engines.sh`

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

---

## Задание 1. Два поколения cert

Выпустите **cert A** с коротким TTL:

```bash
vault write -format=json pki/issue/lab-server \
  common_name="rotate.lab.mock-exams.local" \
  ttl=2h > /tmp/vault-pki-lab/cert-a.json

LEASE_A=$(jq -r '.lease_id' /tmp/vault-pki-lab/cert-a.json)
SERIAL_A=$(jq -r '.data.serial_number' /tmp/vault-pki-lab/cert-a.json)
echo "LEASE_A=$LEASE_A SERIAL_A=$SERIAL_A"
```

Через минуту (симуляция «приближается expiry») выпустите **cert B** на тот же CN:

```bash
vault write -format=json pki/issue/lab-server \
  common_name="rotate.lab.mock-exams.local" \
  ttl=24h > /tmp/vault-pki-lab/cert-b.json

SERIAL_B=$(jq -r '.data.serial_number' /tmp/vault-pki-lab/cert-b.json)
```

**Критерий:** `SERIAL_A != SERIAL_B` — разные сертификаты на один CN допустимы при overlap (в prod — контролируйте, кто на каком слушает).

---

## Задание 2. Проверка сроков

```bash
jq -r '.data.certificate' /tmp/vault-pki-lab/cert-a.json | openssl x509 -noout -dates
jq -r '.data.certificate' /tmp/vault-pki-lab/cert-b.json | openssl x509 -noout -dates
```

Запишите в чек-лист раздел **Leaf**: notBefore/notAfter обоих.

---

## Задание 3. Отзыв cert A

```bash
vault lease revoke "$LEASE_A"
```

Проверьте список cert (опционально):

```bash
vault list pki/certs
vault read pki/cert/$SERIAL_A
```

**Что увидите:** cert может отображаться; **revocation** влияет на CRL. На собеседовании важно: **отозванный** cert не должен приниматься клиентом с проверкой CRL.

---

## Задание 4. Заполните rotation-checklist

Откройте [`examples/rotation-checklist.md`](examples/rotation-checklist.md) и отметьте пункты раздела **Leaf**, которые вы **фактически** выполнили в лабе. В разделе **Vault-специфика** добавьте одну строку: кто имел доступ (`VAULT_TOKEN=course` — почему это плохо в prod).

---

## Задание 5. Role TTL (опционально)

Укоротите max TTL role (осторожно — только лаб):

```bash
vault write pki/roles/lab-server \
  allowed_domains="lab.mock-exams.local" \
  allow_subdomains=true \
  max_ttl=48h

vault write pki/issue/lab-server \
  common_name="short.lab.mock-exams.local" \
  ttl=100h
```

**Ожидание:** ошибка о превышении max_ttl. Верните `max_ttl=720h` через `init-engines.sh` или вручную как в скрипте.

---

## Критерии успеха

- [ ] Два serial на одном CN, понимаете overlap window
- [ ] Выполнен `lease revoke` для старого cert
- [ ] Чек-лист заполнен (минимум раздел Leaf)
- [ ] Можете объяснить **⅔ TTL** на примере cert B

Следующий урок: [05. Transit](05-transit-encryption.md).
