# 17. Lab: diagnostics by checklist

We simulate a mini-incident: "the service isn't responding" — go through the steps from lesson 17 without blindly restarting the container.

## Environment

lab; srv1 if needed.

---

## Task 1. Resource snapshot

```bash
uptime
free -h
df -h
df -i /
```

Write down the load, free RAM, and `/` usage.

---

## Task 2. nginx as the "test subject"

```bash
sudo apt install -y nginx
systemctl is-active nginx
ss -tlnp | grep ':80'
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

---

## Task 3. Break it and fix it

```bash
sudo nginx -t
echo 'invalid directive here;' | sudo tee -a /etc/nginx/nginx.conf
sudo systemctl restart nginx
systemctl status nginx --no-pager | head -15
journalctl -u nginx --no-pager -n 15
```

Roll back the last line (vim/sed) or:

```bash
sudo sed -i '$ d' /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl restart nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

**What you'll see:** failed → a log with a syntax error → after the rollback, 200 again.

---

## Task 4. Top processes

```bash
ps aux --sort=-%cpu | head -6
ps aux --sort=-%mem | head -6
```

---

## Task 5. Network to srv1

```bash
ping -c2 172.28.0.11
curl -s -o /dev/null -w "%{http_code}\n" --connect-timeout 2 http://172.28.0.11/ || echo "curl failed"
```

---

## Success criteria

- [ ] A uptime/df/free snapshot was collected
- [ ] nginx was intentionally broken and restored from the logs
- [ ] `nginx -t` was used before restart

Next lesson: [18. Final project](18-final-project.md).
