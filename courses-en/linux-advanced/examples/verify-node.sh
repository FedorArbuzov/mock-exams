#!/bin/bash
set -euo pipefail
echo "== swap =="
swapon --show || echo "swap off OK"
echo "== bridges =="
sysctl net.bridge.bridge-nf-call-iptables 2>/dev/null || true
echo "== ssh =="
systemctl is-active ssh
echo "OK"
