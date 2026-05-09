# Removes local minikube state and repo kubeconfig for a clean reinstall test.
# Usage:
#   .\scripts\clean-local-k8s.ps1              # delete cluster(s) + output/kubeconfig.yaml
#   .\scripts\clean-local-k8s.ps1 -Full        # also delete ~/.minikube (re-download on next start)

param(
    [switch] $Full
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "refresh-path.ps1")

$minikube = $null
if (Get-Command minikube -ErrorAction SilentlyContinue) {
    $minikube = "minikube"
} else {
    $mk = Join-Path $env:ProgramFiles "Kubernetes\Minikube\minikube.exe"
    if (Test-Path $mk) {
        $minikube = $mk
    }
}

if ($minikube) {
    Write-Host "Deleting minikube cluster(s)..."
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $minikube delete --all
    $ErrorActionPreference = $prev
    Write-Host "minikube delete --all finished."
} else {
    Write-Warning "minikube not in PATH. Skip cluster delete (nothing to run)."
}

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "output"
if (Test-Path $out) {
    Remove-Item -Path (Join-Path $out "*") -Force -Recurse -ErrorAction SilentlyContinue
    Write-Host "Cleared: $out"
}

if ($Full) {
    $cache = Join-Path $env:USERPROFILE ".minikube"
    if (Test-Path $cache) {
        Remove-Item -Path $cache -Recurse -Force
        Write-Host "Removed minikube cache: $cache"
    }
}

Write-Host "Done. Next: scripts\minikube-up.cmd"
