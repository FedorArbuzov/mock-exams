# 19. Lab: validate Ingress

Install an Ingress controller (Kubespray variable or Helm — your choice). Then apply [`app/ingress.yaml`](app/ingress.yaml).

## Task

```text
app.example.com  →  shop/frontend
```

Confirm:

- an Ingress controller is running
- Ingress `shop` (or the name in the manifest) has host `app.example.com`
- you can reach frontend through that Ingress from a probe (Host header) **or** from a node port / LB you documented

**Check** asserts the Ingress object and a Ready frontend. After this lab the catalog treats the cluster as ready for CKA 01.

Next: [20. CKA track](20-cka-track.md).
