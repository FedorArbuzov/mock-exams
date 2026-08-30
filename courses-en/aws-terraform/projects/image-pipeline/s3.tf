resource "aws_s3_bucket" "files" {
  bucket = var.bucket_name
  tags   = var.tags
}
