#!/usr/bin/env bash
set -euo pipefail

for i in 1 2 3; do
  name="pg-0${i}"
  ip="192.168.58.$((9+i))"
  lxc launch ubuntu:22.04 "$name" --profile pg
  lxc config device set "$name" eth0 ipv4.address="$ip"
  lxc config set "$name" limits.memory=2GiB
done
lxc restart pg-01 pg-02 pg-03

test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519

for name in pg-01 pg-02 pg-03; do
  lxc exec "$name" -- apt-get update
  lxc exec "$name" -- apt-get install -y openssh-server sudo
  lxc exec "$name" -- mkdir -p /home/ubuntu/.ssh
  lxc file push ~/.ssh/id_ed25519.pub "$name/home/ubuntu/.ssh/authorized_keys"
  lxc exec "$name" -- chown -R ubuntu:ubuntu /home/ubuntu/.ssh
  lxc exec "$name" -- chmod 700 /home/ubuntu/.ssh
  lxc exec "$name" -- chmod 600 /home/ubuntu/.ssh/authorized_keys
  lxc exec "$name" -- bash -lc 'echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu'
done

echo "SSH: ubuntu@192.168.58.10-12"
