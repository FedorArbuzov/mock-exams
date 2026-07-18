#!/usr/bin/env bash
set -euo pipefail
docker exec mock-python-aws-lab python lab_cli.py bootstrap
docker exec mock-python-aws-lab python lab_cli.py health | grep -q '"status":"ok"'
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
s = S3Service()
s.put_bytes('smoke.txt', b'ok')
assert b'ok' == s.get_bytes('smoke.txt')
print('s3 OK')
"
echo "smoke OK"
