# 08. upstream: a group of backends and load balancing

## Intro: one api becomes three

As long as the config says `proxy_pass http://api:8080/`, nginx talks to a **single** address. When there are several application instances, you introduce an **`upstream`** block — a named group of servers. The edge addresses the group: `proxy_pass http://api_backends/;`.

The same pattern exists in Kubernetes: a **Service** with several **Endpoints** (Pods) — the Ingress Controller picks a backend by rules similar to upstream. Ingress theory is in [chapter 10](10-ingress-preview.md). An example config: [`examples/upstream.conf`](examples/upstream.conf). The lab is [09](09-lab-upstream.md).

## What you'll learn

- The `upstream { server ... }` syntax.
- The balancing methods **round_robin** (the default) and **least_conn**.
- `max_fails`, `fail_timeout`, `down`.
- **keepalive** to the upstream.

## A basic upstream

```nginx
upstream api_backends {
    server api:8080;
}

server {
    location /api/ {
        proxy_pass http://api_backends/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

The name **`api_backends`** is arbitrary; in `proxy_pass` it is used **without** a scheme in the URI path (only the group name + a slash to rewrite the prefix).

## Several servers

```nginx
upstream api_backends {
    least_conn;
    server api:8080 weight=1;
    server api2:8080 weight=1;
}
```

| Directive | Effect |
|-----------|--------|
| (default) round robin | in turn |
| `least_conn` | to the least loaded |
| `weight=N` | share of traffic |
| `backup` | only if the primaries are down |
| `down` | exclude manually (canary) |

On the learning stand a second service **api2** can be added to compose for the final project; in lab 09 a single server in the upstream with **keepalive** is enough.

## max_fails and fail_timeout

```nginx
server api:8080 max_fails=2 fail_timeout=10s;
```

After **2** failed attempts within the window, nginx sends no traffic to this server for **10 seconds** → in the error.log **`no live upstreams`**, and a **502** to the client.

Useful during a rolling deploy: an old Pod is still in the list but does not respond.

## keepalive to the upstream

```nginx
upstream api_backends {
    server api:8080;
    keepalive 8;
}

location /api/ {
    proxy_pass http://api_backends/;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

Without **`Connection ""`** keepalive to the upstream does not work — every request is a new TCP connection. At high RPS that is noticeable.

## upstream vs a variable in proxy_pass

| Approach | When |
|--------|-------|
| `upstream { }` | several backends, balancing, fail |
| `proxy_pass http://api:8080/` | one compose service, simple labs |

The DNS name **api** in Docker is updated when a container is recreated; nginx caches the resolve at worker start — after an IP change you sometimes need a **reload** of the edge.

## Health checks

In **open source** nginx there is no active HTTP health check in `upstream` (it exists in **nginx plus** / commercial forks). In production:

- Kubernetes **readiness** removes a Pod from the Service;
- an external health checker + `down` via the API;
- a separate layer (Service Mesh).

For the course a compose **healthcheck** on the api is enough.

## Connection to Ingress

An Ingress rule `path: /api` → **Service: api:8080** ≈ `location /api/` + `upstream` on the Service's endpoints. ingress-nginx annotations often duplicate the rewrite and proxy headers — see [kuber-basic/20-ingress](../kuber-basic/20-ingress.md).

## Common mistakes

| Symptom | Cause |
|---------|---------|
| 502 no live upstreams | all servers in a fail state |
| Traffic only to the first one | `ip_hash` / sticky without need |
| keepalive not working | forgot `proxy_http_version 1.1` and `Connection ""` |

## In production

- Blue/green: two upstreams or weight.
- Canary: `weight=1` on the new version.
- Monitoring `upstream_response_time` (an extended log_format).

## Summary

**upstream** groups backends behind a single name in **proxy_pass**. **max_fails** protects against a "broken" instance. **keepalive** reduces latency. On the basic stand you can move the api into an upstream with a single server — preparation for scaling.

## Checklist

- Why an upstream block with a single api?
- What does `max_fails=2 fail_timeout=10s` do?
- Which two directives are needed for keepalive?

Next lesson: [09. Lab: upstream](09-lab-upstream.md).
