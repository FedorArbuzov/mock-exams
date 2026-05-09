# Requires: Docker Desktop (running), minikube.
# Optional: kubectl in PATH (winget install Kubernetes.kubectl) for manual checks.
# Install minikube: winget install Kubernetes.minikube
#   https://minikube.sigs.k8s.io/docs/start/

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "refresh-path.ps1")

$profileName = "mock-exams"
$root = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $root "output"
$kubeconfigOut = Join-Path $outputDir "kubeconfig.yaml"

if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    $mk = Join-Path $env:ProgramFiles "Kubernetes\Minikube\minikube.exe"
    if (Test-Path $mk) {
        $env:Path = "$(Split-Path $mk);$env:Path"
    }
}
if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    Write-Error "minikube not found. Install: winget install Kubernetes.minikube - then open a NEW terminal, or run this script again."
}

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

Write-Host "Starting minikube profile '$profileName' (driver=docker)..."
& minikube start -p $profileName --driver=docker

# Single-file kubeconfig for MockExams (repo looks for output/kubeconfig.yaml)
& minikube -p $profileName kubectl -- config view --flatten --minify | Set-Content -Path $kubeconfigOut -Encoding utf8

Write-Host ""
Write-Host "Kubeconfig written: $kubeconfigOut"
Write-Host ('Check: kubectl --kubeconfig "' + $kubeconfigOut + '" get nodes')
Write-Host ('Stop VM (keep profile): minikube stop -p ' + $profileName)
Write-Host 'Remove cluster: .\scripts\minikube-down.ps1'
