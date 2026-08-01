# 32. Lab: read a secret in a Lambda handler

## Scenario

A payment handler needs a Stripe API key from Secrets Manager, not from env. We create the secret `shop/api/stripe`, and the handler `pay_with_secret` reads the key and returns a masked preview (never the full key in the response).

**Goal:** create_secret → deploy handler → invoke → verify masked output.

---

## Step 1. Create secret

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client

sm = client('secretsmanager')
name = 'shop/api/stripe'
try:
    sm.create_secret(
        Name=name,
        SecretString=json.dumps({'api_key': 'sk_test_lab_12345', 'webhook_secret': 'whsec_lab'}),
    )
    print('created')
except sm.exceptions.ResourceExistsException:
    sm.put_secret_value(
        SecretId=name,
        SecretString=json.dumps({'api_key': 'sk_test_lab_12345', 'webhook_secret': 'whsec_lab'}),
    )
    print('updated')
"
```

---

## Step 2. Handler pay_with_secret

Add it to your lab copy or temporarily to `handlers.py` (local only):

```python
def pay_with_secret(event, context):
    import json
    from shop_aws.clients import client

    sm = client("secretsmanager")
    resp = sm.get_secret_value(SecretId="shop/api/stripe")
    data = json.loads(resp["SecretString"])
    api_key = data["api_key"]
    masked = api_key[:7] + "..." + api_key[-4:]
    order_id = (event or {}).get("order_id", "unknown")
    return {
        "statusCode": 200,
        "body": json.dumps({
            "order_id": order_id,
            "stripe_key_preview": masked,
            "charged": True,
        }),
    }
```

Test locally:

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.lambda_handlers.handlers import pay_with_secret
class C:
    aws_request_id='x'; function_name='f'; memory_limit_in_mb=128
    def get_remaining_time_in_millis(self): return 999
print(pay_with_secret({'order_id': 'ord-1'}, C()))
"
```

If `pay_with_secret` not in repo — paste inline in `-c` for lab.

---

## Step 3. Deploy Lambda with IAM

Role policy must include:

```json
{"Effect": "Allow", "Action": ["secretsmanager:GetSecretValue"], "Resource": "*"}
```

Deploy like [22-lab-lambda-invoke-boto3](22-lab-lambda-invoke-boto3.md):

- `FUNCTION = "shop-pay"`
- `HANDLER = "shop_aws.lambda_handlers.handlers.pay_with_secret"`

---

## Step 4. Invoke deployed function

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.clients import client
lam = client('lambda')
resp = lam.invoke(
    FunctionName='shop-pay',
    Payload=json.dumps({'order_id': 'ord-secret-1'}).encode(),
)
payload = json.loads(resp['Payload'].read())
print(payload)
body = json.loads(payload['body'])
assert 'sk_test' not in body['stripe_key_preview'] or '...' in body['stripe_key_preview']
"
```

---

## Step 5. SSM config exercise

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
ssm = client('ssm')
ssm.put_parameter(Name='/shop/config/max_upload_mb', Value='50', Type='String', Overwrite=True)
val = ssm.get_parameter(Name='/shop/config/max_upload_mb')['Parameter']['Value']
print('max_upload_mb', val)
"
```

Combine in handler: read SSM limit before S3 upload validation.

---

## Step 6. Access denied test

Deploy with role **without** secretsmanager — invoke → `AccessDeniedException` in FunctionError.

---

## Success criteria

- [ ] Secret `shop/api/stripe` exists
- [ ] Handler returns masked key only
- [ ] Deployed Lambda invoke success
- [ ] SSM parameter read works
- [ ] Understand IAM requirement

## Summary

Secrets in Lambda: **IAM + get_secret_value + never log the full value**. Mask in API responses. Testing AWS code — moto/LocalStack next.

Next: [33-testing-moto-localstack](33-testing-moto-localstack.md).
