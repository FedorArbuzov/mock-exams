variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "course"
}

variable "bucket_name" {
  type = string
}

variable "use_localstack" {
  type    = bool
  default = true
}

variable "localstack_endpoint" {
  type    = string
  default = "http://localhost:4566"
}

variable "aws_access_key" {
  type    = string
  default = "test"
}

variable "aws_secret_key" {
  type    = string
  default = "test"
}

variable "alert_email" {
  type        = string
  default     = ""
  description = "Optional SNS email subscription (real AWS)"
}

variable "tags" {
  type = map(string)
  default = {
    Project   = "image-platform"
    ManagedBy = "terraform"
  }
}
