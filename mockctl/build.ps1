# Cross-compile mockctl for windows/linux/macOS into .\dist (requires local Go).
$ErrorActionPreference = "Stop"

$here = $PSScriptRoot
$dist = Join-Path $here "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null

$targets = @(
    @{ GOOS = "windows"; GOARCH = "amd64"; Name = "mockctl-windows-amd64.exe" },
    @{ GOOS = "linux";   GOARCH = "amd64"; Name = "mockctl-linux-amd64" },
    @{ GOOS = "linux";   GOARCH = "arm64"; Name = "mockctl-linux-arm64" },
    @{ GOOS = "darwin";  GOARCH = "amd64"; Name = "mockctl-darwin-amd64" },
    @{ GOOS = "darwin";  GOARCH = "arm64"; Name = "mockctl-darwin-arm64" }
)

Push-Location $here
try {
    foreach ($t in $targets) {
        $env:GOOS = $t.GOOS
        $env:GOARCH = $t.GOARCH
        $out = Join-Path $dist $t.Name
        Write-Host "GOOS=$($t.GOOS) GOARCH=$($t.GOARCH) -> $out"
        go build -trimpath -ldflags "-s -w" -o $out .
    }
}
finally {
    Remove-Item Env:GOOS -ErrorAction SilentlyContinue
    Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
    Pop-Location
}

Write-Host "Done:"
Get-ChildItem $dist | Format-Table Name, Length
