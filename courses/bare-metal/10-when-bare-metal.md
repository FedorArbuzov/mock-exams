# 10. Когда выбирать bare metal

## Матрица решений

| Требование | Cloud VM | Bare metal |
|---|---|---|
| Быстрый autoscale | ✅ | ❌ |
| Пиковая GPU/CPU без соседей | дорого | ✅ |
| Данные только on-prem | hybrid | ✅ |
| Managed DB/queue | ✅ | self-manage |
| CapEx vs OpEx | OpEx | CapEx/leasing |
| Команда 24/7 hardware | не нужна | нужна или vendor |

## Гибрид (типично в enterprise)

```text
On-prem bare metal: Kubernetes, Oracle, legacy
        │
        VPN / Direct Connect
        │
AWS/Azure: burst, ML training, DR, S3
```

## Anti-patterns

- «Поднимем свой ЦОД на 3 сервера в офисе» без охлаждения, UPS, backup link.
- Bare metal для **stateless** microservices без причины — сложнее, чем cloud.
- Игнорировать BMC security.

## Роль DevOps vs традиционный sysadmin

| Sysadmin | DevOps на metal |
|---|---|
| RAID, firmware, switch ports | то же + IaC, K8s, CI |
| Ручные тикеты | GitOps, Ansible, MAAS |
| Silo | платформенная команда |

Курс не заменяет RHCSA, но закрывает **разрыв** между cloud-native и железом.

## Итоговый чек-лист курса

- [ ] Объясняю bare metal vs VM vs cloud
- [ ] Знаю, зачем BMC и отдельная management сеть
- [ ] Понимаю PXE/Kickstart/cloud-init
- [ ] Могу прочитать схему RAID+LVM
- [ ] Знаю bonding/VLAN на хосте
- [ ] Понимаю drain при patch K8s node
- [ ] Знаю, зачем MetalLB и local storage

## Дальше

- Практика: [MAAS](https://maas.io/), homelab, Talos.
- Курсы репозитория: [`kuber-advanced`](../kuber-advanced/README.md), [`aws-advanced`](../aws-advanced/README.md).
- PDF всех курсов: `dist/courses.pdf` (если собран скриптом `scripts/build-courses-pdf.py`).

---

**Курс bare-metal завершён** (теория).
