# Optional: LDAP in Docker

A full LDAP lab is beyond the scope of the basic environment — the [tabletop](05-lab-ldap.md) is enough for the course. If you want hands-on experience with bind, here's a minimal path.

## When it makes sense

- Test a real `pg_hba ldap` before a prod AD cutover
- Debug TLS to LDAP (636) and the certificate chain
- Automate the onboarding script (CREATE ROLE + GRANT)

## Minimal compose (outline)

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

PostgreSQL must be built **with LDAP** (`ldapauth`). For the standard `postgres:16` image — check `pg_config --libs` or the image documentation.

## pg_hba example

```text
host all ldapuser 172.18.0.0/16 ldap \
  ldapserver=openldap \
  ldapport=636 \
  ldaptls=1 \
  ldapbasedn="dc=corp,dc=local"
```

**Don't copy to prod:** `0.0.0.0/0` without TLS.

## Hands-on checklist

- [ ] User in LDAP + `CREATE ROLE` in PG
- [ ] Login via psql with the LDAP password
- [ ] Disable the user in LDAP → login fails
- [ ] Break-glass local SCRAM role works when LDAP is down

See the theory: [04-ldap-ad.md](04-ldap-ad.md).
