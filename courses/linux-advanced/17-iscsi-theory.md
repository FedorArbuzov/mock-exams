# 17. iSCSI и multipath (теория)

## Введение: «нужен диск на сервере, SAN даёт LUN»

В облаке вы кликаете «attach volume» — получаете `/dev/nvme1n1`. В датацентре **СХД** отдаёт **LUN** по сети **iSCSI** — на Linux появляется `/dev/sdb`, вы сами делаете **partition → mkfs → mount**.

Эта глава **теория** — в Docker-лабе нет SAN. Практика железа — [bare-metal](../bare-metal/README.md), LVM — [linux-basic/14-lvm](../linux-basic/14-lvm.md).

## Что вы узнаете

- **Блочное** (iSCSI) vs **файловое** (NFS).
- Target, Initiator, LUN.
- Команды **iscsiadm** (концепт).
- **multipath** для отказоустойчивых путей.

---

## NFS vs iSCSI

| | NFS | iSCSI |
|---|-----|-------|
| Протокол | файлы по сети | **SCSI** over TCP |
| На клиенте | mount каталога | **блочное** `/dev/sdX` |
| Файловая система | на **сервере** (export) | на **клиенте** (mkfs) |
| Типично | shared files, static | DB datafiles, VM disks |
| Порт | 2049 | **3260** TCP |

```mermaid
flowchart LR
  target[Storage Target LUN]
  tcp[TCP 3260]
  init[Linux Initiator]
  dev[/dev/sdb]
  fs[ext4/xfs mount]
  target --> tcp --> init --> dev --> fs
```

---

## Компоненты

| Термин | Роль |
|--------|------|
| **Target** | СХД «отдаёт» LUN |
| **Initiator** | сервер-потребитель (ваш Linux) |
| **LUN** | logical unit — виртуальный диск |
| **IQN** | имя initiator/target (iSCSI Qualified Name) |

---

## Linux initiator (концепт)

```bash
# пакеты: open-iscsi
sudo systemctl enable --now iscsid
sudo iscsiadm -m discovery -t sendtargets -p 10.0.0.5
sudo iscsiadm -m node --login
lsblk
sudo mkfs.ext4 /dev/sdb1
sudo mount /dev/sdb1 /mnt/data
```

**/etc/iscsi/** — persistent login после reboot.

---

## multipath (DM-Multipath)

Два физических пути к **одному** LUN (два switch, два HBA):

```bash
sudo multipath -ll
ls -l /dev/mapper/mpatha
```

Приложение монтирует **`/dev/mapper/...`**, не сырой `/dev/sdb` — failover при обрыве path.

| Без multipath | С multipath |
|---------------|-------------|
| path down → I/O error | переключение на второй path |

---

## Когда что выбирать

| Сценарий | Частый выбор |
|----------|--------------|
| Shared read-many files | NFS / object storage |
| PostgreSQL data dir | local SSD / iSCSI/FC block |
| K8s RWO volume | cloud disk / CSI iSCSI |
| Legacy VM farm | iSCSI LUN |

---

## Типичные ошибки

| Ошибка | Риск |
|--------|------|
| mkfs на LUN с данными | уничтожение |
| два initiator без cluster FS | corruption |
| монтировать /dev/sdb без multipath | path failover ломает FS |
| путать NFS export с LUN | неверная архитектура |

---

## В продакшене

Отдельная **storage VLAN**, CHAP auth, monitoring path state. Для K8s — CSI driver вместо ручного iscsiadm на каждой ноде.

---

## Резюме

**iSCSI** — блочный диск по сети; **ФС на initiator**. **multipath** — один logical device, несколько paths. В lab — только теория.

## Чек-лист

- [ ] Чем iSCSI LUN отличается от NFS export?
- [ ] Кто создаёт файловую систему?
- [ ] Зачем multipath?

Следующий урок: [18. Hooks для Ansible](18-ansible-hooks.md).
