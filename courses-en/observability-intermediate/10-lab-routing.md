# 10. Lab: Alertmanager routing

## Goal

Extend `alertmanager.yml`: separate receivers by **severity** and **team**, verify grouping and inhibit in the UI.

## Setup

```bash
cd deploy/observability
docker compose up -d
```

UI: http://localhost:9093.

## Task 1. Labels in rules

In `config/rules/demo-alerts.yml` add label `team: demo` to both alerts. Reload Prometheus.

## Task 2. Routes

Replace/extend `config/alertmanager.yml`:

```yaml
route:
  receiver: default
  group_by: ["alertname", "severity", "team"]
  group_wait: 10s
  group_interval: 1m
  repeat_interval: 1h
  routes:
    - match:
        severity: critical
      receiver: critical-log
      continue: false
    - match:
        severity: warning
        team: demo
      receiver: warning-demo

receivers:
  - name: default
  - name: critical-log
    webhook_configs:
      - url: "https://httpbin.org/post"
        send_resolved: true
  - name: warning-demo
    webhook_configs:
      - url: "https://httpbin.org/post"
```

Restart AM:

```bash
docker compose restart alertmanager
```

*Local alternative:* `python -m http.server 9999` won’t accept POST — httpbin is handy for a training check that “the notification went out”.

## Task 3. Provoke critical

```bash
docker compose stop demo-app
sleep 90
```

In **Alertmanager → Alerts** — `DemoTargetDown` **Firing**. Don’t create a **Silence** until you’ve looked at grouping.

Check **Status** → which receiver fired for critical.

```bash
docker compose start demo-app
```

## Task 4. Inhibit

Add a temporary warning alert with the same `alertname` (for the experiment) or use the existing scenario:

1. Raise error rate (many 5xx is hard on demo — easier to **stop demo-app** = critical down).
2. Confirm a warning with a different name is **not** inhibited.

Extend inhibit (deliberately):

```yaml
inhibit_rules:
  - source_match:
      alertname: DemoTargetDown
    target_match_re:
      severity: warning
    equal: ["team"]
```

Stop demo-app again — neighboring warnings with `team: demo` should be **suppressed** in the UI (Inhibited).

## Task 5. Silence during maintenance

In the UI create a **Silence** on `alertname=DemoHighErrorRate` for 1h — explain in notes when silence is OK (maintenance) and when it’s dangerous.

## Expected result

| Check | Criterion |
|----------|----------|
| Routes | critical → `critical-log` |
| Grouping | One group per alertname+severity |
| Inhibit | Warning suppressed under TargetDown (after config) |
| Silence | Created and removed |

## Troubleshooting

| Symptom | Action |
|---------|----------|
| AM did not pick up config | `docker compose logs alertmanager` — YAML syntax |
| Alert not firing | `for:` in rule; wait |
| Webhook 403 | Replace URL with your own httpbin |

## Checklist

- [ ] `team` label in rules
- [ ] Two receivers in AM
- [ ] Inhibit verified in UI

**Next:** [11. Histograms and quantiles](11-histograms-quantiles.md).
