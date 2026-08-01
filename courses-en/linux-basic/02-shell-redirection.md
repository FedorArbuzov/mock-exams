# 02. Shell, PATH, redirection, pipe

## Why a DevOps engineer needs this

Half of your working day in the terminal is **command chains**: pull an IP out of some output, filter a log, send stderr to a file, verify that nothing got lost in a pipe. CI/CD, Ansible and kubectl are also "shells" around the same ideas: stdout/stderr, exit codes, environment variables.

This lesson is about **bash** in interactive mode. Scripting (strict mode, functions, debugging) is covered in the [`linux-shell`](../linux-shell/README.md) course.

## Interactive shell: who runs the command

When you type `ls`, it is not "Linux" that does the work but the **shell** — an interpreter program. The shell reads the line, splits it into words, finds the program, runs it, and shows the output.

```bash
echo $0          # name of the current shell, usually -bash or bash
type cd          # cd is a shell builtin
type ls          # ls is /usr/bin/ls
```

**Built-in** commands (`cd`, `export`, `source`, `alias`) are executed by bash itself — there is no separate file. **External** ones are ordinary binaries; bash looks for them in the directories from the **PATH** variable.

If `cd` doesn't work in a script run as `./script.sh` — people often forget that `cd` affects only the **current** shell process, not the parent.

## PATH — where bash looks for programs

```bash
echo $PATH
# typically: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

which nginx
type -a python3
command -v docker
```

If you see `command not found` — either the package isn't installed, or the binary lives outside PATH (for example `/opt/myapp/bin`).

Temporarily add a directory **to the front** of PATH (to "override" the system version):

```bash
export PATH="/opt/myapp/bin:$PATH"
```

Permanently — a line in `~/.bashrc` or a file in `/etc/profile.d/` (for all users). After editing: `source ~/.bashrc` or a new login.

**Beginner mistake:** writing `PATH=...` without `export` — the variable is visible only to the current shell, and child processes (and cron) won't see it.

## Three streams: stdin, stdout, stderr

Every process by default has:

| Descriptor | Name | Where it goes in the terminal |
|------------|-----|------------------------|
| 0 | stdin | from the keyboard |
| 1 | stdout | to the screen |
| 2 | stderr | to the screen (a separate stream!) |

Errors often go to **stderr** so they can be separated from normal output. Example: `ls` successfully prints directories to stdout, while "Permission denied" goes to stderr.

| Construct | Effect |
|-------------|--------|
| `cmd > file` | stdout to a file (overwrite) |
| `cmd >> file` | append stdout to the end |
| `cmd 2> file` | only stderr to a file |
| `cmd &> file` | stdout and stderr to one file (bash) |
| `cmd > file 2>&1` | "attach" stderr to stdout (a classic in scripts) |
| `cmd < file` | stdin from a file |

Example of splitting the streams:

```bash
ls /etc /root > /tmp/ok.txt 2> /tmp/err.txt
wc -l /tmp/ok.txt
cat /tmp/err.txt
```

You will see a long list of `/etc` in `ok.txt` and denial messages for `/root` in `err.txt`.

## Pipe — the conveyor

```bash
ss -tlnp 2>/dev/null | head -20
ps aux | grep -E 'ssh|nginx' | grep -v grep
```

The output on the **left** becomes the input on the **right**. Each stage is a separate process; this is handy for "raw" output → filter → count.

**Subtlety:** by default in bash the exit code of the whole pipe is the code of the **last** command. If you need to know whether the first one failed:

```bash
set -o pipefail    # in scripts — mandatory
# or one-off:
grep foo /etc/hosts | wc -l
echo "${PIPESTATUS[@]}"
```

Interactively, when debugging "why is it empty", it is sometimes useful to remove the pipe and look at the left command on its own.

## Glob — filename expansion

```bash
echo *.service
ls /var/log/syslog*
```

**Before** running the command, the shell expands the pattern into a list of names. If there are no matches, in bash the pattern may remain literally `*.log` — and the command will say "No such file". In scripts people enable `shopt -s nullglob` so that an empty list doesn't break a loop.

Quotes disable glob: `echo "*.log"` prints the asterisk literally.

## Environment variables

```bash
NAME=lab
echo "Hello $NAME"
echo "${HOME}/bin"
export DB_HOST=127.0.0.1
env | grep DB_
```

Without **export**, the variable is visible only to the current shell. With **export**, it is inherited by child processes (`nginx`, `python`, a CI job).

The substitution `${VAR:-default}` — if VAR is empty, substitute default (handy in deployment scripts).

## Hotkeys and history

| Combination | Action |
|------------|----------|
| Ctrl+C | interrupt the current command |
| Ctrl+D | end of input (exit the shell if the line is empty) |
| Ctrl+L | clear the screen |
| ↑ / ↓ | scroll through history |

```bash
history | tail -20
!42        # repeat command #42 from history
!!         # repeat the previous one
```

On jump hosts with `HISTSIZE` enabled, history is a working log: "what did I do before the incident".

## Common mistakes

- Confusing `>` and `>>` — accidentally wiping a log on a repeated run.
- Forgetting `2>&1` in cron and getting an empty log file when errors go only to stderr.
- Running `grep` in a pipe without suppressing its own stderr (`2>/dev/null`) when searching in `/etc` without permissions.

## Checklist

- How does a **built-in** command differ from an **external** one?
- Where will the `Permission denied` message go with `ls /root > out.txt`?
- What does `cmd1 | cmd2` do?
- How do you temporarily add a directory to PATH?

Next lesson: [02. Lab: shell](02-lab-shell.md).
