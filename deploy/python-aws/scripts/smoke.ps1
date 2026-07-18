docker exec mock-python-aws-lab python lab_cli.py bootstrap
$h = docker exec mock-python-aws-lab python lab_cli.py health
if ($h -notmatch '"status":"ok"') { throw "health failed" }
docker exec mock-python-aws-lab python -c "from shop_aws.s3_service import S3Service; s=S3Service(); s.put_bytes('smoke.txt', b'ok'); assert s.get_bytes('smoke.txt')==b'ok'"
Write-Host "smoke OK"
