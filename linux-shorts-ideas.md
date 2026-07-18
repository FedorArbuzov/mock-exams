# Linux Shorts: Complete DevOps beginner course

Goal: turn shorts into a coherent course that takes a beginner from “why Linux?” to confident day-to-day ops on servers (before containers and Kubernetes).
Recommended length per video: **45–75 seconds** (target ~65–75 when the topic needs texture).

Shared CTA (end of every short — English publishing voice-over):
`Master Linux faster. Theory, hands-on labs, and interview questions - link in bio.`

Brand footer on video (series standard):
`exallenge.tech` — small, persistent, phone-safe. No QR code.

Module order = study order: why Linux → shell → files → users/permissions → text tools → packages → processes → systemd → cron → disks → SSH → networking → firewall/TLS → logs/troubleshoot → bash for ops → hardening → containers bridge → career.

Aligned with repo courses: `courses/linux-basic`, `linux-intermediate`, `linux-shell`, `linux-security`, then `containers-basic` / Kubernetes shorts.

Pipeline guide (when ready): `linux-shorts-pipeline-prompt.md` — until then follow the same channel standards as `golang-shorts-pipeline-prompt.md` / `kubernetes-shorts-pipeline-prompt.md` (TopicBanner, ~70s scripts, large on-screen commands, shared Remotion project).

---

## Module 0. Why Linux and how to think like ops (1–12)

Format for every item in this and the following modules:
- **Hook:** a short beginner question/pain for the lesson topic.
- **Core:** a simple explanation + 1 practical anchor (command/rule/checklist).
- **CTA:** shared line above (do not invent a different CTA).

1. What is Linux in 30 seconds  
   - **Hook:** "Is Linux just another operating system?"
   - **Core:** Linux is the kernel + userland that runs most servers, containers, and cloud VMs — learn it once, reuse everywhere.
2. Why DevOps lives on Linux  
   - **Hook:** "Can I do DevOps only on Windows/Mac?"
   - **Core:** Prod is almost always Linux; local Mac/Windows is fine, but the mental model and commands must match the server.
3. Distro landscape: Ubuntu, Debian, RHEL, Alpine  
   - **Hook:** "Which distro should I learn first?"
   - **Core:** Start with one family (Ubuntu/Debian or RHEL); concepts transfer — packages and paths differ slightly.
4. Kernel vs userspace  
   - **Hook:** "What is 'the kernel' in plain words?"
   - **Core:** Kernel talks to hardware; your shells, nginx, and Docker run in userspace and ask the kernel for help.
5. Everything is a file (mental model)  
   - **Hook:** "Why do people say everything is a file?"
   - **Core:** Devices, sockets, and configs often appear as paths under `/` — `ls`, `cat`, and permissions apply broadly.
6. Root is power and danger  
   - **Hook:** "Should I always work as root?"
   - **Core:** Root can break the box; use a normal user + `sudo` for privileged tasks.
7. Server vs laptop mindset  
   - **Hook:** "Why does my laptop Linux feel different from prod?"
   - **Core:** Servers are headless, long-lived, and automated — prefer SSH, systemd, logs, and idempotent scripts over GUI clicks.
8. When a VM is enough (before Kubernetes)  
   - **Hook:** "Do I need Kubernetes on day one?"
   - **Core:** One service on a VM with systemd is a valid start; orchestrators pay off when services and teams grow.
9. Read the man page habit  
   - **Hook:** "Where do I learn flags without random blogs?"
   - **Core:** `man`, `command --help`, and `tldr`-style notes beat copy-paste Stack Overflow.
10. Exit codes matter  
   - **Hook:** "Why did my script say success when it failed?"
   - **Core:** `0` means success; non-zero means failure — CI and automation depend on this.
11. Myth: “Linux is only for geniuses”  
   - **Hook:** "Do I need to memorize every command?"
   - **Core:** You need a small toolkit and a diagnostic order — not encyclopedic recall.
12. Roadmap: what “junior Linux for DevOps” means  
   - **Hook:** "What skills get me unblocked on a server?"
   - **Core:** Shell, files, permissions, processes, systemd, disks, SSH, basic network, and reading logs.

---

## Module 1. Shell survival kit (13–28)

13. Terminal vs shell  
   - **Hook:** "Are terminal and bash the same thing?"
   - **Core:** Terminal is the window; shell (`bash`/`zsh`) interprets commands.
14. Prompt, PATH, and finding commands  
   - **Hook:** "Command not found — now what?"
   - **Core:** `which`/`type` and `$PATH` show where binaries are searched.
15. `pwd`, `ls`, `cd` without fear  
   - **Hook:** "How do I not get lost in directories?"
   - **Core:** Know absolute vs relative paths; `pwd` and `ls -la` are your compass.
16. Tab completion and history  
   - **Hook:** "How do pros type so fast?"
   - **Core:** Tab-complete paths; `history` and Ctrl-R recover past commands.
17. Absolute vs relative paths  
   - **Hook:** "Why did my script break in cron?"
   - **Core:** Cron often has a different cwd — prefer absolute paths in automation.
18. Home directory and `~`  
   - **Hook:** "Where should my configs live?"
   - **Core:** `~` is your home; system services use `/etc` and `/var`.
19. Redirection: `>`, `>>`, `2>`  
   - **Hook:** "How do I save command output?"
   - **Core:** stdout/stderr redirection; `>` overwrites, `>>` appends, `2>` catches errors.
20. Pipes: `|` connects tools  
   - **Hook:** "Why pipe into grep?"
   - **Core:** Small tools compose — filter and transform streams instead of giant one-off programs.
21. `less` and reading long output  
   - **Hook:** "Output scrolled off the screen!"
   - **Core:** Pipe to `less`; search inside with `/`.
22. Environment variables basics  
   - **Hook:** "Where do `PATH` and `HOME` come from?"
   - **Core:** `echo $VAR`, `export`, and shell startup files control the environment.
23. `echo`, `printf`, and quoting  
   - **Hook:** "Why did spaces break my command?"
   - **Core:** Quote strings; know the difference between `"$VAR"` and bare `$VAR`.
