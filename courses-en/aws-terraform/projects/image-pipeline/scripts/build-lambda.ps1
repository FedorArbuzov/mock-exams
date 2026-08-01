$Root = Split-Path -Parent $PSScriptRoot
$Build = Join-Path $Root "lambda\build"
$Zip = Join-Path $Root "lambda.zip"

if (Test-Path $Build) { Remove-Item -Recurse -Force $Build }
if (Test-Path $Zip) { Remove-Item -Force $Zip }
New-Item -ItemType Directory -Path $Build | Out-Null

pip install -r (Join-Path $Root "lambda\requirements.txt") -t $Build --quiet
Copy-Item (Join-Path $Root "lambda\handler.py") $Build
Compress-Archive -Path (Join-Path $Build "*") -DestinationPath $Zip -Force
Write-Host "Built $Zip"
