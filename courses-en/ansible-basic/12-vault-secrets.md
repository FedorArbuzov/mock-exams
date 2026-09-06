# 12. ansible-vault and secret hygiene

## Intro: the password is already in git history

A teammate adds to `group_vars/app.yml`:

```yaml
db_password: supersecret
```

The playbook works. The MR is merged. Rotating the password later does **not** erase it from Git. Forks, CI logs, and laptop backups still have it.

**ansible-vault** encrypts a file at rest in the repo. Ansible decrypts it in memory when you pass a vault password. Encryption is **not** access control (anyone with the vault password and the clone can read secrets) and **not** rotation (you still change the DB password in the database).

This lesson is hygiene: what to encrypt, how to reference it, how not to print it.

## What you'll learn

- `create` / `encrypt` / `edit` / `view` / `rekey`.
- Directory layout: `group_vars/app/vault.yml` + plaintext `vars.yml`.
- The `vault_` prefix convention and `db_password: "{{ vault_db_password }}"`.
- `--ask-vault-pass` vs a password file (lab only).
- `no_log: true` on tasks that interpolate secrets.
- What **never** belongs in inventory or git.

There is no separate vault-only lab; [lesson 13](13-lab-troubleshooting.md) has an optional drill, and the [finale](22-final-project.md) requires an encrypted file.

---

## Threat model (lab vs prod)

| Situation | Vault helps? |
|-----------|----------------|
| Secret sitting in a GitHub PR | **yes** — ciphertext in git |
| CI prints `debug: var=db_password` | **no** — you decrypted it into the log |
| Laptop stolen, vault password on a sticky note | **no** |
| Need to revoke a contractor | rekey + rotate the **real** DB password |

On our stand, treat `nimbus-db-2026` as a **fake** secret. Practice the workflow anyway.

---

## Create an encrypted file

```bash
cd ~/ansible-lab
mkdir -p group_vars/all
ansible-vault create group_vars/all/vault.yml
```

Ansible asks for a vault password twice, then opens an editor. Write YAML, save, quit:

```yaml
vault_db_password: "nimbus-db-2026"
vault_api_token: "lab-only-token"
```

The file on disk starts with:

```text
$ANSIBLE_VAULT;1.1;AES256
...
```

Never commit the plaintext. Commit the ciphertext (in a real course repo you might gitignore lab vault files — the finale still expects the encrypted file **on the lab container**).

### Encrypt an existing plaintext file

```bash
ansible-vault encrypt group_vars/all/secrets.yml
ansible-vault view group_vars/all/secrets.yml
ansible-vault edit group_vars/all/secrets.yml
```

`view` decrypts to stdout (do not pipe that into Slack). `edit` decrypts to a temp file, opens `$EDITOR`, re-encrypts.

---

## Directory form: plaintext next to vault

Ansible loads **every** `*.yml` in `group_vars/all/`. Split:

```text
group_vars/all/
  vault.yml      # encrypted — only vault_* keys
  vars.yml       # plaintext — references
```

If you already have a file `group_vars/all.yml`, rename/move it into `group_vars/all/vars.yml`. A file `all.yml` **and** a directory `all/` for the same group is a conflict.

```yaml
# group_vars/all/vars.yml
db_password: "{{ vault_db_password }}"
```

Playbooks and templates use **`db_password`**, never `vault_db_password` directly. Reasons:

1. You can swap Vault for HashiCorp Vault / AWS later by changing **one** assignment.
2. A grep for `vault_` in the repo shows “these must stay encrypted.”
3. Role defaults can say `db_password: ""` and docs stay readable.

If you put `db_password: hunter2` in `vars.yml` **and** encrypt only `vault.yml`, you still leaked the password.

---

## Running a playbook that needs the vault

```bash
ansible-playbook site.yml --ask-vault-pass
```

Lab convenience (file mode `600`, **not** committed):

