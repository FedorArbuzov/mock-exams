$ErrorActionPreference = "Stop"
$env:VAULT_ADDR = "http://localhost:8200"
$env:VAULT_TOKEN = "course"

Set-Location $PSScriptRoot\..
docker compose ps

docker exec mock-vault vault status
docker exec -e VAULT_TOKEN=course mock-vault vault kv put secret/smoke msg=ok
$msg = docker exec -e VAULT_TOKEN=course mock-vault vault kv get -field=msg secret/smoke
if ($msg -ne "ok") { throw "kv get failed" }
Write-Host "OK: smoke passed"
