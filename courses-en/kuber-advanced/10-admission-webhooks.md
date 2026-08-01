# 10. Admission webhooks

## Where in the admission chain

After authn/authz, **before** the write to etcd:

```text
kubectl apply
    → MutatingAdmissionWebhook   (can modify the object)
    → ValidatingAdmissionWebhook (can reject)
    → etcd
```

## Validating vs Mutating

| | Validating | Mutating |
|---|---|---|
| Can modify the object? | No | Yes |
| Can reject? | Yes | Yes |
| Example | "forbid :latest" | "add a sidecar", "set labels" |

## Registering a webhook

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: deny-latest
webhooks:
  - name: deny-latest.example.com
    rules:
      - apiGroups: [""]
        apiVersions: [v1]
        operations: [CREATE, UPDATE]
        resources: [pods]
        scope: Namespaced
    clientConfig:
      service:
        namespace: webhook-system
        name: webhook-svc
        path: /validate
      caBundle: <base64-ca>    # CA for the webhook's TLS server
    admissionReviewVersions: [v1]
    sideEffects: None
    timeoutSeconds: 5
    failurePolicy: Fail          # Fail = reject when the webhook is unavailable
```

`failurePolicy: Ignore` — skip if the webhook is unavailable (dangerous for security).

## TLS

The apiserver calls the webhook over HTTPS. You need:

1. A certificate for the webhook's Service (often cert-manager).
2. A `caBundle` in the ValidatingWebhookConfiguration — the CA the apiserver trusts.

On minikube — cert-manager or self-signed + a manual caBundle.

## What the webhook receives

A POST with an `AdmissionReview`:

```json
{
  "request": {
    "uid": "...",
    "object": { ... Pod JSON ... },
    "operation": "CREATE"
  }
}
```

Response:

```json
{
  "response": {
    "uid": "...",
    "allowed": false,
    "status": { "message": "image tag :latest is not allowed" }
  }
}
```

## Off-the-shelf solutions

- **Kyverno** — policies as YAML, no code.
- **OPA Gatekeeper** — Rego policies.
- Your own webhook in Go/Python — full control.

## CKS checklist

- The order of mutating vs validating?
- What is `failurePolicy: Fail`?
- Why `caBundle`?
- Can a validating webhook modify a pod?
- An example policy for production?

Lab: [11-lab-validating-webhook.md](11-lab-validating-webhook.md) — Kyverno (simpler than writing a webhook from scratch).
