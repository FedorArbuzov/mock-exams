# 29. Lab: mTLS for an external API (OAD pattern)

> **Based on a production task:** protect an external document API (`/v1/external`) with **client certificate authentication** at **nginx Ingress**, return **401** when the cert is missing or untrusted, and **inject** `Authorization: Bearer <token>` after success — the customer never sees the internal token.

Theory: [28. Ingress mTLS](28-ingress-mtls.md). Certificates: [`deploy/kuber-mtls`](../../deploy/kuber-mtls/README.md).

## What you are building

Simplified **da-oad** behaviour:

| Path | Ingress | mTLS | Backend sees |
|---|---|---|---|
| `/health` | `oad-public` | no | plain GET → 200 |
| `/v1/external/*` | `oad-external` | **yes** | request only if client cert OK; header `Authorization: Bearer …` added by Ingress |

Backend for the lab: **`mendhak/http-https-echo`** — echoes headers in JSON so you can prove Bearer injection without changing app code.

Namespace: **`lab-oad`**.

---

## Setup

### 1. Cluster + Ingress Controller

```bash
mockctl up
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.type=NodePort
```

Wait until the controller Pod is Ready.

### 2. Certificates

```bash
cd deploy/kuber-mtls
bash scripts/generate-certs.sh ./certs
```

### 3. Hostname resolution

Ingress uses host **`oad.lab.local`**. Point it at a node IP:

```bash
# bash / WSL / macOS / Linux
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "$NODE_IP  oad.lab.local" | sudo tee -a /etc/hosts
```

PowerShell (run as Administrator):

```powershell
$ip = kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type==\"InternalIP\")].address}'
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "$ip  oad.lab.local"
```

For `curl` without editing hosts, use `--resolve oad.lab.local:443:<NODE_IP>` (examples below).

---

## Task 1. Namespace, TLS secrets, backend

Create namespace **`lab-oad`**.

**Secrets:**

```bash
kubectl create namespace lab-oad

kubectl create secret tls oad-tls -n lab-oad \
  --cert=deploy/kuber-mtls/certs/server.crt \
  --key=deploy/kuber-mtls/certs/server.key

kubectl create secret generic oad-mtls-client-ca -n lab-oad \
  --from-file=ca.crt=deploy/kuber-mtls/certs/client-ca.crt
```

**Deployment + Service** `oad-api`:

- image: `mendhak/http-https-echo:33`
- container port `8080`, Service port `80` → targetPort `8080`
- labels: `app=oad-api`

Apply and wait until Ready:

```bash
kubectl -n lab-oad get deploy,svc,pods
```

---

## Task 2. Public Ingress (no mTLS)

Ingress **`oad-public`** on `oad.lab.local`:

- path `/health` → Service `oad-api`, port `80`
- TLS secret `oad-tls`
- `ingressClassName: nginx`
- **No** `auth-tls-*` annotations

Verify:

```bash
curl -sk -o /dev/null -w '%{http_code}\n' https://oad.lab.local/health
# expect 200
```

---

## Task 3. External Ingress (mTLS + Bearer injection)

Ingress **`oad-external`** — **only** path `/v1/external` (Prefix), same host `oad.lab.local`, same TLS secret.

**Lab bearer token** (fixed for this course): `lab-oad-bearer-token-2026`

Add annotations (adjust namespace in `auth-tls-secret` if needed):

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-tls-verify-client: optional
    nginx.ingress.kubernetes.io/auth-tls-secret: lab-oad/oad-mtls-client-ca
    nginx.ingress.kubernetes.io/auth-tls-verify-depth: "2"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      if ($ssl_client_verify != SUCCESS) {
        return 401;
      }
      proxy_set_header Authorization "Bearer lab-oad-bearer-token-2026";
    nginx.ingress.kubernetes.io/server-snippet: |
      error_page 400 495 496 =401 @ssl_client_error;
      location @ssl_client_error {
        return 401;
      }
