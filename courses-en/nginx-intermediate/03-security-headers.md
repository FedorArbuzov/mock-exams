# 03. Security headers and HSTS

## Intro: TLS encrypts, but not everything

HTTPS protects the channel from eavesdropping. Separately, the browser needs to be **told** how to handle cookies, frames, MIME-sniffing, and repeat visits over HTTPS only. This is done with **HTTP response headers** — often it's the **edge nginx** that adds them, not each application.

In Kubernetes the same headers are set via Ingress annotations (`nginx.ingress.kubernetes.io/configuration-snippet` or built-in flags). The skill with edge nginx transfers directly to [Ingress](../kuber-basic/20-ingress.md).

## What you'll learn

- Why `Strict-Transport-Security` (HSTS) and the risk of preload.
- The basic set: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- The `add_header` directive and the pitfall of omitting `always`.
- Where to place headers: only the HTTPS `server` or HTTP too.

---

## HSTS

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

| Parameter | Meaning |
|----------|--------|
| `max-age` | seconds during which the browser **itself** uses HTTPS only |
| `includeSubDomains` | extend to subdomains |
| `preload` | inclusion in browser lists (careful — irreversible without careful planning) |

**Important:** HSTS only makes sense **when** TLS actually works on all paths. In a self-signed lab the browser may not trust the site — HSTS is still useful for practicing header checks via `curl -I`.

HSTS **does not replace** the HTTP→HTTPS redirect: a first visit over HTTP is possible until the browser has received the header.

---

## Protection against clickjacking and MIME

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

| Header | Effect |
|-----------|--------|
| `X-Frame-Options: SAMEORIGIN` | disallow embedding in an `<iframe>` from other sites |
| `X-Content-Type-Options: nosniff` | the browser doesn't "guess" the file type |

The modern alternative — **Content-Security-Policy** (`frame-ancestors 'self'`) — is broader but harder to maintain. At the intermediate level the classic trio is enough.

---

## Referrer-Policy

```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Limits leaking the full URL in the `Referer` header when navigating to other sites.

---

## add_header and always

By default nginx does **not** add `add_header` to responses with 4xx/5xx codes from **error_page**, unless `always` is specified:

```nginx
add_header X-Content-Type-Options "nosniff" always;
```

Without `always`, on a 502 page the client may not receive the security headers — a security audit flags this.

For several headers in one `location` — use several `add_header` lines or `more_set_headers` from the headers-more module (if installed).

---

## Where to declare them

The recommended order on the stand:

1. In `server { listen 443 ssl; ... }` — HSTS and general headers.
2. Duplicating "safe" headers on HTTP is **not** required; HSTS is not set on :80.

Example fragment (see also [examples/ssl-server-block.conf](examples/ssl-server-block.conf)):

```nginx
server {
    listen 443 ssl;
    # ssl_certificate ...

    add_header Strict-Transport-Security "max-age=86400" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / { ... }
}
```

In the lab you can set `max-age` to **86400** (a day), so as not to "lock" the browser for a year during experiments.

---

## Verification

```bash
curl -skI https://localhost:8443/ | grep -iE 'strict-transport|x-frame|x-content|referrer'
```

Online scanners (securityheaders.com) won't work on localhost — only curl or DevTools → Network → Headers.

---

## CSP and Permissions-Policy (overview)

| Header | Purpose |
|-----------|------------|
| `Content-Security-Policy` | where script/style/img can be loaded from |
| `Permissions-Policy` | camera, geolocation, microphone |

In the final project you can add a minimal CSP for static: `default-src 'self'`.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| HSTS on an HTTP-only lab without TLS | the browser remembers "HTTPS only" for a broken cert |
| a year-long `max-age` on a dev domain | hard to roll back |
| `add_header` without `always` | headers disappear on 50x |
| Two `add_header` in a nested location | in nginx, inheritance is **not** like in CSS — a child location **replaces** the parent's header set for that location |

---

## Link to Ingress

ingress-nginx annotations:

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
```

HSTS is sometimes enabled globally in the controller's ConfigMap — once for the whole cluster.

---

## Summary

Security headers are a layer of **browser policy** on top of TLS. On the edge nginx they're centralized via `add_header ... always` in the HTTPS `server`. HSTS forces repeat visits over HTTPS; the rest reduce the risk of clickjacking and MIME-sniffing.

## Checklist

- [ ] Why `always` on `add_header`?
- [ ] Why is HSTS set on 443 and not on the learning HTTP :8080?
- [ ] How is CSP broader than `X-Frame-Options`?

Next lesson: [04. Lab: HSTS and headers](04-lab-hsts-headers.md).
