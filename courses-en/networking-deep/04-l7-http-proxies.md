# 04. L7: HTTP, proxies, load balancing, keep-alive

## Intro

L7 is where the **meaning of a request** lives — headers, cookies, gRPC metadata. "The network works" (TCP 443 is open), but the API returns a 403 from the WAF — that's already L7. Connects to [nginx-basic](../nginx-basic/README.md) and [aws-intermediate/03](../aws-intermediate/03-alb-security-groups.md).

---

## Reverse proxy vs forward proxy

| | Reverse proxy | Forward proxy |
|---|---------------|---------------|
| Who initiates | client → internet | internal host → internet |
| Examples | nginx, ALB, Ingress | corporate proxy, Squid |
| Backend visibility | client doesn't know the real app | server sees the proxy |

```text
Client → ALB (L7) → Target Group (instance IP:port)
              ↓
         health check GET /health
```

---

## HTTP/1.1 keep-alive and limits

One TCP connection, many requests. Problems:

- ALB **idle timeout** (default 60s) < the app's long poll → 504
- **Max requests per connection** — a rare reset
- **Header too large** — 431/400

```bash
curl -v http://host/ 2>&1 | grep -i '< HTTP\|< connection'
```

---

## Load balancing

| Algorithm | When |
|----------|--------|
| round-robin | homogeneous backends |
| least connections | varying request durations |
| ip hash / sticky cookie | session state on a node |
| consistent hash | caches, sharding |

The **health check** must verify **dependencies** (DB), otherwise a "green" instance returns 500s to users.

---

## gRPC and HTTP/2

- One TCP connection, multiplexed streams.
- The L7 LB must understand **HTTP/2** / gRPC (ALB, nginx `grpc_pass`).
- Timeout on the **stream**, not just on the TCP connection.

---

## Headers that break production

| Header | Risk |
|--------|------|
| `X-Forwarded-For` | trust only from a known proxy |
| `Host` | wrong vhost → 404 on the "right" IP |
| `Content-Length` vs chunked | desync attacks, buggy parsers |

---

## In mock-exams

- nginx upstream: [nginx-basic](../nginx-basic/README.md)
- ALB + target group: [aws-intermediate/04-lab-alb](../aws-intermediate/04-lab-alb-security-groups.md)
- Ingress: [kuber-basic Ingress](../kuber-basic/README.md)

---

## Summary

L7 is **semantics and policy** (auth, routing, rate limit). TCP succeeding while L7 fails is a normal situation. Always look at the **response code and body**, not just `nc -zv`.

---

## Checklist

- [ ] How does an ALB health check differ from `systemctl is-active`?
- [ ] Why do sticky sessions interfere with a rolling deploy?
- [ ] Where in your stack does TLS end (termination)?

**Next:** [05. Routing](05-routing.md).
