# Local build + run of mockctl-web (no GHCR).
#
# From repo root:
#   .\scripts\dev-mockctl-web.ps1
#
# Env:
#   MOCKCTL_WEB_PORT  — host port (default 8091)
#   MOCKCTL_WEB_IMAGE — local tag (default mock-exams/mockctl-web:local)

param(
    [string] $Image = $(if ($env:MOCKCTL_WEB_IMAGE) { $env:MOCKCTL_WEB_IMAGE } else { "mock-exams/mockctl-web:local" }),
    [int] $Port = $(if ($env:MOCKCTL_WEB_PORT) { [int]$env:MOCKCTL_WEB_PORT } else { 8091 }),
    [switch] $SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Kubeconfig = Join-Path (Join-Path $env:USERPROFILE ".mock-exams") "kubeconfig.yaml"
$Container = "mockctl-web"

Set-Location $Root

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw "Start Docker Desktop first." }

$ctx = kubectl config get-contexts -o name 2>$null
if ($ctx -notcontains "docker-desktop") {
    throw "Enable Kubernetes in Docker Desktop (Settings -> Kubernetes)."
}
kubectl config use-context docker-desktop | Out-Null
kubectl get nodes
if ($LASTEXITCODE -ne 0) { throw "Cluster not ready." }

New-Item -ItemType Directory -Force -Path (Split-Path $Kubeconfig) | Out-Null
kubectl config view --minify --flatten --context=docker-desktop | Set-Content $Kubeconfig -Encoding utf8

if (-not $SkipBuild) {
    Write-Host "Building $Image ..."
    docker build -f deploy/mockctl-web/Dockerfile -t $Image .
    if ($LASTEXITCODE -ne 0) { throw "docker build failed" }
}

cmd.exe /c "docker rm -f $Container >nul 2>&1" | Out-Null
docker run -d `
    --name $Container `
    --restart unless-stopped `
    -p "${Port}:8091" `
    -v "${Kubeconfig}:/kube/host-kubeconfig.yaml:ro" `
    --add-host host.docker.internal:host-gateway `
    $Image

Start-Sleep -Seconds 2
docker exec $Container kubectl --kubeconfig=/work/output/kubeconfig.yaml get nodes
if ($LASTEXITCODE -ne 0) { throw "Container cannot reach the cluster. docker logs $Container" }

Write-Host ""
Write-Host "OK  http://127.0.0.1:${Port}/"
Write-Host "Rebuild: .\scripts\dev-mockctl-web.ps1"
Write-Host "Rerun only: .\scripts\dev-mockctl-web.ps1 -SkipBuild"
Write-Host "Stop: docker rm -f $Container"
Write-Host "Logs: docker logs -f $Container"