24. Globs: `*`, `?`, `[]`  
   - **Hook:** "How do I match many files at once?"
   - **Core:** Shell expands globs before the command runs — careful with `rm`.
25. `Ctrl-C`, `Ctrl-Z`, and foreground jobs  
   - **Hook:** "How do I stop a runaway command?"
   - **Core:** Interrupt with Ctrl-C; job control is separate from killing processes by PID.
26. Copy/paste and line editing  
   - **Hook:** "I keep mistyping long commands."
   - **Core:** Edit with arrows/Ctrl-A/Ctrl-E; don't retype entire lines.
27. Running commands as another user (`sudo`)  
   - **Hook:** "Permission denied — what next?"
   - **Core:** `sudo` elevates one command; understand who is allowed in `sudoers`.
28. Mini checklist: first hour in a shell  
   - **Hook:** "What should I be able to do tonight?"
   - **Core:** Navigate, list hidden files, redirect, pipe, use `sudo` safely, find a binary on `PATH`.

---

## Module 2. Filesystem and FHS (29–42)

29. Filesystem Hierarchy Standard (FHS) map  
   - **Hook:** "Where does stuff live on Linux?"
   - **Core:** `/etc` configs, `/var` variable data, `/usr` programs, `/home` users, `/tmp` temporary.
30. `/etc` is configuration  
   - **Hook:** "Where do I change service settings?"
   - **Core:** Prefer `/etc` over editing binaries; back up before changing.
31. `/var/log` is where truth hides  
   - **Hook:** "Where are the logs?"
   - **Core:** Many services log under `/var/log`; also check journald.
32. `/tmp` and `/var/tmp`  
   - **Hook:** "Can I store important data in /tmp?"
   - **Core:** Temporary — cleaned on reboot or by policy; not for durable state.
33. Symlinks vs hard links  
   - **Hook:** "What does that arrow in `ls -l` mean?"
   - **Core:** Symlinks point to paths; broken links are a common deploy bug.
34. `cp`, `mv`, `rm` safely  
   - **Hook:** "How do I not delete prod?"
   - **Core:** Prefer `rm -i` habits; never `rm -rf /`; double-check globs.
35. `mkdir -p` and nested dirs  
   - **Hook:** "Why create parent directories by hand?"
   - **Core:** `mkdir -p` makes the whole path — great for scripts.
36. `touch` and file timestamps  
   - **Hook:** "What does touch actually do?"
   - **Core:** Creates empty files or updates mtime — useful in build/deploy tricks.
37. Disk space: `df` and `du`  
   - **Hook:** "No space left on device — where?"
   - **Core:** `df -h` for filesystems; `du -sh *` to find fat directories.
38. Inodes can fill too  
   - **Hook:** "df shows free space but writes fail?"
   - **Core:** Check inode usage (`df -i`) — millions of tiny files can exhaust inodes.
39. File types: `-`, `d`, `l`, `c`, `b`  
   - **Hook:** "What is the first character in `ls -l`?"
   - **Core:** Regular file, directory, symlink, device nodes — different tools apply.
40. Hidden files start with `.`  
   - **Hook:** "Where did my `.env` go?"
   - **Core:** `ls -a` shows dotfiles; they are normal files with a naming convention.
41. Editing files: nano vs vim survival  
   - **Hook:** "Stuck in vim — how do I exit?"
   - **Core:** Learn exit (`:q!`) and basic save; nano is fine for beginners; vim pays off later.
42. Mini checklist: find anything on disk  
   - **Hook:** "Server is full or missing a file — first moves?"
   - **Core:** `df -h`, `du -sh`, `ls -la`, follow symlinks, check `/var` and `/tmp`.

---

## Module 3. Users, groups, permissions (43–58)

43. Users and UIDs  
   - **Hook:** "What is a UID?"
   - **Core:** Kernel authorizes by numeric ID; names are a convenience in `/etc/passwd`.
44. Groups and `/etc/group`  
   - **Hook:** "Why put people in groups?"
   - **Core:** Share access by group instead of world-writable files.
45. `id`, `whoami`, `groups`  
   - **Hook:** "Who am I on this box?"
   - **Core:** Verify effective user/groups before blaming permissions.
46. Permission bits: rwx for u/g/o  
   - **Hook:** "What does 755 mean?"
   - **Core:** Owner/group/other read-write-execute; directories need execute to enter.
47. `chmod` numeric and symbolic  
   - **Hook:** "chmod 777 fixed it — is that OK?"
   - **Core:** Prefer least privilege; `chmod u+x` beats world-writable panic fixes.
48. `chown` and `chgrp`  
   - **Hook:** "Service can't write its data dir."
   - **Core:** Match owner/group to the service user; recursive `chown` carefully.
49. Directory execute bit  
   - **Hook:** "I can read the file but not `cd` into the folder?"
   - **Core:** Entering a directory requires execute on that directory.
50. Sticky bit on `/tmp`  
   - **Hook:** "Why can't I delete someone else's file in /tmp?"
   - **Core:** Sticky bit (`chmod +t`) restricts deletes to owners — security feature.
51. SUID/SGID basics (careful)  
   - **Hook:** "Why does this binary run as root?"
   - **Core:** SUID elevates; rare and audited — don't sprinkle it casually.
52. umask: default permissions  
   - **Hook:** "Why are new files 644?"
   - **Core:** umask subtracts permissions from defaults — matters for shared deploy users.
53. `/etc/passwd`, `/etc/shadow`  
   - **Hook:** "Where are passwords stored?"
   - **Core:** Passwords (hashes) live in shadow; passwd is public account metadata.
54. Creating users the safe way  
   - **Hook:** "How do I add a deploy user?"
   - **Core:** `useradd`/`adduser` with home, shell, and groups — document the purpose.
55. Locking and disabling accounts  
   - **Hook:** "Someone left — how do I cut access?"
   - **Core:** Lock password, remove SSH keys, disable shell — don't leave dormant accounts.
