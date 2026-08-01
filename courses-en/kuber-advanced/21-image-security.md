# 21. Image security and cosign

## Supply chain

The chain of trust:

```text
Code → CI build → image in registry → pull into the cluster
```

Risks: image substitution, vulnerabilities in the base image, `:latest` without a pin.

## Image pull policy

```yaml
imagePullPolicy: Always    # always pull (for :latest)
imagePullPolicy: IfNotPresent
imagePullPolicy: Never
```

Production: **always pin by digest**:

```yaml
image: nginx@sha256:abc123...
```

## Private registry

```yaml
spec:
  imagePullSecrets:
    - name: regcred
```

```bash
kubectl create secret docker-registry regcred \
  --docker-server=... --docker-username=... --docker-password=...
```

## cosign — signing images

[Sigstore cosign](https://docs.sigstore.dev/cosign/overview/):

```bash
# Sign:
cosign sign myregistry.io/myapp:1.0

# Verify:
cosign verify myregistry.io/myapp:1.0
```

In the cluster — **Kyverno** or **policy-controller** require a valid signature before admitting.

## Vulnerability scanning

- `trivy image nginx:1.27`
- In CI: block merge on CRITICAL CVE

## CKS checklist

- Why a digest instead of a tag?
- What does cosign do?
- Why imagePullSecrets?

Lab: [22-lab-image-security.md](22-lab-image-security.md).
