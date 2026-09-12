# 07. Lab: enable auth and bind a role

## Goal

Enable Kubernetes auth, configure TokenReview, create role `checkout-app` for SA `checkout-app` in namespace `checkout`.

## Task 1. Namespace and ServiceAccount

```bash
kubectl create namespace checkout --dry-run=client -o yaml | kubectl apply -f -
kubectl -n checkout create serviceaccount checkout-app --dry-run=client -o yaml | kubectl apply -f -
```

## Task 2. Enable and configure auth

```bash
kubectl -n vault exec vault-0 -- vault auth enable kubernetes 2>/dev/null || true

kubectl -n vault exec vault-0 -- sh -c '
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  token_reviewer_jwt="$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  disable_iss_validation=true
'
```

## Task 3. Write the role

```bash
kubectl -n vault exec vault-0 -- vault write auth/kubernetes/role/checkout-app \
  bound_service_account_names=checkout-app \
  bound_service_account_namespaces=checkout \
  policies=checkout-app \
  ttl=1h \
  max_ttl=24h

kubectl -n vault exec vault-0 -- vault read auth/kubernetes/role/checkout-app
```

## Task 4. Manual login test (optional)

```bash
kubectl -n checkout run vault-login-test --rm -it --restart=Never \
  --serviceaccount=checkout-app \
  --image=curlimages/curl:8.7.1 -- \
  sh -c '
    JWT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
    curl -sS --request POST \
      --data "{\"role\":\"checkout-app\",\"jwt\":\"$JWT\"}" \
      http://vault.vault.svc:8200/v1/auth/kubernetes/login
  '
```

Expect JSON with `auth.client_token`. If it fails, copy the error for lesson 12.

## Success criteria

- [ ] SA `checkout-app` in `checkout`  
- [ ] Role readable in Vault  
- [ ] Interactive Check passes  

Next: [08. Agent Injector](08-agent-injector.md).
