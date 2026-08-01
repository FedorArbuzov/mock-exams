# 10. Lab: issue a certificate for web

**Stand:** [`deploy/linux`](../../deploy/linux/README.md).

## Task 1. PKI directory

```bash
mkdir -p /tmp/pki-lab && cd /tmp/pki-lab
```

## Task 2. CA

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -days 3650 -out ca.crt \
  -subj "/CN=Mock Exams Lab CA"
```

## Task 3. Server

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/CN=web.lab.local"
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256
openssl verify -CAfile ca.crt server.crt
```

## Task 4. Install on web (optional)

```bash
scp server.key server.crt course@172.28.0.20:/tmp/
ssh course@172.28.0.20 'sudo cp /tmp/server.{key,crt} /etc/nginx/ssl/ && sudo nginx -t && sudo systemctl reload nginx'
```

## Task 5. curl with the CA

```bash
curl -v --cacert /tmp/pki-lab/ca.crt https://172.28.0.20/ 2>&1 | head -30
```

## Success criteria

- [ ] verify OK
- [ ] curl with --cacert without an SSL error (when nginx ssl is configured)

Next lesson: [11. SELinux and AppArmor](11-selinux.md).
