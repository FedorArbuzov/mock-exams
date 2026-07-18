docker exec mock-sqlalchemy-lab python lab_cli.py migrate
$h = docker exec mock-sqlalchemy-lab python lab_cli.py health
if ($h -notmatch '"status":"ok"') { throw "health failed" }
docker exec mock-sqlalchemy-lab python lab_cli.py seed
$c = docker exec mock-sqlalchemy-lab python lab_cli.py count
if ($c -notmatch 'products=2') { throw "seed failed" }
Write-Host "smoke OK"
