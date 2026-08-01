# 18. Lab: NFS srv1 → lab

## Lab goal

Go through the full **NFS** cycle in practice: export a directory on **srv1**, mount it on **lab**, read/write from both sides, dissect typical errors, and do a correct **umount**. After the lab you won't confuse NFS with Samba, and you'll understand why "mount hangs" is more often the network or firewall than "the disk broke".

## Prerequisites

- [17. NFS](17-nfs.md) has been read.
- The stand is Up: srv1 `172.28.0.11`, lab `172.28.0.10`.
- On **srv1**: `nfs-kernel-server`, on **lab**: `nfs-common`.

```bash
# from the host
cd deploy/linux && docker compose up -d
ping -c1 172.28.0.11   # from lab
```

---

## Setup: installing packages

**On srv1:**

```bash
ssh course@172.28.0.11
sudo apt update
sudo apt install -y nfs-kernel-server
systemctl is-active nfs-server || systemctl is-active nfs-kernel-server
```

**On lab:**

```bash
docker compose exec lab bash
sudo apt update
sudo apt install -y nfs-common showmount
```

---

## Task 1. Directory and marker on the server

**Why:** to confirm that the data is on srv1's disk before the mount.

```bash
# on srv1
sudo mkdir -p /srv/nfs-share
echo "nfs marker $(date -Is)" | sudo tee /srv/nfs-share/marker.txt
ls -la /srv/nfs-share/
```

**What you'll see:** the file `marker.txt` with a timestamp.

---

## Task 2. Export in /etc/exports

**Why:** without an entry in exports the client gets *access denied*.

```bash
# on srv1
echo '/srv/nfs-share 172.28.0.0/24(rw,sync,no_subtree_check,no_root_squash)' | sudo tee /etc/exports
sudo exportfs -ra
sudo exportfs -v
```

**What you'll see:**

```text
/srv/nfs-share   172.28.0.0/24(sync,wdelay,hide,no_subtree_check,sec=sys,rw,...)
```

| If there's an error | Cause |
|-------------|---------|
| `exportfs: invalid option` | typo in the parentheses |
| empty `exportfs -v` | didn't run `-ra` after editing |

**Important:** `no_root_squash` — for the lab only. In prod — `root_squash`.

---

## Task 3. Checking the export from the client (before mount)

**On lab:**

```bash
showmount -e 172.28.0.11
```

**What you'll see:** the list of exports, including `/srv/nfs-share`.

**If RPC: Program not registered / timeout:**

```bash
ping -c2 172.28.0.11
# NFSv4: a single port 2049; for v3 you need rpcbind
```

On the lab stand, NFSv4 is usually enough.

---

## Task 4. Mounting

**On lab:**

```bash
sudo mkdir -p /mnt/nfs-share
sudo mount -t nfs 172.28.0.11:/srv/nfs-share /mnt/nfs-share
df -h /mnt/nfs-share
mount | grep nfs
```

**What you'll see:** a line in `df` with `172.28.0.11:/srv/nfs-share`.

**If mount.nfs: access denied:** the CIDR in exports doesn't include the lab IP (should be 172.28.0.10 within 172.28.0.0/24).

**If Connection timed out:** the firewall (ufw later) is blocking 2049; ping first.

---

## Task 5. Reading and writing from lab

```bash
cat /mnt/nfs-share/marker.txt
echo "written from lab at $(date -Is)" | sudo tee /mnt/nfs-share/from-lab.txt
ls -l /mnt/nfs-share/
```

**What you'll see:** the marker from srv1 and the new from-lab file.

---

## Task 6. Verifying on srv1

```bash
ssh course@172.28.0.11 'cat /srv/nfs-share/from-lab.txt'
ssh course@172.28.0.11 'ls -l /srv/nfs-share/'
```

**Why:** NFS is a shared FS; the file on the server = the same inode tree the client saw.

---

## Task 7. Permissions and uid (optional)

**Why:** a common pain point in prod — "Permission denied on NFS" from a uid mismatch.

```bash
ls -ln /mnt/nfs-share/   # numeric uid/gid
id
```

If you write as root on lab with `root_squash` — the write is rejected (in our lab it's `no_root_squash` — root can write).

---

## Task 8. umount

**On lab:**

```bash
sudo umount /mnt/nfs-share
df -h /mnt/nfs-share
```

**If target is busy:**

```bash
sudo lsof +D /mnt/nfs-share
cd /
sudo umount /mnt/nfs-share
```

---

## Cleanup (srv1, optional)

```bash
ssh course@172.28.0.11
sudo sed -i '/\/srv\/nfs-share/d' /etc/exports
sudo exportfs -ra
```

The `/srv/nfs-share` directory can be left as is.

---

## Success criteria

- [ ] `exportfs -v` on srv1 shows the export for 172.28.0.0/24
- [ ] `showmount -e` from lab sees the export
- [ ] mount on lab without errors
- [ ] the marker is readable, from-lab is visible on srv1
- [ ] umount completed

## What to take away

- First **exports + exportfs**, then mount.
- **showmount** and **ping** — before diagnosing "NFS is broken".
- **2049/tcp**, in prod — a separate storage network or VPN.
- **root_squash** in prod; **no_root_squash** — lab only.

Next lesson: [19. Postfix](19-postfix.md).
