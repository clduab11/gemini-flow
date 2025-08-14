# Terraform Module: GCP Base Infrastructure for Gemini-Flow Google Services Integration
# This module provisions core GCP resources for hosting Gemini-Flow with Google Services

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

# Data sources
data "google_project" "current" {}

data "google_client_config" "default" {}

# Local values
locals {
  project_id = var.project_id != "" ? var.project_id : data.google_project.current.project_id
  region     = var.region
  zone       = var.zone
  
  # Resource naming
  name_prefix = "${var.environment}-gemini-flow"
  
  # Labels
  default_labels = {
    project     = "gemini-flow"
    environment = var.environment
    component   = "google-services"
    managed_by  = "terraform"
    version     = var.version
  }
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "aiplatform.googleapis.com",
    "ml.googleapis.com",
    "storage.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "redis.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com",
    "servicenetworking.googleapis.com",
    "vpcaccess.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com"
  ])
  
  project = local.project_id
  service = each.key
  
  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false
  mtu                     = 1460
  
  depends_on = [google_project_service.required_apis]
}

# Subnet for GKE cluster
resource "google_compute_subnetwork" "gke_subnet" {
  name          = "${local.name_prefix}-gke-subnet"
  ip_cidr_range = var.gke_subnet_cidr
  region        = local.region
  network       = google_compute_network.vpc.id
  
  secondary_ip_range {
    range_name    = "gke-pod-range"
    ip_cidr_range = var.gke_pod_cidr
  }
  
  secondary_ip_range {
    range_name    = "gke-service-range"
    ip_cidr_range = var.gke_service_cidr
  }
  
  private_ip_google_access = true
}

# Cloud NAT for private clusters
resource "google_compute_router" "nat_router" {
  name    = "${local.name_prefix}-nat-router"
  region  = local.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${local.name_prefix}-nat"
  router                            = google_compute_router.nat_router.name
  region                            = local.region
  nat_ip_allocate_option            = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  
  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Cloud Storage buckets
resource "google_storage_bucket" "multimedia_storage" {
  name          = "${local.name_prefix}-multimedia-${random_id.bucket_suffix.hex}"
  location      = var.storage_location
  force_destroy = var.environment != "production"
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 7
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  labels = local.default_labels
}

resource "google_storage_bucket" "model_cache" {
  name          = "${local.name_prefix}-model-cache-${random_id.bucket_suffix.hex}"
  location      = var.storage_location
  force_destroy = var.environment != "production"
  
  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "Delete"
    }
  }
  
  labels = local.default_labels
}

resource "google_storage_bucket" "backup_storage" {
  name          = "${local.name_prefix}-backups-${random_id.bucket_suffix.hex}"
  location      = var.storage_location
  force_destroy = var.environment != "production"
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 30
      matches_storage_class = ["STANDARD"]
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
  
  labels = local.default_labels
}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Artifact Registry for container images
resource "google_artifact_registry_repository" "gemini_flow" {
  repository_id = "${local.name_prefix}-registry"
  location      = local.region
  format        = "DOCKER"
  description   = "Container registry for Gemini-Flow applications"
  
  labels = local.default_labels
}

# Secret Manager secrets
resource "google_secret_manager_secret" "api_keys" {
  secret_id = "${local.name_prefix}-api-keys"
  
  replication {
    auto {}
  }
  
  labels = local.default_labels
}

resource "google_secret_manager_secret" "database_credentials" {
  secret_id = "${local.name_prefix}-database-credentials"
  
  replication {
    auto {}
  }
  
  labels = local.default_labels
}

resource "google_secret_manager_secret" "oauth_credentials" {
  secret_id = "${local.name_prefix}-oauth-credentials"
  
  replication {
    auto {}
  }
  
  labels = local.default_labels
}

