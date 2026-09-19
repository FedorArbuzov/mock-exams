#!/usr/bin/env bash
# Run on node-01. Creates /data with few inodes and fills them. Bytes stay low.
set -euo pipefail

IMG=/var/tmp/nimbus-data.img
MNT=/data

if ! mountpoint -q "$MNT"; then
  sudo mkdir -p "$MNT"
  sudo dd if=/dev/zero of="$IMG" bs=1M count=64
  sudo mkfs.ext4 -F -N 2000 "$IMG"
  sudo mount -o loop "$IMG" "$MNT"
fi

# Empty files only — do not write payload or bytes fill first.
i=0
while [ "$(df -i "$MNT" | awk 'NR==2 { gsub(/%/,"",$5); print $5 }')" -lt 90 ]; do
  sudo mkdir -p "$MNT/d$i"
  sudo touch "$MNT/d$i"/f{1..200}
  i=$((i + 1))
  if [ "$i" -gt 50 ]; then
    echo "stopped: inode percent still below 90 — check mkfs -N" >&2
    break
  fi
done

df -h "$MNT"
df -i "$MNT"
