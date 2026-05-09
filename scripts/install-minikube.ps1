# Installs minikube and kubectl via winget (user scope, no admin usually required).
#
# Usage:
#   .\scripts\install-minikube.ps1
#   .\scripts\install-minikube.ps1 -Reinstall   # uninstall first, then install (test "from scratch")

param(
    [switch] $Reinstall
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Error "winget not found. Install App Installer / Windows Package Manager, or install manually: https://minikube.sigs.k8s.io/docs/start/"
}

if ($Reinstall) {
    Write-Host "Removing existing packages (ignore errors if not installed)..."
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & winget uninstall -e --id Kubernetes.minikube --accept-source-agreements 2>$null
    & winget uninstall -e --id Kubernetes.kubectl --accept-source-agreements 2>$null
    $ErrorActionPreference = $prev
    Write-Host ""
}

Write-Host "Installing minikube and kubectl..."
& winget install -e --id Kubernetes.minikube --accept-package-agreements --accept-source-agreements
& winget install -e --id Kubernetes.kubectl --accept-package-agreements --accept-source-agreements

. (Join-Path $PSScriptRoot "refresh-path.ps1")
if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    $mk = Join-Path $env:ProgramFiles "Kubernetes\Minikube\minikube.exe"
    if (Test-Path $mk) {
        $env:Path = "$(Split-Path $mk);$env:Path"
    }
}
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    $kb = Join-Path $env:ProgramFiles "Kubernetes\kubectl.exe"
    if (-not (Test-Path $kb)) {
        $kb = Join-Path ${env:ProgramFiles(x86)} "Kubernetes\kubectl.exe"
    }
    if (Test-Path $kb) {
        $env:Path = "$(Split-Path $kb);$env:Path"
    }
}

Write-Host ""
Write-Host "Done. PATH refreshed in this session."
if (Get-Command minikube -ErrorAction SilentlyContinue) {
    & minikube version
} else {
    Write-Warning "minikube not on PATH yet. Open a NEW terminal, then: minikube version"
}
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    & kubectl version --client
} else {
    Write-Warning "kubectl not on PATH yet. Open a NEW terminal, then: kubectl version --client"
}
Write-Host ""
Write-Host "Next: scripts\minikube-up.cmd"
