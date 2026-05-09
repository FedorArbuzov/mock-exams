# Deletes minikube profile and frees resources.

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "refresh-path.ps1")

$profileName = "mock-exams"

if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    $mk = Join-Path $env:ProgramFiles "Kubernetes\Minikube\minikube.exe"
    if (Test-Path $mk) {
        $env:Path = "$(Split-Path $mk);$env:Path"
    }
}
if (-not (Get-Command minikube -ErrorAction SilentlyContinue)) {
    $mkDir = Join-Path $env:ProgramFiles "Kubernetes\Minikube"
    Write-Error ("minikube not found. Open a new terminal after install, or run: " + $mkDir + "\minikube.exe")
}

& minikube delete -p $profileName
Write-Host "Profile '$profileName' deleted."
