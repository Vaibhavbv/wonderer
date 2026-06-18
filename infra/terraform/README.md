# Wanderverse — Infrastructure as Code (Terraform)

This directory contains Terraform configurations for deploying Wanderverse to AWS.

## Architecture

- **ECS Fargate**: Containerized NestJS API
- **RDS PostgreSQL**: Multi-AZ database
- **ElastiCache Redis**: Cache & queue
- **S3**: Media storage with CloudFront CDN
- **CloudWatch**: Logging & monitoring
- **Route53**: DNS management
- **AWS WAF**: Security

## Modules

| Module | Purpose |
|--------|---------|
| `vpc` | Network infrastructure (VPC, subnets, NAT, ALB) |
| `ecs` | Fargate cluster, services, task definitions |
| `rds` | PostgreSQL database with read replicas |
| `elasticache` | Redis cluster for cache & BullMQ |
| `s3` | Media buckets with lifecycle policies |
| `cloudfront` | CDN for static assets and media |
| `route53` | DNS records and SSL certificates |
| `iam` | Roles and policies for ECS tasks |
| `waf` | Web Application Firewall rules |

## Usage

```bash
cd infra/terraform
terraform init
terraform plan -var-file="environments/production.tfvars"
terraform apply -var-file="environments/production.tfvars"
```

## State Management

Terraform state is stored in S3 with DynamoDB locking:
- Bucket: `wanderverse-terraform-state`
- DynamoDB Table: `wanderverse-terraform-locks`

## Environments

| Environment | File | Description |
|-------------|------|-------------|
| Production | `environments/production.tfvars` | Live production |
| Staging | `environments/staging.tfvars` | Pre-production testing |
| Development | `environments/development.tfvars` | Dev environment |

## Variables

See `variables.tf` for all configurable parameters including:
- Instance sizes and scaling parameters
- Database configurations
- Domain names and SSL certificates
- Cost optimization settings

## Cost Estimates (Monthly)

| Component | Estimated Cost |
|-----------|---------------|
| ECS Fargate (3 tasks) | $150 |
| RDS PostgreSQL (Multi-AZ) | $200 |
| ElastiCache Redis | $50 |
| S3 + CloudFront | $100-500 (usage-based) |
| ALB + WAF | $50 |
| CloudWatch | $30 |
| **Total (base)** | **~$580/month** |

*Note: Costs scale with usage. S3/CloudFront costs are primarily driven by media storage and bandwidth.*

---

*Last Updated: 2025-01-15*