```

> In production the Bearer value comes from a Secret (Helm `lookup`, Vault, etc.) — **not** from git. Here we use a fixed string so the lab works offline.

**Critical:** remove `/v1/external` from `oad-public` if you added it there — **one path → one Ingress**.

Apply and list:

```bash
kubectl -n lab-oad get ingress
```

---

## Task 4. curl test matrix

From repo root (paths to certs):

```bash
HOST=oad.lab.local
CERT=deploy/kuber-mtls/certs/client.crt
KEY=deploy/kuber-mtls/certs/client.key
BAD_CERT=deploy/kuber-mtls/certs/wrong-client.crt
BAD_KEY=deploy/kuber-mtls/certs/wrong-client.key
```

| # | Command | Expected |
|---|---|---|
| 1 | `curl -sk -o /dev/null -w '%{http_code}\n' https://${HOST}/v1/external/batches` | **401** |
| 2 | `curl -sk --cert "$CERT" --key "$KEY" https://${HOST}/v1/external/batches` | **200** + JSON body |
| 3 | Same as 2, inspect body | contains `"authorization": "Bearer lab-oad-bearer-token-2026"` (case may vary) |
| 4 | `curl -sk --cert "$BAD_CERT" --key "$BAD_KEY" https://${HOST}/v1/external/batches` | **401** or TLS error |
| 5 | `curl -sk -o /dev/null -w '%{http_code}\n' https://${HOST}/health` | **200** (no client cert) |

Example with cert:

```bash
curl -sk --cert "$CERT" --key "$KEY" https://oad.lab.local/v1/external/batches | head -c 400
```

PowerShell: use `curl.exe` (not the `Invoke-WebRequest` alias) for `--cert` / `--key`.

---

## Task 5. Explain (mentor / self-check)

Be ready to answer:

1. Why **two** Ingress objects instead of one?
2. What does `$ssl_client_verify` return when the client sends no certificate?
3. Why `verify-client: optional` instead of `on`?
4. Who adds the Bearer token — the echo container or nginx?
5. What breaks if `/v1/external` is still on `oad-public`?

---

## Task 6. (Optional) Helm-shaped values

Sketch how you would split this in a chart (no need to implement fully):

```yaml
ingressExternal:
  enabled: true
  mtls:
    enabled: true
    caSecretName: oad-mtls-client-ca
    verifyClient: optional
  hosts:
    - host: oad.lab.local
      paths:
        - path: /v1/external
          pathType: Prefix
```

Map each block to the annotations from Task 3.

---

## Troubleshooting

| Problem | What to check |
|---|---|
| Ingress not created | `kubectl describe ingress` — duplicate path on same host |
| 404 on `/v1/external` | Path prefix, Service name/port, controller running |
| 401 with valid cert | `ca.crt` in Secret matches issuer of `client.crt` |
| No Bearer in echo body | `configuration-snippet` on **external** Ingress only |
| TLS handshake error | `oad-tls` secret, host `oad.lab.local`, SAN in server cert |

Controller logs:

```bash
kubectl -n ingress-nginx logs deploy/ingress-nginx-controller --tail=50
```

---

## Deliverable checklist

- [ ] Understand TLS vs mTLS
- [ ] Secret `oad-mtls-client-ca` with key `ca.crt`
- [ ] Two Ingress resources, paths do not overlap
- [ ] curl without client cert → **401** on `/v1/external`
- [ ] curl with valid client cert → reaches backend; Bearer visible in echo JSON
- [ ] `/health` works **without** client cert
- [ ] Can explain why Bearer is injected at Ingress

---

## Cleanup

```bash
kubectl delete namespace lab-oad
# optional: helm uninstall ingress-nginx -n ingress-nginx
```

## Next

Theory recap: [28. Ingress mTLS](28-ingress-mtls.md). Course map: [README](README.md).
