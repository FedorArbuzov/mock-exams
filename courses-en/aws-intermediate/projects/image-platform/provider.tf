provider "aws" {
  region = var.aws_region

  access_key                  = var.use_localstack ? var.aws_access_key : null
  secret_key                  = var.use_localstack ? var.aws_secret_key : null
  skip_credentials_validation = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  s3_use_path_style           = var.use_localstack

  dynamic "endpoints" {
    for_each = var.use_localstack ? [1] : []
    content {
      s3                = var.localstack_endpoint
      dynamodb          = var.localstack_endpoint
      lambda            = var.localstack_endpoint
      iam               = var.localstack_endpoint
      sts               = var.localstack_endpoint
      logs              = var.localstack_endpoint
      sqs               = var.localstack_endpoint
      sns               = var.localstack_endpoint
      apigateway        = var.localstack_endpoint
      apigatewayv2      = var.localstack_endpoint
      events            = var.localstack_endpoint
      secretsmanager    = var.localstack_endpoint
      kms               = var.localstack_endpoint
      cloudwatch        = var.localstack_endpoint
      ec2               = var.localstack_endpoint
      elbv2             = var.localstack_endpoint
    }
  }
}
