# Read-only lab policy for secret/data/course/*
path "secret/data/course/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/course/*" {
  capabilities = ["read", "list"]
}
