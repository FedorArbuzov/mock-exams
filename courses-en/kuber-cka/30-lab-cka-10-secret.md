# CKA 10 — Secret

**Start** the lab, then complete the task. There is no walkthrough.

## Task

In namespace `cka-10`:

- Create Secret `db-pass` with key `password=s3cret`.
- Create Pod `app` (image `nginx:1.27`) that uses that Secret
  (env or volume). The Pod must be Running.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
