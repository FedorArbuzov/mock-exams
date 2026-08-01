# 07. vim: essentials

## Why learn vim if you have an IDE

On a server over SSH there is often **no** GUI. The nginx config, a systemd unit, editing `sshd_config` — all through the terminal. **vim** (or the compatible **vi**) is present in almost any minimal Docker image and in rescue mode. You don't need mastery — you need to **confidently open a file, fix a line, save, and exit**, without leaving a swap file or breaking the syntax.

If it really doesn't click — you can use `nano` for the labs, but in prod and in interviews people expect vim.

## Modes — the main idea

vim is not "Notepad". In **Normal** mode you move the cursor and issue commands; in **Insert** you type text; in **Command-line** (`:`) you save and exit.

| Mode | How to get there | What to do |
|-------|-------------|------------|
| Normal | Esc (default when opening) | `dd`, `yy`, `/search` |
| Insert | `i`, `a`, `o` | typing text |
| Command | `:` in Normal | `:w`, `:q`, `:wq` |

Beginners get stuck because they type in Normal — the letters disappear as commands. Press **Esc** and start again.

## The minimal everyday set

```bash
vim /tmp/lab.txt
```

| Action | Keys |
|----------|---------|
| Insert before the cursor | `i` |
| Insert after the cursor | `a` |
| New line below | `o` |
| Exit to Normal | `Esc` |
| Save and exit | `:wq` + Enter |
| Exit without saving | `:q!` |
| Save, stay | `:w` |
| Delete a line | `dd` |
| Undo | `u` |
| Redo | `Ctrl+r` |
| Search forward | `/text` Enter, then `n` |

## Navigation without a mouse

- `h j k l` — left, down, up, right
- `0` — start of line, `$` — end
- `gg` — start of file, `G` — end
- `:10` + Enter — go to line 10

Handy for the error "line 42 in nginx.conf": `vim +42 /etc/nginx/nginx.conf`.

## Bulk edits

```text
:%s/old/new/g      replace all old with new (with confirmation: .../gc)
3dd                delete 3 lines
yy p               copy a line and paste below
```

Be careful with `:%s` in prod — make a backup first or `:w` a copy.

## ~/.vimrc (optional)

```vim
set number
set tabstop=2
set expandtab
syntax on
```

Create `~/.vimrc` in lab — the settings persist in the container until `compose down -v`.

## Alternatives

| Editor | Pro | Con |
|----------|------|-------|
| nano | simple | not everywhere in scripts |
| micro | intuitive | rarely preinstalled |
| vim | everywhere | learning curve |

## Checklist

- How do you save and exit if you accidentally pressed `i` and nothing types? (Esc → `:wq`)
- How do you delete a line with a typo?
- How does `:q!` differ from `:q` with unsaved changes?

Next lesson: [07. Lab: vim](07-lab-vim.md).
