# CKA 16 — No Internet egress

**Start** the lab, then complete the task. There is no walkthrough.

## Task

DNS may work. From a Pod, `curl https://example.com` does not.

Diagnose Pod → node → routing → forwarding → NAT → firewall.
Restore Internet egress for application Pods.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
