# Чек-лист ротации PKI (lab / production outline)

Используйте в [04-lab-cert-rotation](../04-lab-cert-rotation.md) и [13-capstone](../13-capstone.md).

## Leaf-сертификат (сервер / клиент)

- [ ] Зафиксирован **текущий serial** и **notAfter** (`openssl x509 -noout -serial -dates`)
- [ ] Известен **потребитель** cert (nginx, Java truststore, mTLS sidecar)
- [ ] Новый cert выпущен **до** истечения (правило: renewal при ⅔ TTL)
- [ ] Проверена цепочка: `openssl verify -CAfile ca.pem leaf.pem`
- [ ] SAN/CN соответствуют role (`allowed_domains`, `allow_subdomains`)
- [ ] Старый cert отозван или истёк естественно; нет двух активных CN без причины
- [ ] Мониторинг: алерт за **14 / 7 / 1** день до expiry

## Промежуточный CA (intermediate)

- [ ] Подписан **коротким TTL** root (годы), leaf — недели/месяцы
- [ ] Cross-sign или **dual chain** при смене intermediate (если много клиентов)
- [ ] CRL/OCSP endpoint обновлён (`pki/crl`, OCSP в Enterprise)
- [ ] Документирован **migration window**

## Root CA

- [ ] Root **offline** / HSM; online только для подписи intermediate
- [ ] Ротация root — **редкое** событие с change advisory
- [ ] Новый root доставлен во все **trust stores** до отзыва старого

## Vault-специфика

- [ ] `vault write -f pki/roles/...` изменения — через Git + pipeline
- [ ] Lease revocation: `vault lease revoke` при компрометации
- [ ] Audit: кто вызывал `pki/issue`, `pki/sign`
- [ ] Backup **unseal keys** / auto-unseal config **не** в том же bucket, что audit

## После инцидента

- [ ] Root / orphan token отозван
- [ ] Политики пересмотрены (least privilege)
- [ ] Ротация **всех** статических секретов, доступных скомпрометированным identity
