# Linux — Advanced

Продвинутый уровень: **namespaces/cgroups**, **container runtime**, подготовка **ноды Kubernetes**, **audit/hardening**, **keepalived**, **sysctl/limits**, **eBPF (обзор)**, runbooks и capstone.

**Предварительно:** [`linux-intermediate`](../linux-intermediate/README.md) — сеть, firewall, sudo, systemd, nginx.

**Локально:** [`deploy/linux`](../../deploy/linux/README.md). Для keepalived — overlay [`docker-compose.advanced.yml`](../../deploy/linux/docker-compose.advanced.yml).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка:

1. **Теория** (01, 03, 05…) — сценарий с работы, концепции, примеры на стенде, типичные ошибки, «в проде».
2. **Лаба** (02-lab, 04-lab…) — цель, подготовка, задания с «что увидите» / «если не работает», критерии успеха.
3. Выполняйте лабы с поднятым стендом: `cd deploy/linux && docker compose up -d`.

**Время:** ~50–70 минут на пару «теория + лаба»; [capstone](28-final-project.md) — **3–5 часов**.

**IP стенда:**

| Хост | IP |
|------|-----|
| lab | 172.28.0.10 |
| srv1 | 172.28.0.11 |
| srv2 | 172.28.0.12 |
| web | 172.28.0.20 |
| dns | 172.28.0.53 |
| VIP (keepalived lab) | 172.28.0.100 |

SSH: **course** / **course**.

## Программа по фазам

### Контейнеры на Linux (01–06)

| # | Урок |
|---|------|
| 01 | [namespaces](01-namespaces.md) |
| 02 | [Лаба: unshare](02-lab-unshare.md) |
| 03 | [cgroups v2](03-cgroups.md) |
| 04 | [Лаба: MemoryMax](04-lab-cgroups.md) |
| 05 | [containerd / CRI](05-containerd.md) |
| 06 | [Лаба: ctr](06-lab-ctr.md) |

### Kubernetes node (07–08)

| 07 | [Подготовка ноды K8s](07-k8s-node-prep.md) |
| 08 | [Лаба: verify-node.sh](08-lab-node-prep.md) |

### Security (09–14)

| 09–10 | auditd |
| 11–12 | hardening CIS-lite |
| 13–14 | fail2ban |

### HA и automation (15–18)

| 15–16 | keepalived VIP |
| 17 | iSCSI (теория) |
| 18 | Hooks для Ansible |

### Tuning и ops (19–24)

| 19–20 | sysctl, limits |
| 21–22 | eBPF intro |
| 23–24 | capacity, runbooks |

### Integration (25–28)

| 25–27 | docker socket, deploy user, интеграция |
| 28 | [Capstone](28-final-project.md) |

## Что должно получиться

- Объясняете, как контейнеры используют ядро Linux (namespaces + cgroups + runc).
- Применяете hardening, audit и fail2ban на srv1.
- Готовите чеклист worker-ноды под `mockctl up` / kubeadm.
- Пишете runbook и собираете production-like хост в capstone.

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [`kuber-basic`](../kuber-basic/README.md) | containerd, CRI, crictl |
| [`kuber-advanced`](../kuber-advanced/README.md) | security, node ops |
| [`bare-metal`](../bare-metal/README.md) | iSCSI, железо |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | deploy user, CI SSH |
