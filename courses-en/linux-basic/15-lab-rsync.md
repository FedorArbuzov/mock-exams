# 15. Lab: tar and rsync on srv1

You'll copy a directory to the second container — like a mini config backup.

## Environment

lab + SSH access to **172.28.0.11** (course/course).

---

## Task 1. tar locally

```bash
sudo mkdir -p /tmp/backup-demo/etc-sample
echo "config v1" | sudo tee /tmp/backup-demo/etc-sample/app.conf
tar -czvf /tmp/backup-demo.tar.gz -C /tmp/backup-demo .
tar -tzvf /tmp/backup-demo.tar.gz
```

---

## Task 2. rsync over SSH

```bash
rsync -avz -e ssh /tmp/backup-demo/ course@172.28.0.11:/tmp/backup-from-lab/
ssh course@172.28.0.11 'ls -la /tmp/backup-from-lab/'
```

**What you'll see:** the same files on srv1.

---

## Task 3. dry-run with --delete

```bash
mkdir -p /tmp/rsync-src /tmp/rsync-dst
echo a > /tmp/rsync-src/a.txt
cp -a /tmp/rsync-src/. /tmp/rsync-dst/
echo b > /tmp/rsync-src/b.txt
rm /tmp/rsync-src/a.txt
rsync -av --delete --dry-run /tmp/rsync-src/ /tmp/rsync-dst/
```

Read the output: what **would have** been deleted/copied.

---

## Task 4. Cleanup

```bash
ssh course@172.28.0.11 'rm -rf /tmp/backup-from-lab'
rm -rf /tmp/backup-demo /tmp/backup-demo.tar.gz /tmp/rsync-src /tmp/rsync-dst
```

---

## Success criteria

- [ ] The archive was created and viewed via `-t`
- [ ] rsync to srv1 succeeded
- [ ] `--dry-run` showed the plan without changing dst

Next lesson: [16. SSH](16-ssh.md).
