$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

docker compose up -d --build
docker compose ps
(Invoke-WebRequest -Uri http://localhost:8088/api/health -UseBasicParsing).Content | Select-String -Pattern 'ok' -Quiet | Out-Null
Write-Host "OK: smoke passed"
