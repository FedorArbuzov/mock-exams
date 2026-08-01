# 10. Lab: your own systemd unit

You'll create a **oneshot** service that writes a line to a log — the seed of the `lab-app` from the final project.

## Environment

`docker compose exec lab bash`, sudo required.

---

## Task 1. Script

```bash
sudo tee /usr/local/bin/lab-hello.sh <<'EOF'
#!/bin/bash
echo "$(date -Is) lab-hello executed" >> /var/log/lab-hello.log
EOF
sudo chmod +x /usr/local/bin/lab-hello.sh
```

---

## Task 2. Unit file

```bash
sudo tee /etc/systemd/system/lab-hello.service <<'EOF'
[Unit]
Description=Lab hello oneshot
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/lab-hello.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
```

---

## Task 3. Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lab-hello.service
systemctl status lab-hello --no-pager
cat /var/log/lab-hello.log
```

**What you'll see:** `active (exited)` for a oneshot and a line with the date in the log.

---

## Task 4. Repeated run

```bash
sudo systemctl start lab-hello.service
tail -2 /var/log/lab-hello.log
```

---

## Task 5. journal

```bash
journalctl -u lab-hello --no-pager -n 10
```

---

## Cleanup (optional)

```bash
sudo systemctl disable --now lab-hello.service
sudo rm /etc/systemd/system/lab-hello.service /usr/local/bin/lab-hello.sh
sudo systemctl daemon-reload
```

---

## Success criteria

- [ ] The unit is in the active/exited state
- [ ] At least one line in `/var/log/lab-hello.log`
- [ ] No errors after `daemon-reload`

Next lesson: [11. journal](11-journald.md).
