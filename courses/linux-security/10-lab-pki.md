# 10. Лаба: выпустить сертификат для web

**Стенд:** [`deploy/linux`](../../deploy/linux/README.md).

## Задание 1. Каталог PKI

```bash
mkdir -p /tmp/pki-lab && cd /tmp/pki-lab
```

## Задание 2. CA

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -days 3650 -out ca.crt \
  -subj "/CN=Mock Exams Lab CA"
```

## Задание 3. Server

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=web.lab.local"
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256
openssl verify -CAfile ca.crt server.crt
```

## Задание 4. Установка на web (опционально)

```bash
scp server.key server.crt course@172.28.0.20:/tmp/
ssh course@172.28.0.20 'sudo cp /tmp/server.{key,crt} /etc/nginx/ssl/ && sudo nginx -t && sudo systemctl reload nginx'
```

## Задание 5. curl с CA

```bash
curl -v --cacert /tmp/pki-lab/ca.crt https://172.28.0.20/ 2>&1 | head -30
```

## Критерии успеха

- [ ] verify OK
- [ ] curl с --cacert без SSL error (при настроенном nginx ssl)

Следующий урок: [11. SELinux и AppArmor](11-selinux.md).
