# 05. Установка ОС: PXE, Kickstart, cloud-init

## Ручная установка

ISO → KVM → «Далее, Далее» — только для одного сервера. В ЦОД — **автоматизация**.

## PXE boot

```text
1. Сервер включается, BIOS → PXE (boot по сети)
2. DHCP выдаёт IP + адрес TFTP/HTTP сервера
3. Скачивается bootloader (iPXE)
4. Ядро + initrd + автоответы установщика
5. Диск размечается, пакеты ставятся, reboot
```

**PXE server** — отдельная инфраструктура (Foreman, MAAS, Cobbler, или вручную dnsmasq+tftp).

## Kickstart / Preseed / Autoinstall

**Kickstart** (RHEL/CentOS/Rocky): один файл ответов на вопросы Anaconda.

```text
lang en_US
keyboard us
timezone UTC
autopart --type=lvm
%packages
@^minimal
docker-ce
%end
```

**Preseed** — Debian/Ubuntu. **Autoinstall** — Ubuntu 20.04+ (cloud-init style YAML).

## cloud-init

Тот же механизм, что в **AWS EC2** при первом boot:

- hostname, users, ssh keys.
- `runcmd` — команды при старте.
- network config.

На bare metal cloud-init часто приходит из **metadata service** MAAS или из ISO config-drive.

| Среда | Источник metadata |
|---|---|
| AWS EC2 | `169.254.169.254` |
| MAAS | MAAS API |
| VMware | guestinfo |

## Immutable / image-based

Вместо установщика — заливка **готового образа** диска (Clonezilla, metal imaging) или **Talos**, **Flatcar** — ОС заточена под K8s, SSH минимален.

## DevOps роль

- Поддерживать **golden image** или Kickstart profile.
- Версионировать в Git (как Terraform).
- CI ([`gitlab-*`](../gitlab-intermediate/README.md)) — тест kickstart в VM.

## Чек-лист

- PXE — что загружает по сети?
- Kickstart vs cloud-init?
- Почему EC2 «сразу с SSH»?
- Golden image — плюс и минус?

Следующий урок: [06-storage-raid-lvm.md](06-storage-raid-lvm.md).
