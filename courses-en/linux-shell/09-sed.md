# 09. sed — the stream editor

## Intro: sed -i on prod without a backup

You replaced `image: old` with `image: new` in a YAML with a single command, without a diff in the MR — a typo in the pattern touched **ten** lines. **sed** is powerful, but it requires discipline: a copy of the file, a diff check, and in CI — output to a new file.

**sed** processes a stream **line by line** — handy for configs and logs on servers without Python.

## What you'll learn

- The **`s///`** command and the flags **`g`**, **`i`**.
- **`-i.bak`**, safe in-place.
- Deleting lines, printing a range with **`-n`**.
- Multiple expressions with **`-e`**.
- **`-E`** and groups. BSD vs GNU limitations.

---

## Form

```text
sed [options] 'command' file
sed -f script.sed file
```

---

## Substitution s///

```bash
sed 's/old/new/' file           # the first replacement in the line
sed 's/old/new/g' file          # all in the line
sed 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' file
```

A different delimiter (if paths contain `/`):

```bash
sed 's|/var/www|/var/www/v2|g' file
```

---

## In-place

```bash
sed -i 's/debug/info/' app.conf
sed -i.bak 's/debug/info/' app.conf    # leaves app.conf.bak
```

In CI it's safer:

```bash
sed 's/pattern/replace/g' input > output
diff -u input output
mv output input
```

---

## Deletion and selection

```bash
sed '/^$/d' file                 # empty lines
sed '/^#/d' file                 # comments
sed -n '1,10p' file             # only lines 1–10
sed -n '/error/p' log.txt        # lines with error
```

---

## Multiple commands

```bash
sed -e 's/foo/bar/g' -e '/^$/d' file
sed 's/a/A/; s/b/B/' file
```

---

## Extended regex (-E)

```bash
echo "version=1.2.3" | sed -E 's/version=([0-9.]+)/version=\1-beta/'
```

---

## Common mistakes

| Problem | Solution |
|----------|---------|
| special characters in the pattern | escape `\.[]^$` |
| sed on a binary | don't do it |
| macOS BSD sed | `gsed` or a Linux runner in CI |
| `-i` without a backup | `-i.bak` |

---

## In production

Prefer **templates** (Ansible template, Helm) over ad-hoc sed on prod. sed — bootstrap, emergency fix, lab.

---

## Summary

**sed** — line replacements and filtering. **`s/old/new/g`**, **`-i.bak`**, **`-n '/pat/p'`**. Always look at the **diff** after a replacement.

## Checklist

- [ ] How does `s/a/b/` differ from `s/a/b/g`?
- [ ] Why `-i.bak`?
- [ ] How do you print only the lines with ERROR?

Next lesson: [10. Lab: sed](10-lab-sed.md).
