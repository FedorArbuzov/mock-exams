#!/usr/bin/env bash
set -euo pipefail
docker exec mock-sqlalchemy-lab python lab_cli.py migrate
docker exec mock-sqlalchemy-lab python lab_cli.py health | grep -q '"status":"ok"'
docker exec mock-sqlalchemy-lab python lab_cli.py seed
docker exec mock-sqlalchemy-lab python lab_cli.py count | grep -q 'products=2'
echo "smoke OK"