56. sudoers mental model  
   - **Hook:** "Why sudo asks for a password?"
   - **Core:** Policy in sudoers grants specific commands; prefer least privilege over NOPASSWD ALL.
57. Root login vs sudo culture  
   - **Hook:** "Should SSH allow root login?"
   - **Core:** Prefer key-based user login + sudo; disable root SSH when you can.
58. Mini checklist: permission denied  
   - **Hook:** "Permission denied — what do I check?"
   - **Core:** `ls -la`, `id`, directory execute bits, ownership, SELinux/AppArmor later if needed.

---

## Module 4. Find text and files (59–72)

59. `find` by name  
   - **Hook:** "Where is that config file?"
   - **Core:** `find /path -name '*.conf'` — start narrow to avoid scanning the world.
60. `find` by time and size  
   - **Hook:** "Which files ate the disk yesterday?"
   - **Core:** `-mtime`, `-size` locate recent or huge files fast.
61. `find` -exec carefully  
   - **Hook:** "Can find delete for me?"
   - **Core:** `-exec` is powerful; dry-run with `-print` first — especially before `-delete`.
62. `grep` basics  
   - **Hook:** "How do I search inside files?"
   - **Core:** `grep -R pattern dir` with exclusions for huge trees.
63. `grep -i`, `-n`, `-v`  
   - **Hook:** "I need line numbers and invert match."
   - **Core:** Case-insensitive, show lines, invert — daily debugging tools.
64. ripgrep / smarter search (optional)  
   - **Hook:** "grep is slow on big repos."
   - **Core:** `rg` respects ignores and is faster — great on codebases.
65. `head`, `tail`, `tail -f`  
   - **Hook:** "How do I watch a log live?"
   - **Core:** `tail -f` follows; `head`/`tail` sample huge files safely.
66. `wc`, `sort`, `uniq`  
   - **Hook:** "How many unique errors?"
   - **Core:** Count and dedupe streams — classic ops one-liners.
67. `cut`, `tr`, simple parsing  
   - **Hook:** "I just need column two."
   - **Core:** Split fields without jumping to Python for tiny tasks.
68. `awk` one-liners you'll actually use  
   - **Hook:** "Is awk only for wizards?"
   - **Core:** Print fields, filter rows — enough for many log reports.
69. `sed` for small edits  
   - **Hook:** "How do I replace a string in a file from a script?"
   - **Core:** Prefer explicit backups; know in-place flags differ by OS.
70. Diff and compare configs  
   - **Hook:** "What changed between these two files?"
   - **Core:** `diff -u` for readable patches; critical before/after deploys.
71. Checksums: `sha256sum`  
   - **Hook:** "Did this download get corrupted?"
   - **Core:** Verify integrity of artifacts and releases.
72. Mini checklist: "find the smoking gun in logs"  
   - **Hook:** "Incident — where do I start reading?"
   - **Core:** Time-box: recent logs → grep error → unique counts → correlate with deploy time.

---

## Module 5. Packages and software (73–84)

73. Package managers: apt vs dnf/yum  
   - **Hook:** "Why can't I use apt on every server?"
   - **Core:** Distro family dictates the tool — learn one deeply, know the other's verbs.
74. Install, remove, purge  
   - **Hook:** "Uninstall left config behind?"
   - **Core:** Remove vs purge; know what stays in `/etc`.
75. Update and upgrade safely  
   - **Hook:** "Should I apt upgrade on prod Friday night?"
   - **Core:** Patch deliberately; read changelogs for kernels and major services.
76. What provides this binary?  
   - **Hook:** "Which package owns `/usr/bin/foo`?"
   - **Core:** `dpkg -S` / `rpm -qf` maps files to packages.
77. Pinning and holding packages (concept)  
   - **Hook:** "CI broke after a silent upgrade."
   - **Core:** Holds/pins stabilize critical packages — use consciously.
78. Third-party repos: trust carefully  
   - **Hook:** "Vendor said add this repo…"
   - **Core:** Repos are root-level trust; prefer official or verified sources.
79. Building from source as last resort  
   - **Hook:** "Only a tarball exists — now what?"
   - **Core:** Prefer packages; source builds need deps, updates, and uninstall discipline.
80. Language toolchains on servers  
   - **Hook:** "Should prod have the full Go/Node toolchain?"
   - **Core:** Build in CI; ship artifacts — keep runtime images/servers lean.
81. Snap/flatpak awareness (brief)  
   - **Hook:** "Why is there yet another installer?"
   - **Core:** Know they exist; classic apt/dnf still dominate servers.
82. Container images vs host packages  
   - **Hook:** "If I use Docker, do I still need apt?"
   - **Core:** Host still needs kernel, container runtime, SSH; apps often move into images.
83. Inventory: what's installed  
   - **Hook:** "How do I list packages for an audit?"
   - **Core:** Export package lists for drift and compliance.
84. Mini checklist: install software the boring way  
   - **Hook:** "New dependency on a server — steps?"
   - **Core:** Prefer distro packages → document repo → pin if critical → verify service user and logs.

---

## Module 6. Processes and resources (85–100)

85. What is a process?  
   - **Hook:** "Is a process the same as a program?"
   - **Core:** A running instance with PID, memory, open files, and a parent.
86. `ps` and reading process lists  
   - **Hook:** "How do I see what's running?"
   - **Core:** `ps aux` / `ps -ef` — learn USER, PID, CPU, MEM, COMMAND columns.
87. `top` / `htop` live view  
   - **Hook:** "CPU is hot — who?"
   - **Core:** Sort by CPU/memory; don't reboot before looking.
88. Kill signals: TERM vs KILL  
   - **Hook:** "kill -9 always, right?"
   - **Core:** Prefer SIGTERM for graceful shutdown; SIGKILL is last resort.
89. Finding who holds a port  
   - **Hook:** "What is listening on 8080?"
   - **Core:** `ss -tlnp` (or `lsof -i`) ties ports to processes.
90. Open files and `lsof`  
   - **Hook:** "Too many open files?"
   - **Core:** Inspect limits and which process leaks FDs.
