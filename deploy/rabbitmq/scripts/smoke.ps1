$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

docker compose ps
docker exec mock-rabbitmq rabbitmq-diagnostics -q ping
docker exec mock-rabbitmq rabbitmqadmin -u course -p course list exchanges name type
Write-Host "OK: smoke passed"