```bash
echo 'your-lab-vault-password' > ~/.vault_pass_lab
chmod 600 ~/.vault_pass_lab
ansible-playbook site.yml --vault-password-file ~/.vault_pass_lab
```

`ansible.cfg` can set `vault_password_file` — convenient and dangerous if that cfg is copied. Prefer the CLI flag in this course.

Without a password: `ERROR! Attempting to decrypt but no vault secrets found` or `Decryption failed`.

---

## Using the secret on a host

```yaml
- name: Write DB env file
  copy:
    dest: /etc/nimbus/db.env
    owner: root
    group: root
    mode: "0600"
    content: |
      DB_PASSWORD={{ db_password }}
  no_log: true
```

`no_log: true` hides task args and diffs (including `--diff`). Without it, `-v` prints the password.

Template variant (finale):

```yaml
- name: Template db.env
  template:
    src: db.env.j2
    dest: /etc/nimbus/db.env
    mode: "0600"
  no_log: true
```

```jinja2
# roles/app/templates/db.env.j2
DB_PASSWORD={{ db_password }}
```

Create `/etc/nimbus` with the `file` module first (`state: directory`, mode `0750`).

---

## Vault ID (multiple keys) — overview

Teams sometimes have `dev` vs `prod` passwords:

```bash
ansible-vault encrypt --encrypt-vault-id prod group_vars/prod/vault.yml
ansible-playbook site.yml --vault-id prod@prompt
```

You do not need vault-ids on the three-container stand. Know that **one** vault password for all environments is a large blast radius.

---

## What belongs where

| Item | Plaintext in git? |
|------|-------------------|
| `ansible_user`, `ansible_host`, group names | yes |
| `nginx_server_name`, `app_port` | yes |
| SSH **private** key (`id_lab`) | **no** — lives on `lab` only |
| DB passwords, API tokens, cloud keys | **no** — vault or CI secret store |
| `ansible_ssh_pass` | lab only; never in prod repos |
| Vault password itself | **no** — prompt, CI masked variable, or agent |

`[all:vars] ansible_ssh_private_key_file=~/.ssh/id_lab` in inventory is a **path**, not the key material. Fine.

---

## `rekey` when people leave

```bash
ansible-vault rekey group_vars/all/vault.yml
```

Everyone must get the new vault password. Also **rotate** `vault_db_password` in the actual database — rekey only changes wrapping encryption.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `debug: var=db_password` | secret in stdout and CI logs |
| Forgot `--ask-vault-pass` | decrypt error |
| Encrypted file + same values in plaintext `group_vars/app.yml` | leak |
| Vault password in the playbook or `ansible.cfg` committed | leak |
| `mode: "0644"` on `db.env` | any user on the box can read the secret |
| Same vault password for prod and student laptops | blast radius |

---

## In production

- Prefer a **secret manager** (HashiCorp Vault, cloud SM) via lookup plugins; ansible-vault is “encrypt files in git.”
- CI: store the vault password as a masked variable; never `echo` it in `before_script`.
- `no_log` plus log aggregation: still assume humans can dump process env on the target if file mode is wrong.

Related: [`kuber-vault`](../kuber-vault/README.md), [`gitlab-cicd`](../gitlab-cicd/README.md).

---

## Summary

**ansible-vault** keeps secrets as ciphertext in Git. Use **`vault_`** keys in encrypted files, map them to normal vars, **`no_log`** on tasks that render them, and tight file modes on the target. The finale requires `group_vars/all/vault.yml` with `vault_db_password`.

## Checklist

- [ ] How do you run a playbook that references encrypted vars?
- [ ] Why keep `vault_db_password` in the vault file and `db_password: "{{ vault_db_password }}"` in plaintext?
- [ ] Why is `no_log: true` not optional on a task that writes `DB_PASSWORD=`?
- [ ] Where should the SSH private key live on this stand?

Next lab: [13. Lab: fix a broken playbook](13-lab-troubleshooting.md).
