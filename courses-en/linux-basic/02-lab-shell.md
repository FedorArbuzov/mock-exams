# 02. Lab: shell and redirection

In this lab you don't "memorize commands" — you **get used to looking at streams**: what went to a file, what stayed on screen, what the pipe filtered out. You will also debug a broken deploy: the log in stdout, the error in stderr, and the pipe empty because the first command failed.

## Environment

[`deploy/linux`](../../deploy/linux/README.md) — from the `deploy/linux` directory:

```bash
docker compose up -d
docker compose exec lab bash
```

From here on, all commands run **inside** the lab container unless stated otherwise.

---

## Task 1. PATH and command lookup

Understand where bash gets `systemctl` from and why a "random" binary in the current folder won't run without `./`.

```bash
echo $PATH
which bash
which systemctl
type cd
type ls
```

**What you'll see:** a long PATH string with the `:` separator; full paths to `bash` and `systemctl`; `cd` marked as a shell builtin, `ls` as a file in `/usr/bin`.

**If `which systemctl` is empty** — the lab image may not have the full systemd CLI from the host; it's enough to confirm that `which bash` finds `/bin/bash` or `/usr/bin/bash`.

---

## Task 2. Separate stdout and stderr

Deliberately create **two** files: successful output and errors.

```bash
cd /tmp
rm -f lab-out.txt lab-err.txt lab-out2.txt

ls /etc > lab-out.txt 2> lab-err.txt
wc -l lab-out.txt
cat lab-err.txt
```

`lab-err.txt` should be **empty** — you have access to `/etc`.

Now add a directory you don't have permissions for:

```bash
ls /root /etc > lab-out2.txt 2>> lab-err.txt
cat lab-err.txt
head -5 lab-out2.txt
```

**What you'll see:** in `lab-err.txt` — lines about `/root` (Permission denied); in `lab-out2.txt` — the start of the `/etc` listing, as if `ls` partially worked.

**Why this matters in prod:** a backup script writes the file list to stdout and "file is busy" to stderr; without `2>` you lose the errors in the common log.

---

## Task 3. Pipe and "empty" output

```bash
ss -tlnp 2>/dev/null | head -5
ss -tlnp 2>/dev/null | wc -l
```

**What you'll see:** a few listening-socket lines and a line count (depends on the services in the container).

If `ss` complains about permissions, `2>/dev/null` removes the noise; for deep port debugging you'll later need `sudo ss -tlnp`.

Try to break the pipe on purpose:

```bash
false | echo last=$?
echo "pipe status: ${PIPESTATUS[@]}"
```

**What you'll see:** `last=0`, because it wasn't the last command that failed — a classic trap in scripts without `set -o pipefail`.

---

## Task 4. Variables and glob

```bash
export LAB_ROLE=student
echo "Role: $LAB_ROLE"
unset LAB_ROLE
echo "After unset: [${LAB_ROLE:-empty}]"

echo "First logs:" /var/log/*.log 2>/dev/null | head -c 120
echo
```

**What you'll see:** variable substitution; after `unset` — the word `empty` from the `:-` syntax; a list of log names, or empty if the glob didn't match.

Don't use `export` for secrets in the learning environment — in prod, secrets come from vault/CI variables, not from bash history.

---

## Task 5. History

```bash
history | tail -8
```

Find the number of any command in the list and run `!N` (substitute your own number). Confirm the command repeated.

---

## Success criteria

- [ ] `lab-out.txt` and `lab-err.txt` created; the `/root` access error went only to err
- [ ] The pipe with `ss` and `head`/`wc` ran without crashing the shell
- [ ] The `LAB_ROLE` variable prints before `unset`, and after — the `empty` substitution
- [ ] You understand the difference between `>` and `2>`

## If something went wrong

| Symptom | Check |
|---------|----------|
| Files not in `/tmp` | Are you in lab? `pwd` |
| `lab-err.txt` not empty after the first ls | Look at the contents — possibly warnings, not fatal |
| `ss` not found | `apt update && apt install -y iproute2` (in lab with sudo) |

Next lesson: [03. Users and groups](03-users-groups.md).
