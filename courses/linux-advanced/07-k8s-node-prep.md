# 07. Подготовка worker-ноды Kubernetes

## Введение: «kubeadm join прошёл, pod Pending — нода NotReady»

Частая история: VM подготовили «как обычный сервер», join в кластер успешен, но **Calico/Flannel не стартует**, kubelet **NotReady**, pod'ы не schedule. Причины на уровне Linux: **swap включён**, нет **br_netfilter**, **ip_forward=0**, firewall режет **10250**, неверный **containerd** для CRI.

Эта глава — чеклист **Linux-предпосылок** worker/control plane до `kubeadm` / managed node group.

## Что вы узнаете

- Отключение **swap** и почему kubelet это требует.
- Модули **br_netfilter**, **overlay**.
- **sysctl** для bridge и forwarding.
- Порты и firewall.
- **containerd** + CRI.
- Скрипт [verify-node.sh](examples/verify-node.sh).

---

## Чеклист ноды

| # | Действие | Критичность |
|---|----------|-------------|
| 1 | Отключить **swap** | обязательно (default kubelet) |
| 2 | `modprobe br_netfilter`, `overlay` | для сети pod |
| 3 | **sysctl** bridge-nf, ip_forward | для iptables/ipvs CNI |
| 4 | **chrony**/NTP | сертификаты, etcd |
| 5 | Hostname, DNS, `/etc/hosts` | join, TLS |
| 6 | **containerd** + default CRI socket | kubelet → runtime |
| 7 | kubelet, kubeadm join / cloud init | после пунктов 1–6 |

---

## Swap

Kubelet по умолчанию **отказывается** стартовать с включённым swap (или требует явной настройки — не для prod).

```bash
swapon --show
sudo swapoff -a
sudo sed -i '/ swap / s/^\([^#]\)/#\1/' /etc/fstab
```

**Почему:** предсказуемость memory cgroup; иначе память «уезжает» в swap, OOM behavior непрозрачен.

---

## Модули ядра

```bash
sudo modprobe overlay
sudo modprobe br_netfilter
lsmod | grep -E 'overlay|br_netfilter'
```

Persist:

```bash
echo -e 'overlay\nbr_netfilter' | sudo tee /etc/modules-load.d/k8s.conf
```

---

## sysctl

```bash
cat <<'EOF' | sudo tee /etc/sysctl.d/99-kubernetes.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
sudo sysctl --system
```

| Параметр | Зачем |
|----------|--------|
| bridge-nf-call-iptables | iptables видит трафик bridge (многие CNI) |
| ip_forward | маршрутизация pod ↔ service ↔ внешний мир |

Проверка:

```bash
sysctl net.bridge.bridge-nf-call-iptables net.ipv4.ip_forward
```

---

## Порты (ориентир)

| Роль | Порты |
|------|--------|
| control plane | 6443 API, 2379-2380 etcd, 10250 kubelet, … |
| worker | **10250** kubelet, NodePort 30000-32767, CNI (VXGene 4789, BGP 179…) |

**ufw** на ноде: разрешить от **master** и **pod CIDR** — иначе NotReady.

---

## containerd для kubelet

```bash
sudo apt install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
# SystemdCgroup = true — для cgroup driver systemd (проверьте документацию вашей версии k8s)
sudo systemctl enable --now containerd
```

Kubelet `cgroupDriver: systemd` должен совпадать с runtime.

---

## verify-node.sh

В репозитории:

```bash
bash courses/linux-advanced/examples/verify-node.sh
```

Расширяйте скрипт под ваш стандарт (swap, modules, sysctl, chrony, containerd active).

---

## Связь

- [`INSTALL.md`](../../INSTALL.md)
- [`mockctl up`](../../mockctl/README.md)
- [linux-intermediate: firewall](../linux-intermediate/07-firewall.md)

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| NotReady | CNI, swap, kubelet |
| pod network не работает | bridge-nf, fw |
| ImagePullBackOff | registry, не swap |
| join OK, no routes | ip_forward |

---

## В продакшене

Managed EKS/GKE/AKS частично скрывают join, но **AMI/image** должны соответствовать требованиям. Для bare metal — Ansible role «k8s node prep» + verify перед join.

---

## Резюме

Worker-нода = обычный Linux + **swap off** + **modules** + **sysctl** + **CRI** + сеть/firewall. Проверяйте [verify-node.sh](examples/verify-node.sh) до kubeadm.

## Чек-лист

- [ ] Зачем отключать swap?
- [ ] Что делает bridge-nf-call-iptables?
- [ ] Где persist sysctl?
- [ ] Какой socket CRI у containerd?

Следующий урок: [08. Лаба: verify-node](08-lab-node-prep.md).
