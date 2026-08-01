# 09. Proxying WebSocket

## Intro: HTTP that never ends

Ordinary HTTP: request → response → the connection can be closed. **WebSocket** — an upgrade of the same TCP connection into a bidirectional channel (chats, live dashboards, in-browser terminals, game sockets).

nginx as a reverse proxy must **pass the Upgrade through** and not tear down the long-lived connection with proxy timeouts.

On the stand [`deploy/nginx`](../../deploy/nginx/README.md) there's no dedicated WS backend — this chapter is **theory** plus a short lab note for self-study. In [kuber-intermediate](../kuber-intermediate/README.md) WebSocket often goes through the same **Ingress** with annotations.

## What you'll learn

- The `101 Switching Protocols` handshake.
- The mandatory nginx directives for WS.
- The `proxy_read_timeout` timeouts.
- ingress-nginx annotations for WebSocket.

---

## Handshake

The client sends:

```http
GET /ws HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: ...
```

The server responds **101**, and then a binary/text frame exchange follows — no longer the classic request/response.

nginx must pass the **Upgrade** and **Connection** headers to the upstream without "breaking" to HTTP/1.0 by default.

---

## Minimal location

```nginx
location /ws/ {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```

| Directive | Why |
|-----------|--------|
| `proxy_http_version 1.1` | Upgrade works in HTTP/1.1 |
| `Upgrade` / `Connection` | forwarding the upgrade |
| `proxy_read_timeout` | default is 60s — WS will drop |

For **multiple** locations a map is sometimes used:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
# proxy_set_header Connection $connection_upgrade;
```

---

## TLS and WSS

From the outside the client connects to **wss://** (TLS on the edge). Inside — `ws://` to the backend. The certificate is only on the edge — the same pattern as in [01-tls-termination](01-tls-termination.md).

---

## Kubernetes Ingress

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
```

For ingress-nginx, WebSocket usually works "out of the box" with HTTP/1.1 to the Service; problems are more often in **timeout** and **sticky session** if there are multiple backend replicas without shared state.

---

## A simple lab note (optional)

If you want to try WS without reworking the stand:

1. Bring up any echo server, for example `docker run --rm -p 8765:80 jmalloc/echo-server` (or websocat).
2. On the host, add to a separate `conf.d/99-ws-lab.conf` (don't commit it if it bothers the team):

```nginx
location /echo/ {
    proxy_pass http://host.docker.internal:8765/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

3. Check with [websocat](https://github.com/vi/websocat):  
   `websocat ws://localhost:8080/echo/`

On Windows `host.docker.internal` must resolve from the edge container.

**Criterion:** the connection doesn't drop after 60 s while idle (increase `proxy_read_timeout`).

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| 502 right after 101 | the upstream doesn't understand WS |
| Drop exactly after 60 s | a small `proxy_read_timeout` |
| Works directly, not through nginx | no `Upgrade` headers |
| Sticky not configured | k8s replicas, the session jumps around |

---

## Summary

WebSocket through nginx = HTTP/1.1 + Upgrade/Connection headers + long timeouts. At the k8s perimeter the same settings apply via Ingress annotations.

## Checklist

- [ ] What status does a successful handshake have?
- [ ] Why `proxy_http_version 1.1`?
- [ ] Where do you set the timeout in ingress-nginx?

Next lesson: [10. Performance tuning](10-performance-tuning.md).
