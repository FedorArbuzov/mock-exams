#!/usr/bin/env bash
# verify-final.sh — LocalStack checks for aws-terraform image platform finale.
# Usage:
#   ./verify-final.sh --bucket B --table T --lambda L \
#     [--dlq-name Q] [--secret-name S] [--api-url URL] [--upload file.jpg]
set -euo pipefail

ENDPOINT="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
BUCKET=""
TABLE=""
LAMBDA=""
DLQ_NAME=""
SECRET_NAME=""
API_URL=""
UPLOAD=""
STRICT=0

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="$REGION"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket) BUCKET="$2"; shift 2 ;;
    --table) TABLE="$2"; shift 2 ;;
    --lambda) LAMBDA="$2"; shift 2 ;;
    --dlq-name) DLQ_NAME="$2"; shift 2 ;;
    --secret-name) SECRET_NAME="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    --upload) UPLOAD="$2"; shift 2 ;;
    --endpoint) ENDPOINT="$2"; shift 2 ;;
    --platform) STRICT=1; shift ;;
    -h|--help)
      echo "Usage: $0 --bucket B --table T --lambda L [--platform] [--dlq-name Q] [--secret-name S] [--api-url URL] [--upload jpg]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

fail=0
ok()  { echo "  OK  $*"; }
bad() { echo "  FAIL $*"; fail=1; }
have() { command -v "$1" >/dev/null 2>&1; }

aws_local() {
  aws --endpoint-url="$ENDPOINT" --region "$REGION" "$@"
}

echo "== aws-terraform final verify =="
echo "ENDPOINT=$ENDPOINT"
echo

if ! have curl; then
  echo "curl not found" >&2
  exit 1
fi

echo "-- LocalStack health --"
code=$(curl -sS -o /tmp/ls-health.json -w "%{http_code}" --connect-timeout 3 \
  "$ENDPOINT/_localstack/health" || echo "000")
if [[ "$code" == "200" ]]; then
  ok "health HTTP 200"
else
  bad "health HTTP $code (run: mockctl localstack up)"
fi

if ! have aws; then
  bad "aws CLI not found — install AWS CLI v2 for resource checks"
  echo
  [[ "$fail" -eq 0 ]] && echo "RESULT: PASS (health only)" && exit 0
  echo "RESULT: FAIL"; exit 1
fi

if [[ -z "$BUCKET" || -z "$TABLE" || -z "$LAMBDA" ]]; then
  bad "pass --bucket, --table, and --lambda (from tflocal output)"
  echo "RESULT: FAIL"
  exit 1
fi

echo "-- core resources --"
if aws_local s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  ok "s3 bucket $BUCKET"
else
  bad "s3 bucket $BUCKET missing"
fi

if aws_local dynamodb describe-table --table-name "$TABLE" >/dev/null 2>&1; then
  ok "dynamodb table $TABLE"
  gsi=$(aws_local dynamodb describe-table --table-name "$TABLE" \
    --query 'length(Table.GlobalSecondaryIndexes)' --output text 2>/dev/null || echo 0)
  ttl=$(aws_local dynamodb describe-time-to-live --table-name "$TABLE" \
    --query 'TimeToLiveDescription.TimeToLiveStatus' --output text 2>/dev/null || echo NONE)
  if [[ "$gsi" != "0" && "$gsi" != "None" && "$gsi" != "null" ]]; then
    ok "dynamodb GSI present (count=$gsi)"
  elif [[ "$STRICT" -eq 1 ]]; then
    bad "dynamodb GSI missing (--platform)"
  else
    echo "  SKIP GSI (pass --platform to require)"
  fi
  if [[ "$ttl" == "ENABLED" || "$ttl" == "ENABLING" ]]; then
    ok "dynamodb TTL $ttl"
  elif [[ "$STRICT" -eq 1 ]]; then
    bad "dynamodb TTL not enabled (--platform)"
  else
    echo "  SKIP TTL (pass --platform to require)"
  fi
else
  bad "dynamodb table $TABLE missing"
fi

if aws_local lambda get-function --function-name "$LAMBDA" >/dev/null 2>&1; then
  ok "lambda $LAMBDA"
  dlq_arn=$(aws_local lambda get-function-configuration --function-name "$LAMBDA" \
    --query 'DeadLetterConfig.TargetArn' --output text 2>/dev/null || echo None)
  if [[ -n "$dlq_arn" && "$dlq_arn" != "None" && "$dlq_arn" != "null" ]]; then
    ok "lambda DLQ configured"
  elif [[ "$STRICT" -eq 1 ]]; then
    bad "lambda DLQ missing (--platform)"
  else
    echo "  SKIP lambda DLQ (pass --platform to require)"
  fi
else
  bad "lambda $LAMBDA missing"
fi

if [[ "$STRICT" -eq 1 ]]; then
  if [[ -z "$DLQ_NAME" || -z "$SECRET_NAME" || -z "$API_URL" ]]; then
    bad "--platform requires --dlq-name, --secret-name, and --api-url"
  fi
fi

echo "-- platform resources --"
if [[ -n "$DLQ_NAME" ]]; then
  if aws_local sqs get-queue-url --queue-name "$DLQ_NAME" >/dev/null 2>&1; then
    ok "sqs queue $DLQ_NAME"
  else
    bad "sqs queue $DLQ_NAME missing"
  fi
else
  echo "  SKIP --dlq-name (pass queue name for platform check)"
fi

if [[ -n "$SECRET_NAME" ]]; then
  if aws_local secretsmanager describe-secret --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
    ok "secret $SECRET_NAME"
  else
    bad "secret $SECRET_NAME missing"
  fi
else
  echo "  SKIP --secret-name"
fi

if [[ -n "$API_URL" ]]; then
  health="$API_URL"
  if [[ "$health" != */health && "$health" != */health/ ]]; then
    health="${API_URL%/}/health"
  fi
  acode=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 5 "$health" || echo "000")
  if [[ "$acode" =~ ^2 ]]; then
    ok "API health $health → $acode"
  else
    bad "API health $health → $acode"
  fi
else
  echo "  SKIP --api-url"
fi

if [[ -n "$UPLOAD" ]]; then
  echo "-- upload smoke --"
  if [[ ! -f "$UPLOAD" ]]; then
    bad "upload file not found: $UPLOAD"
  else
    key="uploads/verify-$(date +%s).jpg"
    if aws_local s3 cp "$UPLOAD" "s3://$BUCKET/$key" >/dev/null; then
      ok "uploaded s3://$BUCKET/$key"
    else
      bad "s3 cp failed"
    fi
    echo "  waiting for Lambda (up to 45s)..."
    found=0
    for _ in $(seq 1 15); do
      sleep 3
      thumbs=$(aws_local s3 ls "s3://$BUCKET/thumbs/" 2>/dev/null || true)
      count=$(aws_local dynamodb scan --table-name "$TABLE" --select COUNT \
        --query 'Count' --output text 2>/dev/null || echo 0)
      if [[ -n "$thumbs" && "$count" != "0" && "$count" != "None" ]]; then
        ok "thumbs/ has objects; dynamodb Count=$count"
        found=1
        break
      fi
    done
    if [[ "$found" -eq 0 ]]; then
      bad "no thumbs/ objects or dynamodb items after upload (check Lambda logs)"
    fi
  fi
fi

echo
if [[ "$fail" -eq 0 ]]; then
  echo "RESULT: PASS (LocalStack layer)"
  echo "Still review IAM / modules / docs (see 24-verification.md)."
  exit 0
else
  echo "RESULT: FAIL (see messages above)"
  exit 1
fi
