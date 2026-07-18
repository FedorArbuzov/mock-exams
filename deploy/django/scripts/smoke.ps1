$Base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:8092" }

Write-Host "== health =="
(Invoke-WebRequest -Uri "$Base/health/" -UseBasicParsing).Content | Select-String "ok"

Write-Host "== api products =="
(Invoke-WebRequest -Uri "$Base/api/v1/products/" -UseBasicParsing).Content | Select-String "results"

Write-Host "OK: django stack"