91. Load average in plain words  
   - **Hook:** "Load is 12 — am I doomed?"
   - **Core:** Context vs CPU count; high load can be IO wait, not just compute.
92. Memory: used, free, cache  
   - **Hook:** "free says almost no memory — panic?"
   - **Core:** Linux uses free RAM for cache; watch OOM and swap carefully.
93. OOM killer basics  
   - **Hook:** "Process vanished with no error?"
   - **Core:** Check dmesg/journal for out-of-memory kills.
94. Nice and priority (brief)  
   - **Hook:** "Can I deprioritize a batch job?"
   - **Core:** Nice values influence scheduling — useful for backups on busy hosts.
95. Background jobs `&` and `nohup`  
   - **Hook:** "SSH closed and my job died."
   - **Core:** Prefer systemd units over nohup hacks for real services.
96. Process trees: `pstree`  
   - **Hook:** "Which parent spawned this mess?"
   - **Core:** Trees show supervisors vs children — key with systemd and containers.
97. Ulmits overview  
   - **Hook:** "Got 'too many open files' in prod."
   - **Core:** Soft/hard limits per user/service — set deliberately for DBs and proxies.
98. CPU steal and noisy neighbors (cloud)  
   - **Hook:** "VM feels slow but top looks fine."
   - **Core:** Steal time and noisy neighbors are cloud realities — measure before resizing.
99. /proc is a live API  
   - **Hook:** "What is /proc?"
   - **Core:** Kernel exposes process and system state as files — `cat /proc/PID/...`.
100. Mini checklist: "box is slow"  
   - **Hook:** "First five minutes of a slow server?"
   - **Core:** `uptime`, `top`, `free -h`, `df -h`, `ss`/`ping`, then logs.

---

## Module 7. systemd and the journal (101–118)

101. Why systemd exists  
   - **Hook:** "What replaced init scripts?"
   - **Core:** systemd supervises services, dependencies, and logs in one model on modern distros.
102. Unit types: service, timer, mount  
   - **Hook:** "Is everything a .service?"
   - **Core:** Services, timers, sockets, mounts — different unit kinds.
103. `systemctl status`  
   - **Hook:** "Is my service actually running?"
   - **Core:** Status shows active state, main PID, and recent journal lines.
104. start, stop, restart, reload  
   - **Hook:** "restart vs reload?"
   - **Core:** Reload where supported (nginx); restart kills and replaces the process.
105. enable / disable on boot  
   - **Hook:** "Why did it die after reboot?"
   - **Core:** `enable` links the unit for boot; running now ≠ enabled.
106. Reading a unit file  
   - **Hook:** "Where is the service defined?"
   - **Core:** `/lib/systemd` vs `/etc/systemd/system` overrides — use drop-ins.
107. Writing a simple service unit  
   - **Hook:** "How do I run my binary on boot?"
   - **Core:** `ExecStart`, `User`, `Restart=`, then `daemon-reload`.
108. Restart policies  
   - **Hook:** "Should every service restart always?"
   - **Core:** `on-failure` vs `always` — avoid restart storms without backoff awareness.
109. Environment and EnvironmentFile  
   - **Hook:** "Where do service env vars go?"
   - **Core:** Prefer EnvironmentFile over hardcoding secrets in the unit.
110. journalctl basics  
   - **Hook:** "Where did stdout go?"
   - **Core:** `journalctl -u service -e` — the first log stop for systemd services.
111. journalctl by time  
   - **Hook:** "Show me logs since the deploy."
   - **Core:** `--since`, `--until` bound investigations.
112. Follow journal like tail -f  
   - **Hook:** "How do I stream service logs?"
   - **Core:** `journalctl -u name -f`.
113. Boot and previous boot logs  
   - **Hook:** "It crashed before I logged in."
   - **Core:** `journalctl -b -1` inspects the previous boot.
114. systemctl cat and show  
   - **Hook:** "What effective config am I running?"
   - **Core:** `systemctl cat` merges drop-ins; trust that over guessing.
115. Targets and runlevels (concept)  
   - **Hook:** "What is multi-user.target?"
   - **Core:** Targets group units; boot lands on a default target.
116. Timers vs cron  
   - **Hook:** "Should I still use cron?"
   - **Core:** systemd timers integrate with journal and dependencies; cron still common.
117. Debugging failed units  
   - **Hook:** "status says failed — next?"
   - **Core:** `status`, `journalctl -xeu`, check ExecStart path and permissions.
118. Mini checklist: healthy service  
   - **Hook:** "What green looks like?"
   - **Core:** enabled + active + clean journal + listening port + disk not full.

---

## Module 8. Cron and scheduling (119–126)

119. crontab format  
   - **Hook:** "What do those five fields mean?"
   - **Core:** minute hour dom month dow — then the command.
120. User crontab vs /etc/cron.*  
   - **Hook:** "Where should system jobs live?"
   - **Core:** Per-user crontabs vs system directories — document ownership.
121. Cron environment traps  
   - **Hook:** "Works in SSH, fails in cron."
   - **Core:** Minimal PATH and env — use absolute paths and explicit env.
122. Redirect cron output  
   - **Hook:** "Did my cron even run?"
   - **Core:** Log stdout/stderr to a file; don't discard blindly.
123. Avoid overlapping jobs  
   - **Hook:** "Two backups ran at once."
   - **Core:** Lockfiles/`flock` prevent pile-ups.
124. Timezones and UTC  
   - **Hook:** "Job ran at the wrong hour."
   - **Core:** Know system timezone; prefer UTC in distributed systems.
125. Anacron / non-24x7 machines (brief)  
   - **Hook:** "Laptop was off at midnight."
   - **Core:** Catch-up schedulers matter for occasionally powered hosts.
126. Mini checklist: reliable scheduled job  
   - **Hook:** "Ship a cron without drama?"
   - **Core:** Absolute paths, logs, lock, alert on non-zero exit, document owner.

---

## Module 9. Disks, mounts, LVM (127–142)

