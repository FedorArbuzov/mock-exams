# 09. HA, Raft storage и unseal (теория)

## Введение: «Vault лёг — и все деплои встали»

После рестарта ноды команда увидела `Sealed: true` и панику: «где ключи unseal?». В dev mode ([`deploy/vault`](../../deploy/vault/README.md)) Vault **никогда не sealed** — это **не** модель production. На advanced-собеседовании ждут объяснение **Raft**, **quorum**, **Shamir** vs **auto-unseal**, без обязательного поднятия 3-нодового кластера в лабе.

## Что вы узнаете

- Почему **dev mode** не учит HA.
- **Integrated storage (Raft)** vs внешний Consul.
- **Seal / unseal** и master key.
- **Auto-unseal** (KMS, HSM, cloud).
- **Performance standby** и **disaster recovery** (обзор Enterprise).

> **Эта глава — только теория.** Полноценный 3-node HA lab в курсе не разворачиваем; практика seal/unseal — в документации HashiCorp или отдельном prod-like стенде.

---

## Dev mode vs production

| | Dev (`VAULT_DEV_ROOT_TOKEN_ID`) | Production |
|---|--------------------------------|------------|
| Storage | in-memory | Raft / Consul |
| Unseal | автоматически | Shamir или auto-unseal |
| Root token | известен заранее | генерируется при init, revoke |
| TLS | часто HTTP | обязателен |
| Audit | нет | обязателен |

Ваш стенд: один контейнер `mock-vault`, token `course` — **только для PKI/Transit/AppRole лаб**.

---

## Init и Shamir keys

При первом `vault operator init`:

- Генерируется **master key** (шифрует storage).
- Выдаётся **N ключей unseal**, порог **M-of-N** (например 3-of-5).
- Выдаётся **initial root token** (нужно отозвать после bootstrap).

```bash
# концептуальные команды (НЕ на dev-стенде курса)
vault operator init -key-shares=5 -key-threshold=3
vault operator unseal   # повторить M раз разными ключами
```

**Sealed** Vault: API отвечает, но **не** отдаёт секреты. **Unsealed** — master key восстановлен в памяти.

**На собеседовании:** «Кто хранит unseal keys?» — разные люди/сейфы/HSM; не в Git, не в одном 1Password «для удобства».

---

## Raft integrated storage

С Vault 1.4+ типичный паттерн — **Raft** без Consul:

```text
3+ server nodes (odd count)
leader election
replication log entries
```

| Понятие | Смысл |
|---------|--------|
| **Leader** | активные записи, unseal state координация |
| **Follower** | реплика данных |
| **Quorum** | большинство для commit (N/2+1) |
| **Join** | `vault operator raft join` к leader |

Потеря **большинства** нод → кластер не writable. Планируйте **AZ** и backup snapshot ([`vault operator raft snapshot`](https://developer.hashicorp.com/vault/docs/commands/operator/raft/snapshot)).

---

## Auto-unseal

| Метод | Идея |
|-------|------|
| AWS KMS / GCP CKMS / Azure Key Vault | Облачный KMS расшифровывает master key при старте |
| HSM (PKCS#11) | Ключ не покидает железо |
| Transit seal | Meta: другой Vault unseal'ит этот |

Плюс: рестарт без «созвона пяти инженеров». Минус: **зависимость от KMS**; нужен break-glass Shamir backup.

**Recovery mode** (Enterprise) — доступ при потере кворума; отдельная процедура.

---

## Performance replication (обзор)

| | Standard (Raft) | Performance replication |
|---|-----------------|-------------------------|
| Назначение | HA в одном DC | Read scaling / DR |
| Запись | Leader | Primary cluster |
| Секреты | Strong consistency local | Eventually across regions |

На интервью достаточно: «DR secondary не заменяет backup snapshot и runbook unseal».

---

## Namespaces (Enterprise, кратко)

Multi-tenancy: `admin/ns1/secret/...` — изоляция policies и mounts. OSS — один root namespace.

---

## Связь с другими темами курса

- **PKI root key** в storage зашифрован master key — при sealed PKI недоступен.
- **Transit keys** — то же.
- **Audit** ([10](10-troubleshooting-audit.md)) — на всех нодах единый sink или per-node с агрегацией.

---

## На собеседовании — шпаргалка ответов

1. **Что происходит при reboot sealed node?** — Нужен unseal (ручной или auto); standby ждёт leader.
2. **Почему нечётное число нод?** — Quorum без split-brain tie.
3. **Можно ли восстановить из backup без unseal keys?** — Нет; snapshot зашифрован.
4. **Dev vs prod главное отличие?** — Seal discipline + persistent storage + TLS + audit.

---

## Резюме

- Production Vault = **persistent Raft** + **unseal discipline**.
- Dev стенд курса **не** демонстрирует HA — не переносите привычки в prod.
- Следующий шаг: [10. Troubleshooting и audit](10-troubleshooting-audit.md).
