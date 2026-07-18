# 03. BMC, IPMI и out-of-band управление

## Проблема

Сервер «завис», SSH не отвечает, kernel panic на экране в ЦОД далеко. Нужен канал **вне** рабочей ОС.

## BMC (Baseboard Management Controller)

Отдельный микроконтроллер на материнской плате:

- Включить/выключить/перезагрузить (**power cycle**).
- Консоль **KVM over IP** (как монитор+клавиатура в браузере).
- Virtual media — «вставить» ISO по сети для установки ОС.
- Температуры, вентиляторы, питание.
- Журнал аппаратных событий (SEL).

## Торговые названия

| Вендор | Имя |
|---|---|
| Dell | iDRAC |
| HPE | iLO |
| Supermicro | IPMI |
| Lenovo | XCC |

Все говорят с **IPMI** (Intelligent Platform Management Interface) или Redfish (современный REST API поверх BMC).

## Out-of-band сеть

```text
Production LAN (10G)     Management LAN (1G, отдельный VLAN)
      │                            │
   eth0, eth1                  BMC port
      │                            │
   Kubernetes                  Только админы
   приложения                  VPN / jump host
```

**Правила:**

- BMC **никогда** в публичный интернет.
- Отдельная подсеть, firewall, сильные пароли / certificates.
- Default password с завода — сменить до rack.

## Типичные задачи DevOps

| Задача | Через BMC |
|---|---|
| Установка ОС с ISO | virtual media |
| Recovery после сбоя диска | power off, замена диска, power on |
| BIOS setting (boot order) | KVM |
| Диагностика «не видит диск» | SEL logs |

## IPMI tooling (знать, не обязательно юзать daily)

```bash
ipmitool -H bmc.example -U admin chassis power reset
ipmitool sel list   # hardware event log
```

В облаке EC2 **нет** вашего BMC — есть только API instance stop/start (аналог power, но не полный).

## Чек-лист

- BMC vs ОС — в чём разница?
- Зачем отдельная management сеть?
- KVM over IP — зачем?
- Почему нельзя BMC в интернет?

Следующий урок: [04-rack-power-network.md](04-rack-power-network.md).
