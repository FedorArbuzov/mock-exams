# 09. PKI and a mini-CA with OpenSSL

## Why your own CA in the lab

Understanding the **chain of trust** is needed for:

- TLS inside a company (a private CA);
- mTLS between services;
- debugging `curl SSL certificate problem`.

In production, public sites — **Let's Encrypt** or a commercial CA.

## Participants

| Object | File | Secret? |
|--------|------|---------|
| CA private key | `ca.key` | **yes** |
| CA certificate | `ca.crt` | public |
| Server key | `server.key` | **yes** |
| Server cert | `server.crt` | public |
| CSR | `server.csr` | a signing request |

## Step 1: CA

```bash
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.crt -subj "/CN=Lab Dev CA/O=Mock Exams/C=RU"
```

`-x509` — a self-signed CA cert right away.

## Step 2: Server key + CSR

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
  -subj "/CN=web.lab.local/O=App/C=RU"
```

The **CN** must match the client's hostname (or a SAN).

## Step 3: CA signing

```bash
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256 \
  -extfile <(printf "subjectAltName=DNS:web.lab.local,DNS:web,IP:172.28.0.20")
```

## Step 4: Verification

```bash
openssl verify -CAfile ca.crt server.crt
openssl x509 -in server.crt -text -noout | head -25
```

## Client trust

```bash
curl --cacert ca.crt https://web.lab.local/
```

Without `ca.crt` in the trust store — an error (expected for a private CA).

## Let's Encrypt (production)

**certbot** — an HTTP-01 or DNS-01 challenge. Auto-renewal via cron.

## Checklist

- How does ca.key differ from server.key?
- Why a SAN?
- Why doesn't the browser trust it without importing ca.crt?

Next lesson: [10. Lab: PKI](10-lab-pki.md).
