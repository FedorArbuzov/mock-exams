# 25. Docker socket и группа docker

## Введение: «добавили в группу docker — теперь root»

Разработчик просит `docker` без sudo. Вы добавляете в **`docker` group**. Формально это **root на хосте**: через socket можно смонтировать `/` хоста в privileged container, читать `/etc/shadow`, менять iptables.

В Kubernetes **монтирование docker.sock в Pod** — антипаттерн с тем же риском.

## Что вы узнаете

- Как устроен **`/var/run/docker.sock`**.
- Почему **группа docker** = root equivalent.
- **Rootless** Docker/Podman (обзор).
- Практики для CI и dev.

---

## Docker socket

```bash
ls -l /var/run/docker.sock
# srw-rw---- root docker
groups
id
```

CLI (`docker run`) → **HTTP API** на unix socket → **dockerd** → containerd → runc.

Любой, кто может писать в socket, может:

```bash
docker run --rm -v /:/host alpine chroot /host sh
```

---

## Группа docker

| Практика | Риск |
|----------|------|
| все dev в docker | компромисс аккаунта = root |
| CI runner в docker | изоляция runner VM обязательна |
| только root использует docker | неудобно, безопаснее |

**Альтернативы:**

- `sudo` с whitelist только для конкретных образов (редко);
- **rootless** docker/podman;
- remote builder (BuildKit, Kaniko в K8s) без socket на runner.

---

## Rootless (обзор)

Docker/Podman rootless — daemon от пользователя, **user namespaces**, меньше blast radius. Не все фичи (порты <1024, некоторые volume) доступны без доп. настроек.

---

## Kubernetes

| Паттерн | Вердикт |
|---------|---------|
| `docker.sock` в Pod | избегать |
| DinD privileged | только изолированные CI |
| Kaniko / buildkitd remote | предпочтительно |

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| docker group в LDAP для всех | mass root |
| socket world-readable | катастрофа |
| CI на prod host socket | полный захват |

---

## В продакшене

Отдельные build nodes. Podman rootless на workstations. Audit кто в группе docker. В capstone — осознанное решение для deploy/CI.

---

## Резюме

**docker.sock** — API с правами root. **Группа docker** — не «удобство», а privilege. CI/K8s — без socket на app hosts.

## Чек-лист

- [ ] Почему docker.sock = root?
- [ ] Кто в группе docker на вашей машине?
- [ ] Чем rootless помогает?

Следующий урок: [26. Deploy user](26-deploy-user.md).
