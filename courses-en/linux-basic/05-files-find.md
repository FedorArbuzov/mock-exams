# 05. find, locate, stat

## When to search with what

In prod you'll be asked: "find all logs older than 30 days", "who ate the inodes", "why is this file root:root". For **precise** conditions over a directory tree — **`find`**. For "where on the disk is nginx.conf anyway" — **`locate`** is faster (if the index is fresh). For a single file — **`stat`**: permissions, size, three timestamps.

## find — walking the tree with conditions

`find` walks the directories **itself**; this is not an index-based search. Slower on a huge `/`, but always up to date.

```bash
find /etc -name "*.conf" -type f 2>/dev/null | head
find /var/log -type f -mtime -1
find /home -user course -type f 2>/dev/null
find /var -size +100M -type f 2>/dev/null | head
```

| Predicate | Meaning |
|----------|----------|
| `-name 'pattern'` | name (shell glob) |
| `-iname 'pattern'` | case-insensitive |
| `-type f` / `-type d` | files only / directories only |
| `-mtime -N` | modified **less** than N×24 h ago |
| `-mtime +N` | modified **more** than N days ago |
| `-user NAME` | owner |
| `-size +10M` | larger than 10 megabytes |

`2>/dev/null` hides "Permission denied" when walking `/etc` without root — otherwise the output is swamped with errors.

### Actions: not just printing the path

```bash
find /tmp -name "lab-*.tmp" -mtime +0 -print
find /var/log -name "*.gz" -mtime +30 -delete    # careful in prod!
find /etc/nginx -name "*.conf" -exec ls -lh {} \;
find /srv -type f -name "*.log" -exec chmod 640 {} \;
```

`-exec cmd {} \;` runs **for each** match; `{}` is replaced by the path. The `+` variant batches the arguments (faster): `-exec ls -lh {} +`.

**Safety rule:** first run find **without** `-delete`, with `-print`, and verify the list.

## stat — metadata of a single object

```bash
stat /etc/passwd
stat -c '%a %U %G %n' /etc/passwd
stat -c '%s bytes %n' /var/log/syslog
```

Useful fields:

| Time | Meaning |
|-------|--------|
| Access (atime) | last read |
| Modify (mtime) | change of **content** |
| Change (ctime) | change of metadata (permissions, owner) |

When investigating "who touched the config", people look at mtime/ctime; atime is often disabled on modern systems (`relatime`).

## locate / plocate — index-based search

```bash
sudo apt install -y plocate
sudo updatedb
locate nginx.conf
locate -i readme.md | head
```

The index is refreshed by cron (usually once a day). A **new** file after a deploy may not be found until you run `sudo updatedb`.

| Task | Tool |
|--------|------------|
| "All .log > 1 GB in /var" | find |
| "Where is the postgres binary" | locate (after updatedb) |
| Permissions and inode of one path | stat |

## Relation to incidents

- Disk full: `find /var -xdev -type f -size +500M`
- Suspicious SUID: `find / -perm -4000 -type f 2>/dev/null`
- Files changed in the last hour: `find /etc -type f -mmin -60`

More on `du` and disks — [17](17-troubleshooting.md).

## Checklist

- How does `find` fundamentally differ from `locate`?
- What does `-mtime -1` mean?
- Why `-print` first, then `-delete`?
- What's the difference between mtime and ctime?

Next lesson: [05. Lab: find](05-lab-find.md).
