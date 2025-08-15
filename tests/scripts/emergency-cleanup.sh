#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuration
PACKAGE_NAME="@clduab11/gemini-flow"
BINARY_NAME="gemini-flow"

# Function to force remove global package
cleanup_global_package() {
    log_info "Removing global package installation..."
    
    # Try normal uninstall first
    if npm uninstall -g "$PACKAGE_NAME" --silent 2>/dev/null; then
        log_success "Package uninstalled normally"
    else
        log_warning "Normal uninstall failed, attempting force removal..."
        
        # Force uninstall
        npm uninstall -g "$PACKAGE_NAME" --force --silent 2>/dev/null || log_warning "Force uninstall failed"
    fi
    
    # Manual cleanup of package directory
    local global_dir=$(npm prefix -g 2>/dev/null)
    if [ -n "$global_dir" ]; then
        local package_dir="$global_dir/lib/node_modules/@clduab11"
        local binary_path="$global_dir/bin/$BINARY_NAME"
        
        if [ -d "$package_dir" ]; then
            log_info "Manually removing package directory: $package_dir"
            rm -rf "$package_dir" || log_warning "Failed to remove package directory"
        fi
        
        if [ -f "$binary_path" ] || [ -L "$binary_path" ]; then
            log_info "Manually removing binary: $binary_path"
            rm -f "$binary_path" || log_warning "Failed to remove binary"
        fi
    fi
}

# Function to clean npm cache
cleanup_npm_cache() {
    log_info "Cleaning npm cache..."
    
    # Clean general cache
    if npm cache clean --force 2>/dev/null; then
        log_success "NPM cache cleaned"
    else
        log_warning "Failed to clean npm cache"
    fi
    
    # Clean specific package cache if possible
    npm cache clean "$PACKAGE_NAME" --force 2>/dev/null || true
}

# Function to clean npm configuration
cleanup_npm_config() {
    log_info "Cleaning npm configuration..."
    
    # Remove any package-specific registry settings
    npm config delete "@clduab11:registry" 2>/dev/null || true
    
    # Remove any auth tokens for the package scope
    npm config delete "//registry.npmjs.org/:_authToken" 2>/dev/null || true
    
    log_info "NPM configuration cleaned"
}

