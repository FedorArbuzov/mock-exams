# 11. TLS, SNI, MTU и PMTUD

## Введение

TLS сидит поверх TCP (L7 handshake на L4). **MTU blackhole** выглядит как «медленный HTTPS» или зависший upload. База TLS: [linux-intermediate/09–10](../linux-intermediate/09-tls-openssl.md).

---

## TLS termination

| Место | Плюс | Минус |
|-------|------|-------|
| Client → ALB (terminate) | централизованные сертификаты | ALB видит plaintext к backend если не re-encrypt |
| Pass-through (NLB TCP) | end-to-end encrypt | нет L7 routing на ALB |
| Ingress / nginx | гибкость | вы управляете cert lifecycle |

```bash
openssl s_client -connect host:443 -servername api.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates -subject
```

**SNI** — разные сертификаты на одном IP; без SNI старые клиенты ломаются.

---

## mTLS (кратко)

Клиент предъявляет сертификат. Service mesh / API gateway. Ошибки: wrong CA, expired client cert, **hostname mismatch** на backend verify.

---

## MTU и MSS

```text
Ethernet MTU 1500
  - IP header
  - TCP header
  = MSS ~ 1460
```

**Overlay (VXLAN +8)** + **IPsec** → effective MTU меньше. Если path не поддерживает **DF bit** и ICMP «Fragmentation needed» блокирован — **PMTUD blackhole**:

- маленькие запросы OK
- большие POST/TLS records **виснут**

### Лечение

- Поднять MTU на underlay (jumbo 9001 в AWS для некоторых instance)
- Снизить MTU на tunnel interface (`ip link set vxlan0 mtu 1450`)
- Включить TCP MSS clamping на VPN appliance
- Не блокировать ICMP type 3 code 4 (frag needed)

```bash
ping -M do -s 1472 10.0.10.5    # DF, probe MTU
tracepath 10.0.10.5
```

---

## ALB / NLB timeouts

| Параметр | Симптом |
|----------|---------|
| idle timeout | long poll обрыв |
| TLS negotiation timeout | медленные клиенты |
| target connection timeout | backend slow start |

---

## В mock-exams

- TLS lab: [linux-intermediate/10-lab-tls](../linux-intermediate/10-lab-tls.md)
- nginx TLS: [nginx-intermediate](../nginx-intermediate/README.md)

---

## Резюме

TLS — **доверие и имена** (SNI, chain). MTU — **размер кадра на всём пути**; overlay/VPN обязаны учитывать заголовки.

---

## Чек-лист

- [ ] Где terminates TLS в вашем проде?
- [ ] Что такое PMTUD blackhole?
- [ ] Зачем probe с `ping -M do`?

**Дальше:** [12. Kubernetes networking](12-kubernetes-networking.md).
