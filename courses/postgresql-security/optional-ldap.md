# Опционально: LDAP в Docker

Полноценная LDAP-лаба выходит за рамки базового стенда — в курсе достаточно [tabletop](05-lab-ldap.md). Если нужен hands-on с bind, ниже минимальный путь.

## Когда имеет смысл

- Проверить реальный `pg_hba ldap` перед prod AD cutover
- Отладить TLS к LDAP (636) и certificate chain
- Автоматизировать onboarding script (CREATE ROLE + GRANT)

## Минимальный compose (outline)

```yaml
services:
  openldap:
    image: osixia/openldap:1.5.0
    environment:
      LDAP_ORGANISATION: "Corp"
      LDAP_DOMAIN: "corp.local"
      LDAP_ADMIN_PASSWORD: "admin"
    ports:
      - "389:389"
      - "636:636"
```

PostgreSQL должен быть собран **с LDAP** (`ldapauth`). Стандартный `postgres:16` image — проверьте `pg_config --libs` или документацию образа.

## pg_hba пример

```text
host all ldapuser 172.18.0.0/16 ldap \
  ldapserver=openldap \
  ldapport=636 \
  ldaptls=1 \
  ldapbasedn="dc=corp,dc=local"
```

**Не копируйте в prod:** `0.0.0.0/0` без TLS.

## Checklist hands-on

- [ ] User в LDAP + `CREATE ROLE` в PG
- [ ] Login через psql с LDAP password
- [ ] Disable user в LDAP → login fail
- [ ] Break-glass local SCRAM role работает при LDAP down

См. теорию: [04-ldap-ad.md](04-ldap-ad.md).