# Function to terminate hanging processes
cleanup_processes() {
    log_info "Checking for hanging processes..."
    
    # Find processes containing the binary name
    local processes=$(ps aux | grep -i "$BINARY_NAME" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$processes" ]; then
        log_warning "Found hanging processes, terminating..."
        
        # First try SIGTERM
        for pid in $processes; do
            if kill -TERM "$pid" 2>/dev/null; then
                log_info "Sent SIGTERM to process $pid"
            fi
        done
        
        # Wait a moment
        sleep 3
        
        # Check if processes are still running and force kill
        local remaining=$(ps aux | grep -i "$BINARY_NAME" | grep -v grep | awk '{print $2}' || true)
        if [ -n "$remaining" ]; then
            log_warning "Force killing remaining processes..."
            for pid in $remaining; do
                if kill -KILL "$pid" 2>/dev/null; then
                    log_info "Force killed process $pid"
                fi
            done
        fi
    else
        log_success "No hanging processes found"
    fi
}

# Function to clean temporary files
cleanup_temp_files() {
    log_info "Cleaning temporary files..."
    
    # Clean common temp directories
    local temp_dirs=(
        "/tmp/gemini-flow-*"
        "/tmp/npm-*"
        "$HOME/.npm/_cacache/content-*/*gemini-flow*"
    )
    
    for pattern in "${temp_dirs[@]}"; do
        if ls $pattern >/dev/null 2>&1; then
            log_info "Removing temporary files: $pattern"
            rm -rf $pattern || log_warning "Failed to remove: $pattern"
        fi
    done
    
    log_success "Temporary files cleaned"
}

# Function to verify cleanup
verify_cleanup() {
    log_info "Verifying cleanup..."
    
    local issues=0
    
    # Check if package is still globally installed
    if npm list -g "$PACKAGE_NAME" 2>/dev/null | grep -q "$PACKAGE_NAME"; then
        log_error "Package still appears in global list"
        ((issues++))
    else
        log_success "Package no longer in global list"
    fi
    
    # Check if binary is still in PATH
    if command -v "$BINARY_NAME" &> /dev/null; then
        log_error "Binary still found in PATH: $(which $BINARY_NAME)"
        ((issues++))
    else
        log_success "Binary no longer in PATH"
    fi
    
    # Check for leftover files
    local global_dir=$(npm prefix -g 2>/dev/null)
    if [ -n "$global_dir" ]; then
        local package_dir="$global_dir/lib/node_modules/@clduab11"
        if [ -d "$package_dir" ]; then
            log_error "Package directory still exists: $package_dir"
            ((issues++))
        else
            log_success "Package directory removed"
        fi
    fi
    
    # Check for hanging processes
    local processes=$(ps aux | grep -i "$BINARY_NAME" | grep -v grep | wc -l)
    if [ "$processes" -gt 0 ]; then
        log_error "Still found $processes hanging processes"
        ((issues++))
    else
        log_success "No hanging processes"
    fi
    
    return $issues
}

# Function to backup current state before cleanup
backup_state() {
    log_info "Backing up current state..."
    
    local backup_dir="/tmp/gemini-flow-cleanup-backup-$(date +%s)"
    mkdir -p "$backup_dir"
    
    # Backup npm list
    npm list -g > "$backup_dir/npm-global-list.txt" 2>&1 || true
    
    # Backup npm config
    npm config list > "$backup_dir/npm-config.txt" 2>&1 || true
    
    # Backup running processes
    ps aux | grep -i "gemini-flow" > "$backup_dir/processes.txt" 2>&1 || true
    
    log_info "State backed up to: $backup_dir"
    echo "$backup_dir"
}

# Function to show help
show_help() {
    echo "Emergency Cleanup Script for $PACKAGE_NAME"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --force     Skip confirmation prompts"
    echo "  --backup    Create backup before cleanup"
    echo "  --verify    Only verify current state, don't clean"
    echo "  --help      Show this help message"
    echo ""
    echo "This script will:"
    echo "  1. Remove global package installation"
    echo "  2. Clean npm cache and configuration"
    echo "  3. Terminate hanging processes"
    echo "  4. Remove temporary files"
    echo "  5. Verify cleanup completion"
}

# Main function
main() {
    local force_mode=false
    local backup_mode=false
    local verify_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_mode=true
                shift
                ;;
            --backup)
                backup_mode=true
                shift
                ;;
            --verify)
                verify_only=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "🧹 Emergency Cleanup Script for $PACKAGE_NAME"
    log_info "Date: $(date)"
    log_info "User: $(whoami)"
    log_info "Platform: $(uname -s)"
    
    # Verify only mode
    if [ "$verify_only" = true ]; then
        verify_cleanup
        if [ $? -eq 0 ]; then
            log_success "System is clean"
            exit 0
        else
            log_warning "Issues found, run cleanup without --verify to fix"
            exit 1
        fi
    fi
    
    # Backup if requested
    local backup_dir=""
    if [ "$backup_mode" = true ]; then
        backup_dir=$(backup_state)
    fi
    
    # Confirmation prompt unless in force mode
    if [ "$force_mode" = false ]; then
        echo ""
        log_warning "This will completely remove $PACKAGE_NAME and clean related files."
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Cleanup cancelled by user"
            exit 0
        fi
    fi
    
    log_info "Starting emergency cleanup..."
    
    # Execute cleanup steps
    cleanup_processes
    cleanup_global_package
    cleanup_npm_cache
    cleanup_npm_config
    cleanup_temp_files
    
    # Verify cleanup
    log_info "Verifying cleanup results..."
    if verify_cleanup; then
        log_success "✅ Emergency cleanup completed successfully"
        
        if [ -n "$backup_dir" ]; then
            log_info "Backup available at: $backup_dir"
        fi
        
        exit 0
    else
        log_error "❌ Cleanup completed with issues"
        log_info "You may need to manually remove remaining files or restart your terminal"
        
        if [ -n "$backup_dir" ]; then
            log_info "Backup available at: $backup_dir"
        fi
        
        exit 1
    fi
}

# Run main function with all arguments
main "$@"