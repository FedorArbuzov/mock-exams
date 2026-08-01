# 07. Lab: vim

15–20 minutes is enough to stop fearing `:q!`. Go slowly: after each step press **Esc** and check which mode you're in (there should be no `-- INSERT --` at the bottom if you're in Normal).

## Environment

`docker compose exec lab bash`

---

## Task 1. Create a file from scratch

```bash
vim /tmp/vim-lab.txt
```

1. Press `i` — `-- INSERT --` at the bottom
2. Type two lines: `hello lab` and `line two`
3. `Esc`
4. `:wq` + Enter

Verification:

```bash
cat /tmp/vim-lab.txt
```

---

## Task 2. Edit and undo

```bash
vim /tmp/vim-lab.txt
```

1. Arrow keys to the second line
2. `dd` — the line disappears
3. `u` — it comes back
4. `o` — a new line below, in Insert; type `line three`
5. `Esc` → `:w`

Exit with `:q` and check with `cat`.

---

## Task 3. Search and replace

```bash
vim /tmp/vim-lab.txt
```

1. `/lab` + Enter — cursor on `lab`
2. `n` — next occurrence (if any)
3. `:%s/lab/LAB/g` + Enter
4. `:wq`

```bash
grep LAB /tmp/vim-lab.txt
```

---

## Task 4. Exit without saving

```bash
vim /tmp/vim-lab.txt
```

Change something, then `:q!` — the file on disk is **without** the last edit (check with `cat`).

---

## Task 5. Open at a specific line

```bash
vim +2 /tmp/vim-lab.txt
```

The cursor should land on line 2.

---

## Success criteria

- [ ] The file was created and saved with `:wq`
- [ ] `dd` and `u` worked
- [ ] The `:%s/...` replacement was applied
- [ ] `:q!` didn't corrupt the file on disk

Next lesson: [08. apt](08-packages-apt.md).
