# 09. PKI и mini-CA с OpenSSL

## Зачем своя CA в лабе

Понимание **цепочки доверия** нужно для:

- TLS внутри компании (private CA);
- mTLS между сервисами;
- отладки `curl SSL certificate problem`.

В проде публичные сайты — **Let's Encrypt** или коммерческий CA.

## Участники

| Объект | Файл | Секрет? |
|--------|------|---------|
| CA private key | `ca.key` | **да** |
| CA certificate | `ca.crt` | публичный |
| Server key | `server.key` | **да** |
| Server cert | `server.crt` | публичный |
| CSR | `server.csr` | запрос на подпись |

## Шаг 1: CA

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.crt -subj "/CN=Lab Dev CA/O=Mock Exams/C=RU"
```

`-x509` — сразу self-signed CA cert.

## Шаг 2: Server key + CSR

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
  -subj "/CN=web.lab.local/O=App/C=RU"
```

**CN** должен совпадать с hostname клиента (или SAN).

## Шаг 3: Подпись CA

```bash
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256 \
  -extfile <(printf "subjectAltName=DNS:web.lab.local,DNS:web,IP:172.28.0.20")
```

## Шаг 4: Проверка

```bash
openssl verify -CAfile ca.crt server.crt
openssl x509 -in server.crt -text -noout | head -25
```

## Доверие клиента

```bash
curl --cacert ca.crt https://web.lab.local/
```

Без `ca.crt` в trust store — ошибка (ожидаемо для private CA).

## Let's Encrypt (прод)

**certbot** — HTTP-01 или DNS-01 challenge. Автообновление cron.

## Чек-лист

- Чем ca.key отличается от server.key?
- Зачем SAN?
- Почему браузер не доверяет без импорта ca.crt?

Следующий урок: [10. Лаба: PKI](10-lab-pki.md).
