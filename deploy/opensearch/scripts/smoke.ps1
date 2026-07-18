$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

docker compose ps
$h = Invoke-RestMethod -Uri http://localhost:9200/_cluster/health
if ($h.status -notin @("green", "yellow")) { throw "cluster not healthy: $($h.status)" }

$body = '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'
Invoke-RestMethod -Method Put -Uri http://localhost:9200/smoke-test -ContentType "application/json" -Body $body | Out-Null
$doc = '{"msg":"ok","@timestamp":"2026-05-18T12:00:00Z"}'
Invoke-RestMethod -Method Post -Uri http://localhost:9200/smoke-test/_doc -ContentType "application/json" -Body $doc | Out-Null
$r = Invoke-RestMethod -Uri "http://localhost:9200/smoke-test/_search?q=msg:ok"
if ($r.hits.total.value -lt 1) { throw "search miss" }
Write-Host "OK: smoke passed"
