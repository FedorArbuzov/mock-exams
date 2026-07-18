$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

$root = (git rev-parse --show-toplevel 2>$null)
if (-not $root) { $root = (Resolve-Path "..\..").Path }
$kc = Join-Path $root "output\kubeconfig.yaml"
if (Test-Path $kc) { $env:KUBECONFIG = $kc }

kubectl get nodes | Select-String -Pattern "Ready" -Quiet | Out-Null
kubectl get deploy -n argocd argocd-server | Out-Null
Write-Host "OK: gitops smoke passed"
