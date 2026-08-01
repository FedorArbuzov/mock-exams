# SSL for lab 09

## Generating a self-signed cert (on the host)

```bash
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt -keyout server.key -subj "/CN=mock-postgres"
chmod 600 server.key
```

Copy it into the container or mount a volume in `docker-compose.yml`:

```yaml
volumes:
  - ./examples/ssl:/var/lib/postgresql/ssl:ro
command:
  - "-c"
  - "ssl=on"
  - "-c"
  - "ssl_cert_file=/var/lib/postgresql/ssl/server.crt"
  - "-c"
  - "ssl_key_file=/var/lib/postgresql/ssl/server.key"
```

Connection:

```bash
psql "postgresql://course:course@localhost:5432/course?sslmode=require"
```
