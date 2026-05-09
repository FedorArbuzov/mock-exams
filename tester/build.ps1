# Cross-compile four binaries into .\dist (same targets as build.sh).
$ErrorActionPreference = "Stop"

$here = $PSScriptRoot
$dist = Join-Path $here "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null

$targets = @(
    @{ GOOS = "windows"; GOARCH = "amd64"; Name = "tester-windows-amd64.exe" },
    @{ GOOS = "linux";   GOARCH = "amd64"; Name = "tester-linux-amd64" },
    @{ GOOS = "darwin";  GOARCH = "amd64"; Name = "tester-darwin-amd64" },
    @{ GOOS = "darwin";  GOARCH = "arm64"; Name = "tester-darwin-arm64" }
)

Push-Location $here
try {
    foreach ($t in $targets) {
        $env:GOOS = $t.GOOS
        $env:GOARCH = $t.GOARCH
        $out = Join-Path $dist $t.Name
        Write-Host "GOOS=$($t.GOOS) GOARCH=$($t.GOARCH) -> $out"
        go build -trimpath -o $out .
    }
}
finally {
    Remove-Item Env:GOOS -ErrorAction SilentlyContinue
    Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
    Pop-Location
}

Write-Host "Done:"
Get-ChildItem $dist | Format-Table Name, Length
