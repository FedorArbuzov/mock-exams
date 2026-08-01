# 15. tar, gzip, rsync

## Archives — not "compression for compression's sake"

**tar** packs a file tree into a single stream (preserving names, permissions, sometimes the owner). Compression is separate: **gzip**, **xz**. This is how you back up configs, move artifacts, and send things to S3 "as one file".

```bash
tar -cvf archive.tar /etc/nginx
tar -czvf archive.tar.gz /etc/nginx
tar -tzvf archive.tar.gz
tar -xzvf archive.tar.gz -C /tmp/restore/
```

| Flag | Meaning |
|------|----------|
| `-c` | create |
| `-x` | extract |
| `-t` | list contents |
| `-v` | verbose |
| `-f` | file name (required) |
| `-z` | gzip |
| `-J` | xz (compresses harder, slower) |

Exclusions:

```bash
tar -czvf backup.tar.gz --exclude='*.log' /var/www
```

**Careful:** `tar -czf backup.tar.gz /` from the root is a classic mistake; always specify the directories you need.

## gzip / xz on their own

```bash
gzip big.log           # → big.log.gz, the source is removed
zcat big.log.gz | head
```

## rsync — when cp and scp aren't enough

**rsync** transfers **changes** (delta), preserves permissions with `-a`, and can use SSH.

```bash
rsync -av /local/dir/ user@host:/remote/dir/
rsync -av --delete /src/ /dst/    # mirror: extras on dst will be deleted
rsync -avz -e ssh /data/ course@172.28.0.11:/backup/
```

| Flag | Effect |
|------|--------|
| `-a` | archive: recursion, permissions, times |
| `-v` | list of files |
| `-z` | compression during transfer |
| `--delete` | remove on the destination what isn't in the source |

**The trailing slash matters:**

- `src/` — the contents of the directory
- `src` — the whole directory as one level

`rsync --delete` on prod without `--dry-run` is a way to accidentally wipe a backup. First:

```bash
rsync -av --delete --dry-run /src/ /dst/
```

## What to choose

| Task | Tool |
|--------|------------|
| A one-off copy on the same disk | cp |
| Config backup + compression | tar.gz |
| Syncing servers | rsync over ssh |
| Cloud offsite | tar + upload (rclone, aws cli) |

## Checklist

- How does `tar -czf` differ from `tar -cf`?
- Why the trailing `/` in rsync?
- Why is `--delete` dangerous?

Next lesson: [15. Lab: rsync](15-lab-rsync.md).
