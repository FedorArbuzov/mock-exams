path "secret/data/checkout/*" {
  capabilities = ["read"]
}

path "secret/metadata/checkout/*" {
  capabilities = ["read", "list"]
}
