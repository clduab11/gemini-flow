# Terraform Variables for GCP Base Infrastructure Module

variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = ""
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "The environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "version" {
  description = "The application version"
  type        = string
  default     = "latest"
}

# Network configuration
variable "gke_subnet_cidr" {
  description = "CIDR range for the GKE subnet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "gke_pod_cidr" {
  description = "CIDR range for GKE pods"
  type        = string
  default     = "10.1.0.0/16"
}

variable "gke_service_cidr" {
  description = "CIDR range for GKE services"
  type        = string
  default     = "10.2.0.0/16"
}

variable "allowed_ssh_ranges" {
  description = "CIDR ranges allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

# Storage configuration
variable "storage_location" {
  description = "Location for Cloud Storage buckets"
  type        = string
  default     = "US"
}

# Redis configuration
variable "enable_redis" {
  description = "Whether to enable Redis for caching"
  type        = bool
  default     = true
}

variable "redis_tier" {
  description = "Redis instance tier"
  type        = string
  default     = "STANDARD_HA"
  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.redis_tier)
    error_message = "Redis tier must be BASIC or STANDARD_HA."
  }
}

variable "redis_memory_size" {
  description = "Redis memory size in GB"
  type        = number
  default     = 4
  validation {
    condition     = var.redis_memory_size >= 1 && var.redis_memory_size <= 300
    error_message = "Redis memory size must be between 1 and 300 GB."
  }
}

variable "redis_ip_range" {
  description = "IP range for Redis instance"
  type        = string
  default     = "10.3.0.0/29"
}

# Cloud SQL configuration
variable "enable_cloud_sql" {
  description = "Whether to enable Cloud SQL for metadata storage"
  type        = bool
  default     = true
}

variable "sql_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-custom-2-7680"
}

variable "sql_disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 50
  validation {
    condition     = var.sql_disk_size >= 10 && var.sql_disk_size <= 65536
    error_message = "SQL disk size must be between 10 and 65536 GB."
  }
}

# GitHub integration
variable "github_repo_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "clduab11"
}

variable "github_repo_name" {
  description = "GitHub repository name"
  type        = string
  default     = "gemini-flow"
}

variable "deploy_branch" {
  description = "Branch to trigger deployments"
  type        = string
  default     = "main"
}

# Monitoring configuration
variable "notification_emails" {
  description = "List of email addresses for notifications"
  type        = list(string)
  default     = []
}

# Resource scaling
variable "node_count" {
  description = "Number of nodes in the GKE cluster"
  type        = number
  default     = 3
  validation {
    condition     = var.node_count >= 1 && var.node_count <= 100
    error_message = "Node count must be between 1 and 100."
  }
}

variable "min_node_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 10
}

variable "machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-standard-4"
}

variable "disk_size_gb" {
  description = "Disk size for GKE nodes in GB"
  type        = number
  default     = 100
}

variable "disk_type" {
  description = "Disk type for GKE nodes"
  type        = string
  default     = "pd-ssd"
  validation {
    condition     = contains(["pd-standard", "pd-ssd", "pd-balanced"], var.disk_type)
    error_message = "Disk type must be pd-standard, pd-ssd, or pd-balanced."
  }
}

# Security configuration
variable "enable_network_policy" {
  description = "Whether to enable network policy for GKE cluster"
  type        = bool
  default     = true
}

variable "enable_private_nodes" {
  description = "Whether to enable private nodes for GKE cluster"
  type        = bool
  default     = true
}

variable "master_ipv4_cidr_block" {
  description = "CIDR block for GKE master nodes"
  type        = string
  default     = "172.16.0.0/28"
}

variable "enable_workload_identity" {
  description = "Whether to enable Workload Identity for GKE cluster"
  type        = bool
  default     = true
}

# Feature flags
variable "enable_vertex_ai" {
  description = "Whether to enable Vertex AI integration"
  type        = bool
  default     = true
}

variable "enable_multimedia_processing" {
  description = "Whether to enable multimedia processing capabilities"
  type        = bool
  default     = true
}

variable "enable_agent_space" {
  description = "Whether to enable AgentSpace functionality"
  type        = bool
  default     = true
}

variable "enable_mariner" {
  description = "Whether to enable Project Mariner integration"
  type        = bool
  default     = false
}

variable "enable_advanced_monitoring" {
  description = "Whether to enable advanced monitoring and alerting"
  type        = bool
  default     = true
}

# Cost optimization
variable "enable_preemptible_nodes" {
  description = "Whether to use preemptible nodes for cost optimization"
  type        = bool
  default     = false
}

variable "enable_node_auto_provisioning" {
  description = "Whether to enable node auto provisioning"
  type        = bool
  default     = true
}

variable "spot_node_pool" {
  description = "Whether to create a spot instance node pool"
  type        = bool
  default     = false
}

# Backup and disaster recovery
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_cross_region_backup" {
  description = "Whether to enable cross-region backup"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Secondary region for cross-region backup"
  type        = string
  default     = "us-east1"
}

# Performance tuning
variable "enable_gpu_nodes" {
  description = "Whether to enable GPU nodes for ML workloads"
  type        = bool
  default     = false
}

variable "gpu_type" {
  description = "GPU type for accelerated workloads"
  type        = string
  default     = "nvidia-tesla-t4"
  validation {
    condition = contains([
      "nvidia-tesla-t4",
      "nvidia-tesla-v100",
      "nvidia-tesla-p4",
      "nvidia-tesla-p100",
      "nvidia-tesla-k80",
      "nvidia-l4"
    ], var.gpu_type)
    error_message = "GPU type must be a valid NVIDIA GPU type."
  }
}

variable "gpu_count" {
  description = "Number of GPUs per node"
  type        = number
  default     = 1
  validation {
    condition     = var.gpu_count >= 1 && var.gpu_count <= 8
    error_message = "GPU count must be between 1 and 8."
  }
}

# Compliance and governance
variable "enable_binary_authorization" {
  description = "Whether to enable Binary Authorization for container security"
  type        = bool
  default     = true
}

variable "enable_pod_security_policy" {
  description = "Whether to enable Pod Security Policy"
  type        = bool
  default     = true
}

variable "enable_audit_logging" {
  description = "Whether to enable audit logging"
  type        = bool
  default     = true
}

variable "data_location_constraint" {
  description = "Data location constraint for compliance"
  type        = string
  default     = ""
}

# Tags and labels
variable "additional_labels" {
  description = "Additional labels to apply to resources"
  type        = map(string)
  default     = {}
}

variable "additional_tags" {
  description = "Additional network tags to apply to resources"
  type        = list(string)
  default     = []
}