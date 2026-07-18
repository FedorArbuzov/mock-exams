# 26. Deploy user для CI/CD

## Введение: GitLab CI с ключом root на сервере

Pipeline с `ssh root@prod` и ключом в **CI variable** — компромисс job = полный захват prod. Паттерн: пользователь **deploy** — SSH по ключу **только с runner**, **sudo whitelist** (nginx reload), без интерактивного root.

## Что вы узнаете

- Принципы **least privilege** для deploy.
- SSH **Match User**, hardening.
- **sudoers.d** whitelist.
- Связь с GitLab и capstone.

---

## Принцип

| Нельзя | Можно |
|--------|--------|
| root + NOPASSWD ALL | deploy + restart конкретного unit |
| пароль в CI | SSH key rotate |
| shared personal key | отдельный deploy key per env |

---

## Создание пользователя (концепт)

```bash
sudo useradd -m -s /bin/bash deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# authorized_keys — только public key CI runner
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## sudo whitelist

`/etc/sudoers.d/deploy-nginx`:

```text
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload nginx, /usr/bin/nginx -t
```

```bash
sudo visudo -c
```

См. [linux-intermediate/24-lab-sudo](../linux-intermediate/24-lab-sudo.md).

---

## sshd Match (preview)

```text
Match User deploy
    AllowTcpForwarding no
    X11Forwarding no
    PermitTTY yes
```

Ограничение **from** IP — `AllowUsers` + firewall на runner subnet.

---

## GitLab CI (фрагмент)

```yaml
deploy_prod:
  stage: deploy
  script:
    - ssh deploy@172.28.0.11 'sudo nginx -t && sudo systemctl reload nginx'
  only:
    - main
```

Ключ в **protected variable**, environment **production** с manual approval.

---

## Аудит

```bash
grep deploy /var/log/auth.log | tail -5
sudo grep deploy /var/log/auth.log | grep sudo | tail -5
```

---

## Типичные ошибки

| Ошибка | Риск |
|--------|------|
| deploy в docker group | root |
| whitelist `systemctl` без пути | обход |
| один ключ на dev и prod | blast radius |

---

## В продакшене

Отдельные deploy users per env (deploy_staging, deploy_prod). Ansible управляет sudoers. MFA на human access, CI — только automation keys.

---

## Резюме

**deploy** — сервисная учётка с **минимальным** sudo. Ключи только CI/bastion. Capstone — deploy + nginx whitelist на srv1.

## Чек-лист

- [ ] Почему не root в CI?
- [ ] Какие 2 команды в sudo whitelist для nginx?
- [ ] Где смотреть audit deploy?

Следующий урок: [27. Интеграция](27-integration.md).
