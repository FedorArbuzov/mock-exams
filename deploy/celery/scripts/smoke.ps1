$Base = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:8093" }

Write-Host "== health =="
$h = Invoke-RestMethod "$Base/health/"
if ($h.status -ne "ok") { throw "health failed" }

Write-Host "== ping task =="
$r = Invoke-RestMethod -Method Post "$Base/tasks/ping/"
$taskId = $r.task_id
Write-Host "task_id=$taskId"

1..20 | ForEach-Object {
    Start-Sleep -Milliseconds 500
    $t = Invoke-RestMethod "$Base/tasks/$taskId/"
    if ($t.state -eq "SUCCESS") {
        Write-Host "ping SUCCESS"
        exit 0
    }
}
throw "FAIL: task did not succeed in time"
