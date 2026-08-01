# 16. Lab: SSH keys and config

## Environment

`docker compose exec lab bash`

---

## Task 1. Key

```bash
test -f ~/.ssh/id_lab || ssh-keygen -t ed25519 -f ~/.ssh/id_lab -N "" -C "lab"
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_lab
```

---

## Task 2. copy-id to srv1

```bash
ssh-copy-id -i ~/.ssh/id_lab.pub course@172.28.0.11
ssh -i ~/.ssh/id_lab course@172.28.0.11 hostname
```

The course/course password — only on the first copy-id.

---

## Task 3. ~/.ssh/config

```bash
cat >> ~/.ssh/config <<'EOF'

Host srv1
    HostName 172.28.0.11
    User course
    IdentityFile ~/.ssh/id_lab
EOF
chmod 600 ~/.ssh/config
ssh srv1 'echo OK from config'
```

---

## Task 4. scp

```bash
echo lab-scp-test > /tmp/scp-demo.txt
scp /tmp/scp-demo.txt srv1:/tmp/
ssh srv1 'cat /tmp/scp-demo.txt'
```

---

## Task 5. Permissions (a training test)

```bash
cp ~/.ssh/id_lab ~/.ssh/id_lab.bak
chmod 644 ~/.ssh/id_lab
ssh -i ~/.ssh/id_lab srv1 true 2>&1 | head -3
mv ~/.ssh/id_lab.bak ~/.ssh/id_lab
chmod 600 ~/.ssh/id_lab
```

**What you'll see:** ssh will refuse to use a too-open key.

---

## Success criteria

- [ ] `ssh srv1` login without a password
- [ ] scp copied the file
- [ ] You understand why 600 on a private key

Next lesson: [17. Troubleshooting](17-troubleshooting.md).
