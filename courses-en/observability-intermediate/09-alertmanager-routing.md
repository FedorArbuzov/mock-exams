# 09. Alertmanager: routing and noise suppression

## Why a separate Alertmanager

Prometheus **evaluates** rules and generates alerts; **Alertmanager** receives them, **deduplicates**, **groups**, **routes** to receivers (email, Slack, PagerDuty, webhook), and applies **inhibit rules**.

Without AM, a thousand pods mean a thousand emails. With AM — one notification “service demo degraded” with a nested list.

On the stand: Prometheus → `alertmanager:9093`, config `deploy/observability/config/alertmanager.yml`.

## Alert lifecycle

```text
Pending (for: not yet) → Firing → (resolve) → Resolved
```

- `for: 2m` in a rule — the alert becomes **firing** only if the condition holds for 2 minutes.
- `resolve_timeout` in AM — how long to wait before “closing” a group after the signal disappears.

## route: route tree

The root `route` sets defaults:

```yaml
route:
  receiver: default
  group_by: ["alertname", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match:
        severity: critical
      receiver: critical
```

| Parameter | Meaning |
|----------|--------|
| `group_by` | Grouping keys — one email per group |
| `group_wait` | Wait to collect similar alerts |
| `group_interval` | Pause between notifications for the same group |
| `repeat_interval` | Repeat if not resolved |
| `match` / `match_re` | Filter by labels |

Nested `routes` — more specific rules **higher** in the tree (first match wins).

## receivers

On the training stand, receivers are **empty** (alerts only visible in the AM UI). In production:

```yaml
receivers:
  - name: slack-ops
    slack_configs:
      - channel: "#alerts"
        send_resolved: true
```

For lab [10-lab-routing.md](10-lab-routing.md) we’ll add a **webhook** to `webhook.site` or a local `curl` listener.

## inhibit_rules

Suppress a “noisy child” when a “parent” alert is firing:

```yaml
inhibit_rules:
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: ["alertname"]
```

If **critical** `DemoTargetDown` is firing, a **warning** with the same `alertname` is not sent separately (simplified stand example).

Real scenarios:

- critical “cluster unreachable” inhibits all pod warnings;
- `equal: ["cluster", "namespace"]` — suppression scope.

## grouping: practical example

Three pods die → three `up==0` series. With `group_by: [alertname]` → **one** notification “DemoTargetDown” with three instances in the body.

## Labels and annotations

Prometheus rule:

```yaml
labels:
  severity: critical
  team: platform
annotations:
  summary: "..."
  runbook_url: "https://..."
```

AM routes on **labels**; humans read **annotations**.

## Related to SLOs

Burn-rate alerts — `severity: critical`, separate `pager` receiver. Informational “50% budget left” — `warning` → Slack.

## Existing stand alerts

`config/rules/demo-alerts.yml`:

- `DemoHighErrorRate` — warning, >5% 5xx;
- `DemoTargetDown` — critical, `up==0`.

## Checklist

- [ ] Explained `group_wait` vs `repeat_interval`.
- [ ] Know how `inhibit_rules` reduce noise.
- [ ] Understand the `routes` tree and `match`.

**Next:** [10. Lab: routing](10-lab-routing.md).
