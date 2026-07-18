# 18. Hooks для Ansible (inventory)

## Введение: один srv1 вручную, сто серверов — Ansible

Вы умеете на srv1: user, nginx, ufw. **Ansible** применяет те же шаги на **N хостов** из inventory — идемпотентно, с отчётом, из GitLab CI.

Полный курс Ansible — отдельно; здесь — **inventory** под стенд `deploy/linux` и первые **ad-hoc** команды.

## Что вы узнаете

- Формат **INI inventory**.
- Группы **web**, **app**, переменные **all:vars**.
- **ad-hoc**: ping, shell, apt.
- Модули vs **shell** — почему важно.

---

## Inventory INI

```ini
# inventory/lab.ini
[web]
web ansible_host=172.28.0.20

[app]
srv1 ansible_host=172.28.0.11
srv2 ansible_host=172.28.0.12

[lab:children]
web
app

[all:vars]
ansible_user=course
ansible_ssh_private_key_file=~/.ssh/id_lab
ansible_python_interpreter=/usr/bin/python3
```

| Элемент | Смысл |
|---------|--------|
| `[web]` | группа хостов |
| `ansible_host` | IP для SSH |
| `[lab:children]` | объединение групп |
| `all:vars` | общие переменные |

---

## Проверка доступа

```bash
ansible all -i inventory/lab.ini -m ping
```

**Успех:** `pong` на каждом хосте.

**Если unreachable:** ключ, firewall, `ansible_host`, user.

---

## ad-hoc примеры

```bash
ansible app -i inventory/lab.ini -m shell -a 'hostname -f'
ansible web -i inventory/lab.ini -m apt -a 'name=nginx state=present' -b
ansible srv1 -i inventory/lab.ini -m copy -a 'src=./file dest=/tmp/file mode=0644'
ansible app -i inventory/lab.ini -m systemd -a 'name=nginx state=started enabled=yes' -b
```

| Модуль | Зачем |
|--------|--------|
| `ping` | connectivity + Python |
| `command`/`shell` | разово, без идемпотентности |
| `apt`, `copy`, `template`, `systemd` | **предпочтительно** в playbooks |

---

## Playbook (preview)

```yaml
# site.yml
- hosts: app
  become: true
  tasks:
    - name: Ensure nginx
      apt:
        name: nginx
        state: present
    - name: Start nginx
      systemd:
        name: nginx
        state: started
```

```bash
ansible-playbook -i inventory/lab.ini site.yml
```

---

## Связь с hardening capstone

Роли можно вынести: `hardening`, `auditd`, `fail2ban` — один playbook на **srv1** вместо ручных лаб (опционально для самостоятельной практики).

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| shell вместо apt | не идемпотентно |
| секреты в inventory git | утечка |
| нет `-b` для root tasks | permission denied |
| host key checking в CI | fail без `known_hosts` policy |

---

## В продакшене

Inventory из **dynamic** (AWS, GCP), Vault для secrets, AWX/Controller, lint (ansible-lint), CI `ansible-playbook --check`.

---

## Резюме

**Inventory** — список хостов и переменных. **ad-hoc** — быстрые проверки. **Playbooks + модули** — production path.

## Чек-лист

- [ ] Что такое inventory?
- [ ] Как проверить все хосты одной командой?
- [ ] Почему apt лучше shell?

Следующий урок: [19. sysctl и limits](19-sysctl-limits.md).
