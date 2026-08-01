resource "aws_sqs_queue" "dlq" {
  name = "${var.project}-images-dlq"
  tags = var.tags
}

resource "aws_sqs_queue" "work" {
  name = "${var.project}-images-work"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
  tags = var.tags
}

resource "aws_sqs_queue_policy" "allow_s3" {
  queue_url = aws_sqs_queue.work.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.work.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_s3_bucket.images.arn }
      }
    }]
  })
}

resource "aws_s3_bucket_notification" "to_sqs" {
  bucket = aws_s3_bucket.images.id

  queue {
    queue_arn     = aws_sqs_queue.work.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "uploads/"
    filter_suffix = ".jpg"
  }

  depends_on = [aws_sqs_queue_policy.allow_s3]
}
