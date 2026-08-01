# 04. Audit logs

## Why

An audit log records who did **what** in the API: `user`, `verb`, `resource`, `responseStatus`. Needed for compliance and investigations.

## Policy (what to log)

A file on the control plane (in minikube — inside the node):

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: None
    users: [system:kube-proxy]
  - level: Metadata
    resources:
      - group: ""
        resources: ["events"]
  - level: RequestResponse
    resources:
      - group: ""
        resources: ["secrets", "configmaps"]
  - level: Metadata
    omitStages: [RequestReceived]
```

Levels: `None`, `Metadata`, `Request`, `RequestResponse`.

## Backend

```yaml
# In kube-apiserver flags:
--audit-log-path=/var/log/kubernetes/audit.log
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
```

## Viewing in minikube

```bash
minikube -p mock-exams ssh
sudo cat /var/log/kubernetes/audit/audit.log | tail -5 | jq .
```

Or via `kubectl get events` for simple cases (that's not audit, but a quick reference).

## Checklist

- Audit levels?
- Where is the policy configured?
- How does audit differ from `kubectl get events`?
