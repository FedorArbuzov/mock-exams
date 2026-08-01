# kuber-mtls stand (kuber-advanced lab 29)

Minimal **OAD-style** stack for [Ingress mTLS](../../courses-en/kuber-advanced/29-lab-ingress-mtls.md):

- echo backend (returns request headers as JSON)
- public `/health` Ingress
- mTLS + Bearer injection on `/v1/external`

## Generate certificates

Requires OpenSSL (Git Bash / WSL / Linux / macOS):

```bash
cd deploy/kuber-mtls
bash scripts/generate-certs.sh ./certs
```

Creates:

| File | Use |
|---|---|
| `certs/server.crt`, `server.key` | Ingress TLS (`oad-tls` Secret) |
| `certs/client-ca.crt` | Ingress `auth-tls` Secret (`ca.crt`) |
| `certs/client.crt`, `certs/client.key` | curl `--cert` / `--key` |
| `certs/wrong-client.crt`, `wrong-client.key` | Signed by different CA (negative test) |

Hostname baked into server cert: **`oad.lab.local`**.

## Quick smoke (after lab manifests applied)

```bash
HOST=oad.lab.local
CERT=./certs/client.crt
KEY=./certs/client.key
INGRESS_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

curl -sk -o /dev/null -w '%{http_code}\n' "https://${HOST}/v1/external/batches" --resolve "${HOST}:443:${INGRESS_IP}"
curl -sk --cert "$CERT" --key "$KEY" "https://${HOST}/v1/external/batches" --resolve "${HOST}:443:${INGRESS_IP}"
```

Add `oad.lab.local` to hosts or use `--resolve` as above.
