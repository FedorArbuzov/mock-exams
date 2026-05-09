#!/usr/bin/env bash
# Deletes minikube profile mock-exams.

set -euo pipefail

PROFILE="mock-exams"

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube not found." >&2
  exit 1
fi

minikube delete -p "$PROFILE"
echo "Profile '$PROFILE' deleted."
