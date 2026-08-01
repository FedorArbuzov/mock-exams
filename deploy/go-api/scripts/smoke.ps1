$ErrorActionPreference = "Stop"
$Base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:8099" }

Write-Host "== health =="
$h = (Invoke-WebRequest -Uri "$Base/health" -UseBasicParsing).Content
if ($h -notmatch "ok") { throw "health failed: $h" }

Write-Host "== items =="
$items = (Invoke-WebRequest -Uri "$Base/api/v1/items" -UseBasicParsing).Content
if ($items -notmatch "Demo") { throw "items failed: $items" }

Write-Host "OK: go-api stack"