127. Block devices: `/dev/sd*`, nvme, virtio  
   - **Hook:** "Which disk is which?"
   - **Core:** List with `lsblk`; names can change — prefer UUIDs in fstab.
128. Partitions vs filesystems  
   - **Hook:** "I partitioned — why can't I write?"
   - **Core:** Partition → mkfs → mount; three separate steps.
129. `lsblk` and `blkid`  
   - **Hook:** "How do I see UUID and FS type?"
   - **Core:** blkid maps devices to UUIDs for stable mounts.
130. Mount and umount  
   - **Hook:** "How do I attach a disk temporarily?"
   - **Core:** `mount`/`umount`; busy mounts fail — find who uses them.
131. `/etc/fstab` persistence  
   - **Hook:** "Mount vanished after reboot."
   - **Core:** fstab entries (UUID-based) remount on boot — test carefully.
132. Mount options that matter  
   - **Hook:** "What is noexec, nosuid, nodev?"
   - **Core:** Hardening and behavior flags — especially on `/tmp`.
133. Read-only filesystem emergencies  
   - **Hook:** "Root became read-only?"
   - **Core:** Often filesystem errors — check dmesg and remount strategy.
134. LVM big picture  
   - **Hook:** "Why LVM instead of plain partitions?"
   - **Core:** Volumes you can grow — PV → VG → LV mental model.
135. Growing a filesystem (concept)  
   - **Hook:** "Disk full but we can expand the volume."
   - **Core:** Expand LV then grow FS — order matters; snapshot first when possible.
136. Swap: what it is and isn't  
   - **Hook:** "Should I disable swap always?"
   - **Core:** Swap prevents hard OOM sometimes; latency spikes — know your workload.
137. RAID awareness for ops  
   - **Hook:** "Is RAID a backup?"
   - **Core:** RAID is availability/performance — not a substitute for backups.
138. NFS mount basics  
   - **Hook:** "App data lives on a network share."
   - **Core:** Soft/hard mounts and permissions — latency and lock issues are real.
139. Backups: rsync mental model  
   - **Hook:** "How do I copy a tree efficiently?"
   - **Core:** `rsync -a` preserves metadata; dry-run before destructive syncs.
140. tar for archives  
   - **Hook:** "How do I ship a directory?"
   - **Core:** Create/extract tar.gz; watch absolute vs relative paths.
141. Disk failure symptoms  
   - **Hook:** "IO errors in dmesg — meaning?"
   - **Core:** Failing disks show retries/IO errors — migrate data, don't ignore.
142. Mini checklist: disk full incident  
   - **Hook:** "Writes failing — triage?"
   - **Core:** `df -h`, `df -i`, `du`, clear safe logs/tmp, check docker/container growth, expand if needed.

---

## Module 10. SSH like a professional (143–158)

143. SSH in one sentence  
   - **Hook:** "Why not Telnet?"
   - **Core:** Encrypted remote shell with keys and port forwarding superpowers.
144. Key pairs: private vs public  
   - **Hook:** "Which file do I put on the server?"
   - **Core:** Public key in `authorized_keys`; private key never leaves your control.
145. ssh-keygen basics  
   - **Hook:** "How do I make a key?"
   - **Core:** Ed25519 preferred; passphrase protects the private key at rest.
146. authorized_keys  
   - **Hook:** "Why is my key ignored?"
   - **Core:** Permissions on `.ssh` and `authorized_keys` must be strict.
147. ssh config host aliases  
   - **Hook:** "Tired of long user@host strings?"
   - **Core:** `~/.ssh/config` Host entries — readable and scriptable.
148. Agent forwarding caution  
   - **Hook:** "Should I always forward my agent?"
   - **Core:** Convenient and risky — prefer explicit keys per environment.
149. SCP and SFTP  
   - **Hook:** "How do I copy a file to the server?"
   - **Core:** `scp`/`sftp` or `rsync -e ssh` for real syncs.
150. SSH tunnels (local forward)  
   - **Hook:** "DB is private — how do I reach it?"
   - **Core:** Local port forward for break-glass access — not a permanent architecture.
151. Jump hosts / ProxyJump  
   - **Hook:** "Prod is only reachable via bastion."
   - **Core:** `ProxyJump` chains SSH safely through a bastion.
152. Disable password auth (goal)  
   - **Hook:** "Bots hammer SSH passwords."
   - **Core:** Keys only + Fail2ban/firewall; keep a break-glass plan.
153. sshd_config knobs that matter  
   - **Hook:** "Which settings harden SSH?"
   - **Core:** PermitRootLogin, PasswordAuthentication, AllowUsers — change with a live session open.
154. Known hosts and MITM warnings  
   - **Hook:** "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED"
   - **Core:** Could be rebuild or attack — verify out-of-band before deleting known_hosts lines.
155. Multiplexing and speed tips  
   - **Hook:** "SSH feels slow every time."
   - **Core:** ControlMaster multiplexing cuts handshake overhead for heavy users.
156. File transfer permissions traps  
   - **Hook:** "Uploaded script won't run."
   - **Core:** Mode bits and CRLF line endings break shell scripts from Windows.
157. SSH for automation (CI)  
   - **Hook:** "Pipeline needs to deploy over SSH."
   - **Core:** Dedicated deploy keys, limited sudo, audited commands — not your personal laptop key.
158. Mini checklist: can't SSH in  
   - **Hook:** "Connection refused / timed out / denied?"
   - **Core:** Network path → sshd running → security group/firewall → keys/permissions → auth logs.

---

## Module 11. Networking essentials (159–176)

159. IP address and interface  
   - **Hook:** "What is eth0 / ens18?"
   - **Core:** Interfaces own addresses; `ip addr` is the modern view.
160. `ip route` and default gateway  
   - **Hook:** "Why can't I reach the internet?"
   - **Core:** No default route or wrong gateway — check `ip route`.
161. DNS resolution path  
   - **Hook:** "Ping by name fails, by IP works."
   - **Core:** Resolver config (`resolv.conf`/systemd-resolved) is the suspect.
