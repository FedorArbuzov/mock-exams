# 08. Lab: apt and dpkg

You'll install a couple of utilities, find out which package a binary belongs to, and practice a "broken" dpkg (a training scenario).

## Environment

`docker compose exec lab bash`

---

## Task 1. update and install

```bash
sudo apt update
apt search '^jq$'
sudo apt install -y jq tree
jq --version
tree --version
```

**What you'll see:** the versions of the installed packages.

---

## Task 2. dpkg -L and dpkg -S

```bash
dpkg -L jq | head
dpkg -S /usr/bin/jq
which jq
```

**What you'll see:** the list of the package's files and the reverse mapping path → package.

---

## Task 3. policy and version

```bash
apt policy jq
apt show jq | head -15
```

---

## Task 4. remove vs purge (for practice)

```bash
sudo apt install -y hello
dpkg -L hello | grep etc
sudo apt remove -y hello
sudo apt install -y hello
sudo apt purge -y hello
```

**What you'll see:** after `purge`, the hello package's configs disappear (if the package created any).

---

## Task 5. autoremove

```bash
sudo apt autoremove -y
```

---

## Success criteria

- [ ] `apt update` without errors
- [ ] `jq` and `tree` installed
- [ ] `dpkg -S` found the package for `/usr/bin/jq`

Next lesson: [09. Processes](09-processes.md).
