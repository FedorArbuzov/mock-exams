# Build self-contained mockctl binaries with the courses-en/ tree baked in,
# using Docker (no local Go required). Output: dist\mockctl-<os>-<arch>-embed[.exe].
#
# go:embed can't reach ..\courses-en, so we stage a copy at mockctl\courses\
# (gitignored) for the duration of the build and remove it afterwards.
#
# Artifacts are built inside the container and pulled out with `docker cp`
# rather than written straight to the bind-mounted dist\: large writes over the
# Docker Desktop bind mount on Windows are unreliable (go build writes via a
# temp file + rename, and the rename can silently fail).
#
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 reads .ps1 without a
# BOM in the system codepage, so non-ASCII (em dashes, etc.) breaks parsing.
$ErrorActionPreference = "Stop"
$here = (Resolve-Path $PSScriptRoot).Path
$repo = (Resolve-Path (Join-Path $here "..")).Path
$dist = Join-Path $here "dist"
$staged = Join-Path $here "courses"
$srcCourses = Join-Path $repo "courses-en"

if (-not (Test-Path $srcCourses)) {
    throw "courses-en/ not found at $srcCourses"
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null

$image = if ($env:GOLANG_IMAGE) { $env:GOLANG_IMAGE } else { "golang:1.23-bookworm" }
$container = "mockctl-embed-build"
Write-Host "Using image:  $image"
Write-Host "Staging courses-en: $srcCourses -> $staged"

if (Test-Path $staged) { Remove-Item -Recurse -Force $staged }

# robocopy (built into Windows) mirrors courses-en/ but skips heavy, non-teaching
# junk that would otherwise bloat the binary (mostly node_modules and
# virtualenvs in the example projects).
$excludeDirs = @(
    "node_modules", ".venv", "venv", "env", "__pycache__", ".pytest_cache",
    ".mypy_cache", ".ruff_cache", "dist", "build", "out", ".next", "target",
    ".git", "coverage", ".nyc_output"
)
$excludeFiles = @("*.pyc", ".DS_Store")
$roboArgs = @($srcCourses, $staged, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP",
    "/XD") + $excludeDirs + @("/XF") + $excludeFiles
robocopy @roboArgs | Out-Null
# robocopy exit codes 0-7 mean success; 8+ is a real failure.
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
$global:LASTEXITCODE = 0

# Copy the module (minus dist/) into the container's own writable FS and build
# there, emitting binaries to /out. We avoid building straight against the bind
# mount (see note above). Artifacts are pulled out with docker cp.
$bash = @'
set -e
mkdir -p /tmp/build /out
cd /src
for item in *; do
  [ "$item" = dist ] && continue
  cp -R "/src/$item" /tmp/build/
done
cd /tmp/build
GOOS=windows GOARCH=amd64 go build -tags embed -trimpath -ldflags "-s -w" -o /out/mockctl-windows-amd64-embed.exe .
GOOS=linux   GOARCH=amd64 go build -tags embed -trimpath -ldflags "-s -w" -o /out/mockctl-linux-amd64-embed .
GOOS=linux   GOARCH=arm64 go build -tags embed -trimpath -ldflags "-s -w" -o /out/mockctl-linux-arm64-embed .
GOOS=darwin  GOARCH=amd64 go build -tags embed -trimpath -ldflags "-s -w" -o /out/mockctl-darwin-amd64-embed .
GOOS=darwin  GOARCH=arm64 go build -tags embed -trimpath -ldflags "-s -w" -o /out/mockctl-darwin-arm64-embed .
ls -la /out
'@
# The here-string picks up CRLF from this .ps1 file; bash chokes on the \r.
$bash = $bash -replace "`r`n", "`n"

# Best-effort pre-clean; ignore "No such container" on the first run.
try { docker rm -f $container 2>&1 | Out-Null } catch { }

try {
    docker run --name $container -v "${here}:/src" -w /src $image bash -ce $bash
    if ($LASTEXITCODE -ne 0) { throw "docker build failed with exit code $LASTEXITCODE" }
    docker cp "${container}:/out/." $dist
    if ($LASTEXITCODE -ne 0) { throw "docker cp failed with exit code $LASTEXITCODE" }
}
finally {
    try { docker rm -f $container 2>&1 | Out-Null } catch { }
    if (Test-Path $staged) { Remove-Item -Recurse -Force $staged }
}

$produced = @(Get-ChildItem $dist -Filter *embed* -ErrorAction SilentlyContinue)
if ($produced.Count -eq 0) {
    throw "build reported success but no *-embed binaries landed in $dist. Docker Desktop file sharing may be in a bad state; restart Docker Desktop and retry."
}

Write-Host "Done: embedded binaries in dist\ (suffix -embed)"
$produced | Format-Table Name, Length