162. `/etc/hosts` overrides  
   - **Hook:** "How do I force a name to an IP?"
   - **Core:** hosts file wins for quick tests — don't forget to remove hacks.
163. ICMP and ping  
   - **Hook:** "Ping blocked — is the host down?"
   - **Core:** ICMP may be filtered; use TCP checks too.
164. TCP vs UDP for ops  
   - **Hook:** "Why does DNS use UDP?"
   - **Core:** Mental model: TCP sessions vs UDP datagrams — affects firewalls and debugging.
165. Listening vs established  
   - **Hook:** "ss shows many states — which matter?"
   - **Core:** LISTEN for services; ESTABLISHED for active clients.
166. `curl` as a debugger  
   - **Hook:** "Is the HTTP service up?"
   - **Core:** `curl -vI` headers and status codes beat guessing.
167. DNS tools: `dig` / `nslookup`  
   - **Hook:** "Who resolves this name?"
   - **Core:** Query A/AAAA/CNAME/MX explicitly; compare resolvers.
168. HTTP status codes you'll see  
   - **Hook:** "502 vs 503 vs 504?"
   - **Core:** Bad gateway, unavailable, timeout — point to different layers.
169. TLS handshake at a glance  
   - **Hook:** "HTTPS fails but HTTP works."
   - **Core:** Cert chain, SNI, time skew — `openssl s_client` helps.
170. Firewall mental model  
   - **Hook:** "Port open locally but closed outside?"
   - **Core:** Local listen ≠ cloud SG/firewall path — check every hop.
171. NAT and port forwarding (concept)  
   - **Hook:** "Why public IP ≠ private IP?"
   - **Core:** NAT rewrites addresses at the edge — common in cloud and home labs.
172. MTU and weird packet loss (brief)  
   - **Hook:** "Large requests hang, small ones work."
   - **Core:** MTU/MSS issues appear in VPNs and overlays — know the symptom.
173. tcpdump first capture  
   - **Hook:** "Need proof packets arrive?"
   - **Core:** Capture filtered traffic; don't flood disk — narrow BPF filters.
174. Time sync matters (NTP/chrony)  
   - **Hook:** "TLS and logs look crazy."
   - **Core:** Skewed clocks break auth and correlation — keep chrony healthy.
175. IPv6 awareness  
   - **Hook:** "Happy Eyeballs / odd dual-stack bugs."
   - **Core:** Services may listen on v6; disable or configure deliberately.
176. Mini checklist: "can't connect to service"  
   - **Hook:** "Connection failed — order of checks?"
   - **Core:** Local listen → firewall → route/DNS → app logs → capture if needed.

---

## Module 12. Firewall and TLS basics (177–188)

177. ufw / firewalld / iptables landscape  
   - **Hook:** "Which firewall tool is on this box?"
   - **Core:** Distros wrap netfilter differently — detect before changing.
178. Default deny inbound  
   - **Hook:** "What is a safe starting policy?"
   - **Core:** Deny inbound by default; allow SSH and required service ports only.
179. Allow SSH before you lock yourself out  
   - **Hook:** "I enabled the firewall and lost SSH."
   - **Core:** Always permit admin access first; keep a console/session open.
180. Ephemeral ports and stateful firewalls  
   - **Hook:** "Outbound works weirdly with strict rules."
   - **Core:** Stateful tracking allows established replies — understand the model.
181. Certificates are public; keys are private  
   - **Hook:** "Can I share the .crt?"
   - **Core:** Certs travel; private keys stay secret and permission-locked.
182. openssl s_client quick check  
   - **Hook:** "Is my cert serving the right chain?"
   - **Core:** Inspect peer cert and dates from the CLI.
183. Let's Encrypt mental model  
   - **Hook:** "How do free certs renew?"
   - **Core:** ACME challenges + timers — monitor expiry, don't assume forever.
184. TLS cipher nightmares (keep high-level)  
   - **Hook:** "Old clients can't connect."
   - **Core:** Protocol/cipher mismatch — prefer modern defaults, document exceptions.
185. HSTS and redirects (brief)  
   - **Hook:** "Browser forces HTTPS suddenly."
   - **Core:** HSTS caches HTTPS policy — careful in staging.
186. Internal CA vs public CA  
   - **Hook:** "Why doesn't the browser trust our corp cert?"
   - **Core:** Private CAs need trust distribution — browsers only trust public roots by default.
187. Secrets on disk permissions  
   - **Hook:** "Where do I put TLS keys?"
   - **Core:** Root-owned, mode 600, not in git — rotate when leaked.
188. Mini checklist: HTTPS looks broken  
   - **Hook:** "Users report certificate errors."
   - **Core:** Dates, chain, name/SAN, server time, intermediate missing.

---

## Module 13. Logs and troubleshooting playbooks (189–204)

189. Logging philosophy: stdout vs files vs journal  
   - **Hook:** "Where should my app log?"
   - **Core:** Under systemd, journal is natural; containers often use stdout — be consistent.
190. Log rotation  
   - **Hook:** "Logs filled the disk."
   - **Core:** logrotate/journal vacuum — size and retention policies.
191. Correlation: time, host, request id  
   - **Hook:** "Three services, one incident."
   - **Core:** Sync clocks and carry request IDs across hops.
192. dmesg for kernel truth  
   - **Hook:** "Hardware or OOM issues?"
   - **Core:** `dmesg -T` for hardware, OOM, filesystem errors.
193. Read auth.log / secure  
   - **Hook:** "Who tried to log in?"
   - **Core:** Failed SSH attempts and sudo events live in auth logs.
194. Application vs system failures  
   - **Hook:** "Is it Linux or my code?"
   - **Core:** Separate exit codes, ports, and app logs from kernel/resource issues.
195. Change one variable at a time  
   - **Hook:** "I restarted everything and still don't know."
   - **Core:** Scientific debugging beats reboot roulette.
196. Reproduce with minimal commands  
   - **Hook:** "It fails only in production."
   - **Core:** Bisect env differences — PATH, user, cwd, config paths.
