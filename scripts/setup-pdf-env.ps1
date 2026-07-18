# Create .venv-pdf and install PDF build dependencies.
# Run from repo root:  .\scripts\setup-pdf-env.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Venv = Join-Path $Root ".venv-pdf"
$Req = Join-Path $Root "scripts\requirements-pdf.txt"

Set-Location $Root

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "python not found in PATH"
}

if (-not (Test-Path $Venv)) {
    Write-Host "Creating venv: $Venv"
    python -m venv $Venv
}

$Python = Join-Path $Venv "Scripts\python.exe"
$Pip = Join-Path $Venv "Scripts\pip.exe"

Write-Host "Installing packages from requirements-pdf.txt..."
& $Pip install -r $Req

Write-Host "Installing Playwright Chromium..."
& $Python -m playwright install chromium

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  .\.venv-pdf\Scripts\Activate.ps1"
Write-Host "  python scripts\build-courses-pdf.py"
