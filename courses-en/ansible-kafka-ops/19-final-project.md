# 19. Final project: someone else can run the repo

## Story

A teammate with SSH to the three nodes and `confluent.platform` 7.9.2 installed should understand the README and run the tagged plays.

No new features. Wire what you wrote in this course.

## Requirements

| # | Criterion |
|---|-----------|
| 1 | `site.yml` applies `common` with tag `baseline` |
| 2 | `playbooks/topics.yml` — `shop.orders`, `shop.dead`, RF=3, `min.insync.replicas=2` |
| 3 | `playbooks/preflight.yml` + `playbooks/rolling-restart.yml` (`serial: 1`) |
| 4 | `playbooks/runbooks/{urp,disk-gc,gather,preferred-election}.yml` |
| 5 | `playbooks/audit.yml` green |
| 6 | README: two-tree rule, bootstrap, unit names, replace order, heap, `confluent_server_enabled: false` |
| 7 | `.gitignore` for `artifacts/`, `*.retry` |

## Verification

```bash
cd ~/nimbus-kafka
ansible all -m ping
ansible-playbook site.yml
ansible-playbook playbooks/topics.yml
ansible-playbook playbooks/audit.yml
bash scripts/verify.sh
```

Copy [`examples/scripts/verify.sh`](examples/scripts/verify.sh) into `~/nimbus-kafka/scripts/`.

### Rubric

- [ ] `--list-tags` maps to tickets
- [ ] You can say what Confluent Ansible owns vs `nimbus-kafka`
- [ ] Three brokers, URP empty, topics present

## Demo (5 min)

1. `ansible-inventory --graph`
2. `kafka-topics --describe --topic shop.orders`
3. `ansible-playbook playbooks/audit.yml`
4. One sentence: rolling restart ≠ restart all

## After this course

- [`kuber-kafka`](../kuber-kafka/README.md) — same RF/ISR ideas **inside** Kubernetes
- [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) — same ops-repo pattern for kube
- [`gitlab-cicd`](../gitlab-cicd/README.md) — lint / `--syntax-check` on this repo