197. When to reboot (rarely)  
   - **Hook:** "Have you tried turning it off and on?"
   - **Core:** Reboot loses evidence — capture metrics/logs first unless safety demands it.
198. Incident notes template  
   - **Hook:** "What do I write during an outage?"
   - **Core:** Timeline, impact, actions, hypotheses — future you will thank you.
199. Postmortem without blame  
   - **Hook:** "Who messed up?"
   - **Core:** Fix systems and signals, not people — blameless culture works.
200. Performance: measure before tune  
   - **Hook:** "Should I tweak sysctls now?"
   - **Core:** Baseline with evidence; random sysctl folklore is dangerous.
201. Capacity: disk/CPU/RAM headroom  
   - **Hook:** "We were fine until Black Friday."
   - **Core:** Alerts on utilization trends beat surprise cliffs.
202. Runbooks beat heroics  
   - **Hook:** "Only one person can fix this."
   - **Core:** Document steps; automate the boring ones.
203. Diagnostic short: 5 commands every morning  
   - **Hook:** "Quick host health?"
   - **Core:** `uptime`, `df -h`, `free -h`, `systemctl --failed`, `journalctl -p err -b`.
204. Mini checklist: unknown host, 15 minutes  
   - **Hook:** "New alert, unfamiliar server."
   - **Core:** Identity → resources → failed units → listening ports → recent changes → logs.

---

## Module 14. Bash for DevOps (205–222)

205. Shebang and executable scripts  
   - **Hook:** "Why ./script fails?"
   - **Core:** `chmod +x` and `#!/usr/bin/env bash` — know which bash you run.
206. `set -euo pipefail`  
   - **Hook:** "Script continued after a failure."
   - **Core:** Strict mode catches silent errors — understand exceptions (`|| true`).
207. Functions and `local`  
   - **Hook:** "Variables leaked everywhere."
   - **Core:** Functions + local scope keep scripts maintainable.
208. Exit codes in scripts  
   - **Hook:** "How does CI know we failed?"
   - **Core:** `exit 1` on error paths; don't mask failures.
209. `test` / `[` / `[[`  
   - **Hook:** "How do I write an if in bash?"
   - **Core:** Prefer `[[` in bash; quote variables.
210. Loops without shooting your foot  
   - **Hook:** "for f in $(ls) broke on spaces."
   - **Core:** Glob/iterate carefully; read lines safely.
211. getopts for small CLIs  
   - **Hook:** "How do I parse -f flags?"
   - **Core:** getopts is enough for many ops tools.
212. Logging in scripts  
   - **Hook:** "What did the script do last night?"
   - **Core:** Timestamped echoes to a log file; levels help.
213. Idempotent scripts  
   - **Hook:** "Running twice broke things."
   - **Core:** Check before create; safe to re-run — ops gold standard.
214. shellcheck  
   - **Hook:** "How do I lint bash?"
   - **Core:** shellcheck in CI prevents classic bugs.
215. Don't parse ls  
   - **Hook:** "Tutorials parse ls output…"
   - **Core:** Use globs/find -print0 — ls is for humans.
216. Quoting and arrays (practical)  
   - **Hook:** "Arguments with spaces explode."
   - **Core:** `"${arr[@]}"` and proper quoting.
217. Timeouts and retries  
   - **Hook:** "curl hung the pipeline."
   - **Core:** Explicit timeouts; bounded retries with sleep.
218. Healthcheck script pattern  
   - **Hook:** "How do deploy smokes look?"
   - **Core:** Check HTTP/code/port; non-zero on failure for CI.
219. Secrets in scripts  
   - **Hook:** "Is exporting the password OK?"
   - **Core:** Env from a secret store; never commit secrets; restrict process visibility.
220. Cron + script combo  
   - **Hook:** "Where do production scripts live?"
   - **Core:** Versioned in git, deployed to a known path, invoked by systemd timer/cron.
221. When to stop writing bash  
   - **Hook:** "Is this script too big?"
   - **Core:** Complex data/logic → Python/Go; bash for glue.
222. Mini checklist: script ready for prod  
   - **Hook:** "Before we schedule it?"
   - **Core:** Strict mode, absolute paths, logs, exit codes, shellcheck, dry-run mode.

---

## Module 15. Hardening basics (223–238)

223. Threat model for a single VM  
   - **Hook:** "What are we protecting against?"
   - **Core:** Internet scanners, stolen keys, vulnerable services — prioritize exposed surface.
224. Minimize installed packages  
   - **Hook:** "Why remove unused software?"
   - **Core:** Less software = less attack surface and fewer patches.
225. Automatic security updates (policy)  
   - **Hook:** "Unattended upgrades — yes/no?"
   - **Core:** Decide consciously per environment; monitor reboots for kernels.
226. SSH hardening recap  
   - **Hook:** "Top three SSH locks?"
   - **Core:** Keys only, no root login, allowlist users — then monitoring.
227. Fail2ban / brute-force awareness  
   - **Hook:** "Thousands of failed logins."
   - **Core:** Rate-limit and ban — still keep key auth as primary defense.
228. Firewall default deny recap  
   - **Hook:** "Open ports we forgot?"
   - **Core:** Inventory listeners; close unused; document required ports.
229. File integrity concept (AIDE)  
   - **Hook:** "Did someone change /etc?"
   - **Core:** Baseline and alert on unexpected changes.
230. Secrets: not in world-readable files  
   - **Hook:** "Config has the DB password."
   - **Core:** Mode 600, dedicated user, prefer secret managers as you grow.
231. sudo without NOPASSWD ALL  
   - **Hook:** "Deploy needs sudo — how much?"
   - **Core:** Grant exact commands; avoid unrestricted root via sudo.
232. Kernel and shared responsibility in cloud  
   - **Hook:** "Who patches the hypervisor?"
   - **Core:** You patch guest OS; provider patches host — know the split.
233. SELinux/AppArmor awareness  
   - **Hook:** "It works when I disable SELinux…"
   - **Core:** Don't disable permanently — fix labels/profiles; disabling is a temporary debug move.
