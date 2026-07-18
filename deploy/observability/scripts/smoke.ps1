# After: docker compose up -d --build
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

docker compose ps
Invoke-WebRequest -Uri http://localhost:9090/-/healthy -UseBasicParsing | Out-Null
Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing | Out-Null
Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing | Out-Null
1..20 | ForEach-Object { Invoke-WebRequest -Uri http://localhost:8000/ -UseBasicParsing | Out-Null }
Start-Sleep -Seconds 2
$r = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/query?query=demo_http_requests_total" -UseBasicParsing
if ($r.Content -notmatch 'demo_http_requests_total') { throw "metrics missing" }
Write-Host "OK: smoke passed"
