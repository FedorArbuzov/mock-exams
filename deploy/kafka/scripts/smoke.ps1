# Smoke test for deploy/kafka (PowerShell, run after: docker compose up -d)
$ErrorActionPreference = "Stop"
$Bootstrap = if ($env:BOOTSTRAP) { $env:BOOTSTRAP } else { "localhost:9094" }
$Topic = "smoke-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "== bootstrap: $Bootstrap =="
Set-Location $PSScriptRoot\..
docker compose ps

$container = docker ps --format '{{.Names}}' | Select-String -Pattern '^mock-kafka$' -Quiet
if (-not $container) {
    Write-Error "Start stack: cd deploy/kafka; docker compose up -d"
}

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh `
    --bootstrap-server localhost:9092 `
    --create --topic $Topic --partitions 3 --replication-factor 1

$list = docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh `
    --bootstrap-server localhost:9092 --list
if ($list -notmatch [regex]::Escape($Topic)) {
    Write-Error "Topic $Topic not found"
}
Write-Host "OK: topic $Topic created"
