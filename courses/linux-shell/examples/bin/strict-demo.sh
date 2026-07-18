#!/usr/bin/env bash
# Demo for linux-shell lesson 01-02: strict mode works
set -euo pipefail

echo "strict-demo: starting"
# This line would fail without set -e in a script that doesn't check:
true
echo "strict-demo: OK"