# Cloud Memorystore (Redis) for caching
resource "google_redis_instance" "cache" {
  count = var.enable_redis ? 1 : 0
  
  name           = "${local.name_prefix}-cache"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size
  region         = local.region
  
  authorized_network = google_compute_network.vpc.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  
  redis_version     = "REDIS_7_0"
  display_name      = "Gemini-Flow Cache"
  reserved_ip_range = var.redis_ip_range
  
  labels = local.default_labels
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Private Service Access for Redis and other services
resource "google_compute_global_address" "private_ip_address" {
  name          = "${local.name_prefix}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
  
  depends_on = [google_project_service.required_apis]
}

# Cloud SQL instance for metadata storage
resource "google_sql_database_instance" "postgres" {
  count = var.enable_cloud_sql ? 1 : 0
  
  name             = "${local.name_prefix}-postgres"
  database_version = "POSTGRES_15"
  region           = local.region
  
  settings {
    tier              = var.sql_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.sql_disk_size
    
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }
    
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true
    }
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    
    user_labels = local.default_labels
  }
  
  deletion_protection = var.environment == "production"
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "google_sql_database" "gemini_flow" {
  count     = var.enable_cloud_sql ? 1 : 0
  name      = "gemini_flow"
  instance  = google_sql_database_instance.postgres[0].name
  charset   = "UTF8"
  collation = "en_US.UTF8"
}

# Pub/Sub topics for async processing
resource "google_pubsub_topic" "multimedia_processing" {
  name = "${local.name_prefix}-multimedia-processing"
  
  labels = local.default_labels
  
  message_retention_duration = "86400s" # 24 hours
}

resource "google_pubsub_topic" "model_inference" {
  name = "${local.name_prefix}-model-inference"
  
  labels = local.default_labels
  
  message_retention_duration = "86400s" # 24 hours
}

resource "google_pubsub_topic" "dead_letter" {
  name = "${local.name_prefix}-dead-letter"
  
  labels = local.default_labels
  
  message_retention_duration = "604800s" # 7 days
}

# Cloud Scheduler for periodic tasks
resource "google_cloud_scheduler_job" "model_cache_cleanup" {
  name     = "${local.name_prefix}-model-cache-cleanup"
  region   = local.region
  schedule = "0 2 * * *" # Daily at 2 AM
  
  pubsub_target {
    topic_name = google_pubsub_topic.multimedia_processing.id
    data       = base64encode(jsonencode({
      action = "cache_cleanup"
      type   = "model_cache"
    }))
  }
}

# IAM Service Accounts
resource "google_service_account" "gemini_flow_workload" {
  account_id   = "${local.name_prefix}-workload"
  display_name = "Gemini-Flow Workload Service Account"
  description  = "Service account for Gemini-Flow workloads"
}

resource "google_service_account" "gemini_flow_admin" {
  account_id   = "${local.name_prefix}-admin"
  display_name = "Gemini-Flow Admin Service Account"
  description  = "Service account for Gemini-Flow administrative tasks"
}

