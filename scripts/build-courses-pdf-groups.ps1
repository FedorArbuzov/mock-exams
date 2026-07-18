# Build PDF for each course area (dist/*.pdf).
# Run from repo root with activated .venv-pdf:
#   .\.venv-pdf\Scripts\Activate.ps1
#   .\scripts\build-courses-pdf-groups.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Python = Join-Path $Root ".venv-pdf\Scripts\python.exe"
$Script = Join-Path $Root "scripts\build-courses-pdf.py"

if (-not (Test-Path $Python)) {
    Write-Error "Run scripts\setup-pdf-env.ps1 first"
}

$groups = @(
    "kubernetes",
    "linux",
    "aws",
    "gitlab",
    "postgresql",
    "kafka",
    "redis",
    "observability",
    "messaging",
    "platform",
    "theory"
)

Set-Location $Root
New-Item -ItemType Directory -Force -Path (Join-Path $Root "dist") | Out-Null

foreach ($g in $groups) {
    Write-Host "=== $g ===" -ForegroundColor Cyan
    & $Python $Script --group $g
}

Write-Host ""
Write-Host "Done. Output: $Root\dist\" -ForegroundColor Green
Get-ChildItem (Join-Path $Root "dist\*.pdf") | Format-Table Name, @{N="MB";E={[math]::Round($_.Length/1MB,2)}}
