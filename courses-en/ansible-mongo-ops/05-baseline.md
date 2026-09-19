# 05. Baseline next to mongod

`community.mongodb` already owns packages, `mongod.conf`, the keyfile, the unit. If `common` restarts `mongod` “to be safe,” you will drop elections on every apply.

`common`: chrony, sshd, `jq`/`htop`. No `replSetName`. No `bindIp`. No WiredTiger cache.

Clocks matter: replica-set heartbeats and election timeouts.

`mongodb_linux` may mention NTP. If it installs a second time source, you will fight chrony. Read that role; leave time to `common`.

Next: [06. Lab: `common`](06-lab-baseline.md).