# IAM bindings for workload service account
resource "google_project_iam_member" "workload_vertex_ai" {
  project = local.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

resource "google_project_iam_member" "workload_storage_object_admin" {
  project = local.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

resource "google_project_iam_member" "workload_secret_accessor" {
  project = local.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

resource "google_project_iam_member" "workload_pubsub_publisher" {
  project = local.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

resource "google_project_iam_member" "workload_pubsub_subscriber" {
  project = local.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

resource "google_project_iam_member" "workload_monitoring_writer" {
  project = local.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

resource "google_project_iam_member" "workload_logging_writer" {
  project = local.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gemini_flow_workload.email}"
}

# Cloud Build trigger for CI/CD
resource "google_cloudbuild_trigger" "gemini_flow_deploy" {
  name        = "${local.name_prefix}-deploy"
  description = "Deploy Gemini-Flow application"
  
  github {
    owner = var.github_repo_owner
    name  = var.github_repo_name
    
    push {
      branch = var.deploy_branch
    }
  }
  
  filename = "infrastructure/cloudbuild/deploy.yaml"
  
  substitutions = {
    _ENVIRONMENT = var.environment
    _REGION      = local.region
    _PROJECT_ID  = local.project_id
  }
  
  service_account = google_service_account.gemini_flow_admin.id
}

# Monitoring workspace
resource "google_monitoring_notification_channel" "email" {
  count = length(var.notification_emails)
  
  display_name = "Email - ${var.notification_emails[count.index]}"
  type         = "email"
  
  labels = {
    email_address = var.notification_emails[count.index]
  }
}

# Alerting policies
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "${local.name_prefix} - High Error Rate"
  combiner     = "OR"
  
  conditions {
    display_name = "Error rate is high"
    
    condition_threshold {
      filter          = "resource.type=\"gke_container\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.1
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = google_monitoring_notification_channel.email[*].id
  
  alert_strategy {
    auto_close = "86400s" # 24 hours
  }
}

# Firewall rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${local.name_prefix}-allow-internal"
  network = google_compute_network.vpc.name
  
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  
  allow {
    protocol = "icmp"
  }
  
  source_ranges = [var.gke_subnet_cidr, var.gke_pod_cidr, var.gke_service_cidr]
  target_tags   = ["gemini-flow"]
}

resource "google_compute_firewall" "allow_health_checks" {
  name    = "${local.name_prefix}-allow-health-checks"
  network = google_compute_network.vpc.name
  
  allow {
    protocol = "tcp"
    ports    = ["8080", "9090", "15090"]
  }
  
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["gemini-flow", "load-balancer-backend"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "${local.name_prefix}-allow-ssh"
  network = google_compute_network.vpc.name
  
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  
  source_ranges = var.allowed_ssh_ranges
  target_tags   = ["ssh-access"]
}

# Output values
output "vpc_id" {
  description = "The ID of the VPC network"
  value       = google_compute_network.vpc.id
}

output "vpc_name" {
  description = "The name of the VPC network"
  value       = google_compute_network.vpc.name
}

output "gke_subnet_name" {
  description = "The name of the GKE subnet"
  value       = google_compute_subnetwork.gke_subnet.name
}

output "multimedia_storage_bucket" {
  description = "The name of the multimedia storage bucket"
  value       = google_storage_bucket.multimedia_storage.name
}

output "model_cache_bucket" {
  description = "The name of the model cache bucket"
  value       = google_storage_bucket.model_cache.name
}

output "backup_storage_bucket" {
  description = "The name of the backup storage bucket"
  value       = google_storage_bucket.backup_storage.name
}

output "artifact_registry_url" {
  description = "The URL of the Artifact Registry"
  value       = "${local.region}-docker.pkg.dev/${local.project_id}/${google_artifact_registry_repository.gemini_flow.repository_id}"
}

output "workload_service_account_email" {
  description = "The email of the workload service account"
  value       = google_service_account.gemini_flow_workload.email
}

output "admin_service_account_email" {
  description = "The email of the admin service account"
  value       = google_service_account.gemini_flow_admin.email
}

output "redis_host" {
  description = "The IP address of the Redis instance"
  value       = var.enable_redis ? google_redis_instance.cache[0].host : null
}

output "redis_port" {
  description = "The port of the Redis instance"
  value       = var.enable_redis ? google_redis_instance.cache[0].port : null
}

output "postgres_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = var.enable_cloud_sql ? google_sql_database_instance.postgres[0].connection_name : null
}

output "postgres_private_ip" {
  description = "The private IP address of the Cloud SQL instance"
  value       = var.enable_cloud_sql ? google_sql_database_instance.postgres[0].private_ip_address : null
}

output "pubsub_topics" {
  description = "Map of Pub/Sub topic names"
  value = {
    multimedia_processing = google_pubsub_topic.multimedia_processing.name
    model_inference      = google_pubsub_topic.model_inference.name
    dead_letter         = google_pubsub_topic.dead_letter.name
  }
}

output "secret_ids" {
  description = "Map of Secret Manager secret IDs"
  value = {
    api_keys            = google_secret_manager_secret.api_keys.secret_id
    database_credentials = google_secret_manager_secret.database_credentials.secret_id
    oauth_credentials   = google_secret_manager_secret.oauth_credentials.secret_id
  }
}

output "project_id" {
  description = "The GCP project ID"
  value       = local.project_id
}

output "region" {
  description = "The GCP region"
  value       = local.region
}

output "zone" {
  description = "The GCP zone"
  value       = local.zone
}