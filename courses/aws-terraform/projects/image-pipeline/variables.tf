variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "course"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name"
}

variable "use_localstack" {
  type        = bool
  default     = true
  description = "When true, point AWS provider at LocalStack"
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

variable "tags" {
  type = map(string)
  default = {
    Project   = "aws-terraform"
    ManagedBy = "terraform"
  }
}
