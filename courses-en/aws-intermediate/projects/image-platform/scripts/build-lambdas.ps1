$Root = Split-Path -Parent $PSScriptRoot
$Build = Join-Path $Root "lambda\build"

if (Test-Path $Build) { Remove-Item -Recurse -Force $Build }
if (Test-Path "$Root\lambda.zip") { Remove-Item -Force "$Root\lambda.zip" }
New-Item -ItemType Directory -Path $Build | Out-Null
pip install -r (Join-Path $Root "lambda\requirements.txt") -t $Build --quiet
Copy-Item (Join-Path $Root "lambda\handler.py") $Build
Compress-Archive -Path (Join-Path $Build "*") -DestinationPath "$Root\lambda.zip" -Force

Remove-Item -Force "$Root\lambda-api.zip" -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $Root "lambda-api\api_handler.py") -DestinationPath "$Root\lambda-api.zip" -Force
Write-Host "Built lambda.zip and lambda-api.zip"
