# 22. Lab: cosign and digest pin

## Task 1. Pin by digest

```bash
docker pull nginx:1.27-alpine
DIGEST=$(docker inspect nginx:1.27-alpine --format='{{index .RepoDigests 0}}')
echo $DIGEST
```

```yaml
containers:
  - name: c
    image: nginx@sha256:....   # substitute the digest
```

```bash
kubectl apply -f pod.yaml
```

## Task 2. trivy scan (if installed)

```bash
trivy image nginx:1.27-alpine --severity HIGH,CRITICAL
```

## Task 3. cosign (optional)

```bash
# Install cosign: https://docs.sigstore.dev/cosign/installation/
cosign generate-key-pair
docker pull nginx:1.27-alpine
cosign sign --key cosign.key nginx:1.27-alpine
cosign verify --key cosign.pub nginx:1.27-alpine
```

## Task 4. Kyverno verifyImages (optional)

With Kyverno from [11-lab-validating-webhook.md](11-lab-validating-webhook.md) you can add a `verifyImages` policy — see the Kyverno documentation.

## Questions

1. Why is a digest more reliable than a tag?
2. What does cosign verify check?
