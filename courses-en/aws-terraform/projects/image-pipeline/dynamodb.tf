resource "aws_dynamodb_table" "images" {
  name         = "${var.project}-images"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "image_id"

  attribute {
    name = "image_id"
    type = "S"
  }

  tags = var.tags
}
