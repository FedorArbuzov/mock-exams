# 08. Lab: secrets and permissions

**Stand:** [`deploy/linux`](../../deploy/linux/README.md).

## Task 1. A bad example

```bash
mkdir -p /tmp/secrets-bad
echo 'API_KEY=supersecret' > /tmp/secrets-bad/.env
chmod 644 /tmp/secrets-bad/.env
ls -la /tmp/secrets-bad/
```

Any user: `cat /tmp/secrets-bad/.env`

## Task 2. A correct example

```bash
sudo mkdir -p /etc/labapp
echo 'API_KEY=supersecret' | sudo tee /etc/labapp/.env
sudo chmod 600 /etc/labapp/.env
sudo chown root:root /etc/labapp/.env
ls -la /etc/labapp/
```

Check as course:

```bash
cat /etc/labapp/.env 2>&1 || echo "permission denied OK"
```

## Task 3. find world-readable

```bash
sudo find /etc -type f -perm -o+r 2>/dev/null | head -20
```

Not everything in the list is a vulnerability (many files are intentionally public), but the **suspicious** ones with passwords — yes.

## Task 4. mount /tmp (view)

```bash
findmnt /tmp
grep tmpfs /etc/fstab
```

## Task 5. .bash_history

```bash
grep -i password ~/.bash_history 2>/dev/null || echo "no history or clean"
```

Don't export secrets into history (`export HISTCONTROL` + avoid secrets on the CLI).

## Success criteria

- [ ] .env 600 is inaccessible to a regular user
- [ ] You understand 644 vs 600

Next lesson: [09. Mini-CA](09-pki-ca.md).
