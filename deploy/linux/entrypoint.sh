#!/bin/bash
set -euo pipefail

HOSTNAME="${LAB_HOSTNAME:-linux-lab}"
echo "$HOSTNAME" > /etc/hostname
hostname "$HOSTNAME"

# SSH: allow password + pubkey for labs
sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config 2>/dev/null || true
grep -q '^PubkeyAuthentication' /etc/ssh/sshd_config || echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config

mkdir -p /run/sshd
chmod 755 /run/sshd

exec "$@"
