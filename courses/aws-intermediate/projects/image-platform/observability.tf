resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_log_metric_filter" "worker_errors" {
  name           = "${var.project}-worker-errors"
  log_group_name = aws_cloudwatch_log_group.worker.name
  pattern        = "ERROR"

  metric_transformation {
    name      = "WorkerErrorCount"
    namespace = "Course/ImagePlatform"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "worker_errors" {
  alarm_name          = "${var.project}-worker-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "WorkerErrorCount"
  namespace           = "Course/ImagePlatform"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Worker Lambda logged ERROR"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project}-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
  alarm_description = "Messages in DLQ"
  alarm_actions     = [aws_sns_topic.alerts.arn]
}
