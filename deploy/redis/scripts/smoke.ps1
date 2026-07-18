# Smoke test after: docker compose up -d
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

docker compose ps
$names = docker ps --format '{{.Names}}'
if ($names -notmatch 'mock-redis') {
    Write-Error "Start stack: cd deploy/redis; docker compose up -d"
}

docker exec mock-redis redis-cli ping
$key = "smoke:$(Get-Date -Format 'yyyyMMddHHmmss')"
docker exec mock-redis redis-cli SET $key ok EX 60
Write-Host "OK: smoke passed"
