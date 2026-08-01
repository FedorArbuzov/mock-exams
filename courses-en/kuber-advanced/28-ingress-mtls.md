# 28. Ingress mTLS: client certificates at the edge

Real-world pattern from platform work: an **external HTTP API** is already protected by a **Bearer token** inside the cluster, but the business also wants **mutual TLS** — only clients with a certificate signed by a trusted CA may reach the API. The customer must **not** know the internal Bearer token; the **Ingress** adds it after mTLS succeeds.

This chapter uses a simplified **OAD-style** layout (document analysis API): public health UI, locked-down `/v1/external`.

## Problem statement

| Requirement | Where it is enforced |
|---|---|
| Client presents a **trusted client certificate** | nginx Ingress (`auth-tls-*`) |
| Invalid / missing cert → **401** | Ingress `configuration-snippet` + `$ssl_client_verify` |
| Valid cert → proxy to app with `Authorization: Bearer <token>` | Ingress injects header; app unchanged |
| `/health` stays public (no mTLS) | **Separate** Ingress, same host, different path |

Application code keeps checking Bearer as before. mTLS is an **extra gate** at the edge.

## TLS vs mTLS

**HTTPS (one-way TLS):** client verifies the server certificate. Anyone who knows the URL can try Bearer/password.

**mTLS:** server also verifies a **client certificate** against a **CA** bundled in a Kubernetes Secret (`ca.crt`). Trust is cryptographic, not only a shared secret on the wire.

```text
Customer                 nginx Ingress              API Pod
   |                            |                      |
   |-- TLS + client cert ------>|                      |
   |                            | verify vs ca.crt     |
   |<-- 401 (bad/missing cert) -|                      |
   |                            |                      |
   |-- valid client cert ------>|                      |
   |                            |-- Bearer token ----->|
```

## Two Ingress objects on one host

You **cannot** register the same `host + path` on two Ingress resources — the ingress-nginx controller will reject duplicates.

Split by path:

| Ingress | Paths | mTLS |
|---|---|---|
| `oad-public` | `/health`, `/oad/ui`, … | no |
| `oad-external` | `/v1/external` | **yes** |

Same hostname (e.g. `oad.lab.local`), different manifests or Helm subcharts.

## nginx Ingress annotations (ingress-nginx)

| Annotation | Role |
|---|---|
| `nginx.ingress.kubernetes.io/auth-tls-verify-client: optional` | Ask for client cert without aborting TLS immediately |
| `nginx.ingress.kubernetes.io/auth-tls-secret: <ns>/<secret>` | Secret with key **`ca.crt`** (PEM of client CA) |
| `nginx.ingress.kubernetes.io/auth-tls-verify-depth: "2"` | Max chain depth |
| `nginx.ingress.kubernetes.io/configuration-snippet` | `if ($ssl_client_verify != SUCCESS) { return 401; }` and `proxy_set_header Authorization "Bearer …"` |
| `nginx.ingress.kubernetes.io/server-snippet` | Optional: map TLS errors `400 495 496` → **401** for bad certs |

### `$ssl_client_verify`

Built-in nginx variable (requires `ssl_verify_client`):

| Value | Meaning |
|---|---|
| `SUCCESS` | Client certificate valid |
| `NONE` | No client certificate |
| `FAILED:…` | Certificate present but not trusted |

With `verify-client: optional`, you can return a clean **HTTP 401** instead of only failing the TLS handshake.

## Secrets

**Client CA** (for ingress to trust customers):

```bash
kubectl create secret generic oad-mtls-client-ca \
  -n lab-oad \
  --from-file=ca.crt=./certs/client-ca.crt
```

**Server TLS** (normal HTTPS for the hostname):

```yaml
spec:
  tls:
    - hosts: [oad.lab.local]
      secretName: oad-tls
```

Secret `oad-tls` must contain `tls.crt` and `tls.key`.

**Bearer token** — in production, read from an existing Secret (Helm `lookup`, External Secrets, etc.). Never commit the token to git; inject at deploy time into the snippet or use an auth subrequest pattern.

## Helm vs raw manifests

Production teams often wrap `ingressExternal` in a chart:

- values: `mtls.enabled`, `caSecretName`, `verifyClient`, hosts, paths
- templates: conditional annotations + separate `ingress-external.yaml`
- helpers: resolve bearer token from Secret at `helm upgrade` time

The lab uses plain YAML so you see every annotation.

## Typical mistakes

| Symptom | Cause |
|---|---|
| Ingress won't create: path already defined | `/v1/external` duplicated on another Ingress |
| 401 with a "good" cert | Wrong `ca.crt` in Secret |
| TLS error instead of 401 | Need `optional` + `$ssl_client_verify` and/or `server-snippet` |
| `helm template` fails on token | `lookup` needs a live cluster — set token in values for dry-run |
| Customer must handle Bearer | Snippet missing — fix at Ingress |

## Relation to other courses

- Ingress basics: [kuber-basic/20-ingress](../kuber-basic/20-ingress.md)
- TLS at nginx edge: [nginx-intermediate](../nginx-intermediate/README.md)
- PKI concepts: [secrets-advanced](../secrets-advanced/README.md)

## Next

[29. Lab: mTLS for an external API](29-lab-ingress-mtls.md)
