# Build mockctl for all targets using Docker (no local Go required).
$ErrorActionPreference = "Stop"
$here = (Resolve-Path $PSScriptRoot).Path
$dist = Join-Path $here "dist"
New-Item -ItemType Directory -Force -Path $dist | Out-Null

$image = if ($env:GOLANG_IMAGE) { $env:GOLANG_IMAGE } else { "golang:1.23-bookworm" }
Write-Host "Using image: $image"

$bash = @'
mkdir -p dist && \
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-windows-amd64.exe . && \
GOOS=linux GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-linux-amd64 . && \
GOOS=linux GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-linux-arm64 . && \
GOOS=darwin GOARCH=amd64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-amd64 . && \
GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/mockctl-darwin-arm64 . && \
ls -la dist
'@

docker run --rm -v "${here}:/src" -w /src $image bash -ce $bash

Write-Host "Done: binaries in dist\"
