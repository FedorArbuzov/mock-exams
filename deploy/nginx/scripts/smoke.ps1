$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

docker compose up -d --build
docker compose ps

(Invoke-WebRequest -Uri http://localhost:8080/ -UseBasicParsing).Content -match "edge OK"
(Invoke-WebRequest -Uri http://localhost:8080/static/ -UseBasicParsing).Content -match "Static backend"
(Invoke-WebRequest -Uri http://localhost:8080/api/health -UseBasicParsing).Content -match "ok"
if (Test-Path certs\server.crt) {
  Invoke-WebRequest -Uri https://localhost:8443/api/health -SkipCertificateCheck -UseBasicParsing | Out-Null
}
Write-Host "OK: smoke passed"