234. Auditd / who did what (concept)  
   - **Hook:** "Need accountability on a shared box."
   - **Core:** Auditing records sensitive access — heavier but valuable.
235. Backup restores tested  
   - **Hook:** "We have backups… untested."
   - **Core:** A backup you never restored is a wish — schedule restore drills.
236. Patch cadence  
   - **Hook:** "How often should we patch?"
   - **Core:** Critical CVE fast path + regular cadence; track kernels separately.
237. Principle of least privilege  
   - **Hook:** "One rule for access?"
   - **Core:** Users, processes, and network flows get only what they need.
238. Mini checklist: new server hardening  
   - **Hook:** "Fresh VM checklist?"
   - **Core:** Updates, SSH keys, firewall, non-root ops user, time sync, logging, backups.

---

## Module 16. Bridge to containers and cloud (239–250)

239. Why containers need Linux knowledge  
   - **Hook:** "Docker means I can skip Linux?"
   - **Core:** Containers share the host kernel — cgroups, namespaces, and disk still bite you.
240. Namespaces and cgroups (intuition)  
   - **Hook:** "How is a container isolated?"
   - **Core:** Isolation and resource limits are Linux features Docker/K8s reuse.
241. Image layers vs host packages  
   - **Hook:** "Where does apt run now?"
   - **Core:** Build time in Dockerfile; runtime host still needs the container engine.
242. Logs in a container world  
   - **Hook:** "Where did my logfile go?"
   - **Core:** stdout/stderr → runtime logging drivers; still use journal on VMs.
243. SSH into nodes still matters  
   - **Hook:** "We only kubectl exec…"
   - **Core:** Node/disk/runtime failures still need host access and Linux skills.
244. Cloud init / user-data awareness  
   - **Hook:** "Who created the first user?"
   - **Core:** Cloud-init bootstraps SSH keys and packages on first boot.
245. Immutable vs mutable servers  
   - **Hook:** "Should I SSH in and apt install forever?"
   - **Core:** Prefer baking images/replacing nodes; SSH for break-glass and debugging.
246. From systemd service to container  
   - **Hook:** "How does my unit map to Docker?"
   - **Core:** ExecStart → entrypoint; Restart= → restart policies; env files → env.
247. Networking: host vs bridge (preview)  
   - **Hook:** "Container IP ≠ host IP."
   - **Core:** Port publishing and bridges — Linux networking with extra hops.
248. When Kubernetes enters the chat  
   - **Hook:** "Ready for the k8s shorts?"
   - **Core:** Pods schedule onto Linux nodes — your Linux triage skills still apply.
249. Lab habit: break and fix a VM  
   - **Hook:** "How do I practice?"
   - **Core:** Intentionally fill disk, break fstab carefully, misconfigure SSH in a lab — then recover.
250. Mini checklist: Linux → containers readiness  
   - **Hook:** "Am I ready for Docker shorts?"
   - **Core:** Comfortable with shell, systemd, disk, SSH, ports, and reading logs under pressure.

---

## Module 17. Interviews, habits, career (251–260)

251. Common interview: explain the boot process (high level)  
   - **Hook:** "What happens after power on?"
   - **Core:** Firmware → bootloader → kernel → init/systemd → services — keep it structured.
252. Common interview: process vs thread  
   - **Hook:** "Quick distinction?"
   - **Core:** Processes isolate address spaces; threads share memory inside a process.
253. Common interview: soft vs hard links  
   - **Hook:** "They always ask this."
   - **Core:** Symlink by path; hard link by inode — and directory hard-link rules.
254. Common interview: how DNS works  
   - **Hook:** "Resolve google.com step by step."
   - **Core:** Stub resolver → recursive resolver → hierarchy — mention caching.
255. Troubleshoot aloud  
   - **Hook:** "What do interviewers want?"
   - **Core:** Ordered debugging narrative beats memorized flag lists.
256. Portfolio: home lab beats buzzwords  
   - **Hook:** "How do I prove Linux skill?"
   - **Core:** Document a hardened VM, systemd service, and an incident write-up.
257. Daily habits of strong ops folks  
   - **Hook:** "What do seniors do differently?"
   - **Core:** Measure first, change little, write notes, automate repeats.
258. Reading configs over memorizing  
   - **Hook:** "I forget flags under stress."
   - **Core:** Know where truth lives (`systemctl cat`, configs, man) — retrieval skill wins.
259. Myth roundup: dangerous Linux shortcuts  
   - **Hook:** "What should I never do?"
   - **Core:** `chmod 777`, `curl | sudo bash` from strangers, disable SELinux forever, untested `rm -rf`.
260. What next after the course  
   - **Hook:** "Where do I go when shorts end?"
   - **Core:** Containers → Kubernetes shorts, CI pipelines, deeper networking/security courses in this repo — keep shipping labs.

---

## Extra: template for every short

- Hook (3–5 sec): one pain/question  
- Core (~45–55 sec): 1 concept + failure mode + practical check  
- Lock-in (5–10 sec): command/checklist / memorable rule  
- CTA: `Master Linux faster. Theory, hands-on labs, and interview questions - link in bio.`

On-screen command rule:
- One short command, or 3–6 lines of config max  
- Huge font, high contrast — readable on a phone  
- No dense walls of shell scripts

Scene 1: large TopicBanner with the lesson topic title.

---

## How to publish for watch-through

- Ship by modules (series), not randomly  
- End each video by teasing the next lesson  
- Keep one visual style and module rubric  
- Show key commands large on screen  
- Make 1–2 diagnostic shorts for every 5 theory shorts  
- Don't skip modules: why Linux → shell → files → permissions → processes → systemd → disks → SSH → network → troubleshoot → bash → harden → containers bridge  

Suggested next series after this: **Docker/containers shorts**, then continue **Kubernetes shorts**.

Pipeline guide: `linux-shorts-pipeline-prompt.md` (create from the Go/K8s pipeline templates when you start rendering).  
Shared channel standards: `golang-shorts-pipeline-prompt.md`, `kubernetes-shorts-pipeline-prompt.md`.
