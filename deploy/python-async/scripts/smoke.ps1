$Base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:8095" }

Write-Host "== health =="
(Invoke-WebRequest -Uri "$Base/health" -UseBasicParsing).Content | Select-String "ok"

Write-Host "== json =="
(Invoke-WebRequest -Uri "$Base/json?size=3" -UseBasicParsing).Content | Select-String "gateway"

Write-Host "== aggregate =="
$sw1 = [System.Diagnostics.Stopwatch]::StartNew()
Invoke-WebRequest -Uri "$Base/aggregate" -UseBasicParsing | Out-Null
$sw1.Stop()

Write-Host "== aggregate-parallel =="
$sw2 = [System.Diagnostics.Stopwatch]::StartNew()
Invoke-WebRequest -Uri "$Base/aggregate-parallel" -UseBasicParsing | Out-Null
$sw2.Stop()

if ($sw2.ElapsedMilliseconds -ge $sw1.ElapsedMilliseconds) {
    Write-Warning "parallel not faster than sequential"
}
Write-Host "OK: seq=$($sw1.ElapsedMilliseconds)ms par=$($sw2.ElapsedMilliseconds)ms"
