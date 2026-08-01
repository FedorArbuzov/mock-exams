# 09. Lab: Alertmanager — firing, silence, your own rule

## Lab goal

See the stack's **built-in** alerts in Prometheus and Alertmanager; trigger **DemoTargetDown**; add a rule from [`examples/alert-rule.yml`](examples/alert-rule.yml) (or LabHigh404Rate).

## Prerequisites

```bash
cd deploy/observability
docker compose up -d --build
```

Rules: `config/rules/demo-alerts.yml`. Alertmanager: [http://localhost:9093](http://localhost:9093).

---

## Task 1. Alerts in Prometheus

**Why:** Pending → Firing.

1. [http://localhost:9090/alerts](http://localhost:9090/alerts)
2. Find `DemoTargetDown`, `DemoHighErrorRate`.

**What you'll see:** the state **Inactive** (green) on a healthy stack.

---

## Task 2. Firing when demo-app is stopped

```bash
docker compose stop demo-app
```

Wait **> 1m** (`for: 1m` on `DemoTargetDown`).

1. Prometheus **Alerts** — `DemoTargetDown` → **Firing**
2. Alertmanager → **Alerts** — the same entry

**What you'll see:** the labels `severity=critical`, the annotation summary.

Recover:

```bash
docker compose start demo-app
```

After a couple of minutes — **Resolved**.

---

## Task 3. Error rate (optional)

Generate a lot of 404s:

```bash
for i in $(seq 1 500); do curl -sf http://localhost:8000/missing >/dev/null 2>&1 || true; done
bash scripts/traffic.sh
```

Check `DemoHighErrorRate` (the 5% **5xx** threshold — on the stack it's mostly 404s; the rule may stay Inactive). Discuss: for 404s you need a **separate** rule — see the example below.

---

## Task 4. Your own 404 rule

**Why:** to connect the theory with the example file.

Copy `LabHigh404Rate` from [`examples/alert-rule.yml`](examples/alert-rule.yml) into `deploy/observability/config/rules/lab-basic.yml` (a new file in the same folder).

Reload Prometheus:

```bash
docker compose restart prometheus
```

Or send SIGHUP if the lifecycle API is enabled.

Generate traffic:

```bash
bash scripts/traffic.sh
```

Wait **> 2m**. Check **Alerts**.

**What you'll see:** with a high enough 404 share — **Firing** `LabHigh404Rate`.

---

## Task 5. Silence in the Alertmanager UI

**Why:** planned maintenance without panic.

1. Alertmanager → **Silences → New**
2. Matchers: `alertname=DemoTargetDown`
3. Duration: 1h, Comment: `lab maintenance`

Repeat `stop demo-app` — the alert shouldn't bother the receiver (on the stack it's void anyway).

**Remove the silence** after the lab.

---

## Task 6. promtool (optional)

If `promtool` is installed:

```bash
promtool check rules deploy/observability/config/rules/demo-alerts.yml
```

**What you'll see:** `SUCCESS` or a list of syntax errors.

---

## Success criteria

- [ ] The rules are found in the Prometheus UI
- [ ] `DemoTargetDown` transitions to Firing when demo-app is stopped
- [ ] Alertmanager shows the same alert
- [ ] A 404 rule is added and verified (or it's explained why it's Inactive)
- [ ] A test silence is created and removed

## What to take to work

- Any new rule — **`promtool check rules`** + a test on the stack
- Reconcile `for` with the service's **recovery time**

Next lesson: [10. Golden signals](10-golden-signals.md).
