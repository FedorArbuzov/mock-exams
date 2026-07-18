$Base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:8090" }

Write-Host "== health =="
(Invoke-WebRequest -Uri "$Base/health" -UseBasicParsing).Content | Select-String "ok"

Write-Host "== openapi =="
(Invoke-WebRequest -Uri "$Base/openapi.json" -UseBasicParsing).Content | Select-String "openapi"

Write-Host "== items =="
(Invoke-WebRequest -Uri "$Base/api/v1/items" -UseBasicParsing).Content | Select-String "Demo"

Write-Host "== metrics =="
(Invoke-WebRequest -Uri "$Base/metrics" -UseBasicParsing).Content | Select-String "fastapi_http_requests_total"

Write-Host "OK: fastapi stack"
