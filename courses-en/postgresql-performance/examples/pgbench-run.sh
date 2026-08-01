#!/usr/bin/env bash
# pgbench run example (lesson 10)
URL="${PGURL:-postgresql://course:course@localhost:5432/course}"

pgbench -i -s 10 "$URL"
echo "=== baseline ==="
pgbench -c 10 -j 2 -T 30 "$URL"
