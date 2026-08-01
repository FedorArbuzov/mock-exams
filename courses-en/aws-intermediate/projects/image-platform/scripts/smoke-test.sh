#!/usr/bin/env bash
set -euo pipefail
ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
BUCKET="${1:?bucket name}"
API="${2:?api endpoint}"
TABLE="${3:?dynamodb table}"

export AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1

echo "Upload test image..."
aws --endpoint-url="$ENDPOINT" s3 cp "$(dirname "$0")/../fixtures/sample.jpg" "s3://$BUCKET/uploads/smoke.jpg" 2>/dev/null \
  || aws --endpoint-url="$ENDPOINT" s3 cp /etc/hosts "s3://$BUCKET/uploads/smoke.jpg" --content-type image/jpeg

echo "Wait for worker..."
sleep 15

echo "Thumbs:"
aws --endpoint-url="$ENDPOINT" s3 ls "s3://$BUCKET/thumbs/" || true

echo "DynamoDB:"
aws --endpoint-url="$ENDPOINT" dynamodb scan --table-name "$TABLE" --max-items 3

IMAGE_ID=$(aws --endpoint-url="$ENDPOINT" dynamodb scan --table-name "$TABLE" --max-items 1 \
  --query 'Items[0].image_id.S' --output text 2>/dev/null || echo "")
if [[ -n "$IMAGE_ID" && "$IMAGE_ID" != "None" ]]; then
  API_KEY=$(aws --endpoint-url="$ENDPOINT" secretsmanager get-secret-value \
    --secret-id course/api-key --query SecretString --output text 2>/dev/null || echo "")
  echo "GET $API/images/$IMAGE_ID"
  curl -sf -H "X-Api-Key: $API_KEY" "$API/images/$IMAGE_ID" | head -c 500
  echo
fi
echo "Smoke test done."
