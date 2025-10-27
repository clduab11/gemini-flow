# Gemini Flow Super Terminal - TUI User Guide

**Version:** 1.0.0
**Sprint:** 5 - Enhanced TUI Development
**Framework:** Ink (React-based TUI)

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Navigation](#navigation)
4. [Screens Overview](#screens-overview)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Features](#features)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

The Gemini Flow Super Terminal TUI provides an interactive, visual interface for workflow management and system monitoring. Built on Sprint 4's production-ready infrastructure, the TUI offers comprehensive error handling, security, and logging while providing an intuitive keyboard-driven experience.

### Key Benefits

- **Interactive Workflow Management**: Create, edit, and monitor workflows visually
- **Real-time Monitoring**: Live execution tracking with log tailing
- **Keyboard Navigation**: Full keyboard-driven interface for efficiency
- **Production-Grade**: Built on Sprint 4's security and reliability features
- **Cross-Platform**: Works on Windows, macOS, and Linux

---

## Getting Started

### Launching TUI Mode

Launch the TUI using the `--tui` flag:

```bash
# Standard TUI mode
npm run super-terminal -- --tui

# TUI with debug mode
npm run super-terminal -- --tui --debug

# TUI with safe mode
npm run super-terminal -- --tui --safe-mode

# TUI with both modes
npm run super-terminal -- --tui --debug --safe-mode
```

### Short Flag

Use `-t` as a shorthand for `--tui`:

```bash
npm run super-terminal -- -t
```

### First Launch

On first launch, you'll see:
1. Loading screen with initialization steps
2. Dashboard view with system overview
3. Navigation menu on the right side

---

## Navigation

### Primary Navigation

The TUI uses a **screen-based navigation model**:

```
Dashboard (Home)
├── Workflow Builder
├── Execution Monitor
├── Configuration
└── Help
```

### Navigation Methods

1. **Menu Navigation** (Dashboard)
   - Use `↑/↓` arrows to navigate menu items
   - Press `Enter` to select
   - Press `1-5` for quick selection

2. **Keyboard Shortcuts** (Global)
   - `Esc`: Go back / Cancel
   - `Q`: Quit application (from Dashboard)
   - `Tab`: Toggle menu visibility

3. **Screen-Specific Shortcuts**
   - See [Keyboard Shortcuts](#keyboard-shortcuts) section

---

## Screens Overview

### 1. Dashboard

**Purpose**: System overview and quick navigation

**Display Elements**:
```
╔═══════════════════════════════════════════════════╗
║  GEMINI FLOW SUPER TERMINAL - DASHBOARD          ║
╚═══════════════════════════════════════════════════╝

Status Bar:
├─ Agents: 2        ├─ Uptime: 1h 23m
├─ Workflows: 1     ├─ Memory: 245MB
├─ Commands: 45     ├─ Logs: 2.3MB
└─ Errors: 0

Active Workflows Table:
┌────────────────────┬─────────────┬───────┬────────────┐
│ Name               │ Status      │ Nodes │ Progress   │
├────────────────────┼─────────────┼───────┼────────────┤
│ Data Pipeline      │ ● running   │ 12    │ 5/12       │
└────────────────────┴─────────────┴───────┴────────────┘

Recent Command History:
┌──────────────────┬────────┬──────────┬────────────┐
│ Command          │ Status │ Duration │ Time       │
├──────────────────┼────────┼──────────┼────────────┤
│ swarm spawn      │ ✓      │ 234ms    │ 14:23:45   │
└──────────────────┴────────┴──────────┴────────────┘

Navigation Menu:
[1] Workflow Builder
[2] Execution Monitor
[3] Configuration
[4] Help
[5] Exit
```

**Quick Actions**:
- Press `1` to create workflows
- Press `2` to monitor execution
- Press `3` to configure system
- Press `4` for help
- Press `5` or `Q` to exit

---

### 2. Workflow Builder

**Purpose**: Create and manage workflow definitions

**Features**:
- Create new workflows
- View workflow list
- Edit workflow nodes
- ASCII visualization of workflow graph
- Export/Import workflows (coming soon)

**Workflow Visualization Example**:
```
┌─────────────────────────────────────────┐
│  Workflow: Data Processing Pipeline     │
├─────────────────────────────────────────┤
│                                         │
│     ┌─────────┐                        │
│     │ Start   │                        │
│     └────┬────┘                        │
│          │                             │
│          ▼                             │
│     ┌─────────┐                        │
│     │ Node 1  │  12 nodes              │
│     └────┬────┘                        │
│          │                             │
│          ▼                             │
│     ┌─────────┐                        │
│     │  End    │                        │
│     └─────────┘                        │
│                                         │
└─────────────────────────────────────────┘
```

**Keyboard Shortcuts**:
- `Esc`: Back to menu
- `E`: Edit selected workflow
- `D`: Delete workflow
- `R`: Run workflow
- `Enter`: Select workflow

---

### 3. Execution Monitor

**Purpose**: Real-time workflow execution monitoring

**Display Elements**:
```
📊 Execution Monitor

Status: Running: 2  |  Log Lines: 145

Active Executions:
┌───────────────────────────────────────────┐
│ Data Pipeline - Step 5/12                │
│ ████████████████░░░░░░░░ 42%             │
└───────────────────────────────────────────┘

📜 Live Execution Logs:
[2025-10-27T20:15:32.123Z] INFO: Workflow started
[2025-10-27T20:15:33.456Z] INFO: Processing node 1
[2025-10-27T20:15:34.789Z] INFO: Node 1 completed
[2025-10-27T20:15:35.012Z] WARN: High memory usage detected
[2025-10-27T20:15:36.345Z] INFO: Processing node 2
```

**Features**:
- Real-time log tailing (refreshes every 500ms)
- Progress bars for running workflows
- Error highlighting (red color)
- Warning highlighting (yellow color)
- Last 20 log lines displayed

**Keyboard Shortcuts**:
- `Esc`: Back to dashboard
- `C`: Clear logs
- `P`: Pause execution

---

### 4. Configuration

**Purpose**: Manage system configuration

**Display Elements**:
```
⚙️  Configuration Management

Configuration Options:
[1] View Full Configuration
[2] Toggle Debug Mode (OFF)
[3] Toggle Safe Mode (OFF)
[4] Reset to Defaults
[5] Back to Dashboard

Current Mode: NORMAL

Status:
├─ Log Level: info
├─ Rate Limit: 60/min
└─ Timeout: 30000ms
```

**Interactive Configuration**:
- Press `D` to toggle Debug Mode
- Press `S` to toggle Safe Mode
- Changes take effect immediately
- Configuration persists to ~/.gemini-flow/config.json

**Keyboard Shortcuts**:
- `D`: Toggle debug mode
- `S`: Toggle safe mode
- `Esc`: Back to dashboard
- `1-5`: Quick select menu item

---

### 5. Help

**Purpose**: Keyboard shortcuts and usage guide

**Content**:
- Quick start guide
- Complete keyboard shortcuts reference
- Features overview
- Sprint 4 integration information

---

## Keyboard Shortcuts

### Global Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Esc` | Go back / Cancel | All screens |
| `Q` | Quit application | Dashboard only |
| `Tab` | Toggle menu | Dashboard |
| `↑` | Navigate up | Menus |
| `↓` | Navigate down | Menus |
| `Enter` | Select / Confirm | Menus |
| `1-9` | Quick select | Numbered menus |

### Dashboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Open Workflow Builder |
| `2` | Open Execution Monitor |
| `3` | Open Configuration |
| `4` | Open Help |
| `5` | Exit TUI |
| `Q` | Quick exit |
| `Tab` | Toggle navigation menu |

### Workflow Builder Shortcuts

| Key | Action |
|-----|--------|
| `E` | Edit workflow |
| `D` | Delete workflow |
| `R` | Run workflow |
| `Esc` | Back to menu/dashboard |

### Execution Monitor Shortcuts

| Key | Action |
|-----|--------|
| `C` | Clear logs |
| `P` | Pause execution |
| `Esc` | Back to dashboard |

### Configuration Shortcuts

| Key | Action |
|-----|--------|
| `D` | Toggle debug mode |
| `S` | Toggle safe mode |
| `Esc` | Back to dashboard |

---

## Features

### 1. Real-time Metrics

The TUI displays live system metrics:

- **Agent Count**: Number of active agents
- **Active Workflows**: Currently running workflows
- **Command Count**: Total commands executed
- **Error Count**: Number of errors encountered
- **Uptime**: System uptime
- **Memory Usage**: Current memory consumption
- **Log Size**: Total size of log files

Metrics refresh automatically based on configuration (default: 1000ms).

### 2. Workflow Management

**Create Workflows**:
1. Navigate to Workflow Builder
2. Select "Create New Workflow"
3. Enter workflow name
4. Press Enter to confirm

**View Workflows**:
1. Navigate to Workflow Builder
2. Select "View Workflows"
3. Browse workflow list
4. Select workflow to view details

**Execute Workflows**:
1. View workflow details
2. Press `R` to run
3. Navigate to Execution Monitor to watch progress

### 3. Live Log Monitoring

**Access Logs**:
1. Navigate to Execution Monitor
2. Logs display in real-time
3. Errors highlighted in red
4. Warnings highlighted in yellow

**Log Features**:
- Auto-refresh every 500ms
- Last 20 lines displayed
- Scrollable log history
- Color-coded log levels
- Timestamp display

### 4. Configuration Management

**View Configuration**:
1. Navigate to Configuration
2. Select "View Full Configuration"
3. Scroll through all settings

**Toggle Modes**:
- **Debug Mode**: Press `D`
  - Enables verbose logging
  - Shows stack traces
  - Performance timing
- **Safe Mode**: Press `S`
  - Enforces blocked commands
  - Additional security checks
  - Stricter validation

**Persistent Changes**:
All configuration changes are automatically saved to:
```
~/.gemini-flow/config.json
```

### 5. Sprint 4 Integration

The TUI is built on Sprint 4's production infrastructure:

- **Logger**: Structured logging with file rotation
- **Config**: Validated configuration management
- **Security**: Input sanitization and injection prevention
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breaker**: Automatic service protection
- **Error Handling**: Comprehensive try-catch blocks

---

## Configuration

### Environment Variables

Override configuration with environment variables:

```bash
# Debug mode
export SUPER_TERMINAL_DEBUG=true

# Safe mode
export SUPER_TERMINAL_SAFE_MODE=true

# Log level
export LOG_LEVEL=debug

# Custom Google AI endpoint
export GOOGLE_AI_ENDPOINT=https://custom-endpoint.com
```

### Configuration File

Location: `~/.gemini-flow/config.json`

**Key Settings**:
```json
{
  "metricsRefreshRateMs": 1000,
  "historySize": 1000,
  "logLevel": "info",
  "security": {
    "safeMode": false,
    "rateLimitPerMinute": 60,
    "operationTimeoutMs": 30000
  }
}
```

### TUI-Specific Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `metricsRefreshRateMs` | Metrics update frequency | 1000ms |
| `logLevel` | Log verbosity level | info |
| `security.safeMode` | Enable safe mode restrictions | false |
| `debugMode` | Enable debug mode | false |

---

## Troubleshooting

### Common Issues

**Issue: TUI doesn't start**
```bash
# Solution: Check logs
cat ~/.gemini-flow/logs/super-terminal.log | tail -20

# Solution: Try with debug mode
npm run super-terminal -- --tui --debug
```

**Issue: Keyboard shortcuts don't work**
```
# Solution: Ensure terminal supports ANSI escape codes
# Solution: Try a different terminal emulator
# Solution: Check terminal size (minimum 80x24)
```

**Issue: Metrics not updating**
```bash
# Solution: Check metricsRefreshRateMs in config
# Solution: Restart TUI
# Solution: Check for errors in logs
```

**Issue: Workflows don't appear**
```
# Solution: Create a workflow first
# Solution: Check logs for errors
# Solution: Verify workflow service is running
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
npm run super-terminal -- --tui --debug
```

Debug mode provides:
- Verbose logging
- Stack traces in errors
- Performance timing
- Detailed metric tracking

### Log Files

Check log files for detailed error information:

```bash
# View current logs
cat ~/.gemini-flow/logs/super-terminal.log

# Tail logs in real-time
tail -f ~/.gemini-flow/logs/super-terminal.log

# View with formatting
cat ~/.gemini-flow/logs/super-terminal.log | jq .

# Filter error logs
cat ~/.gemini-flow/logs/super-terminal.log | jq 'select(.level == "ERROR")'
```

### Terminal Requirements

Minimum requirements:
- Terminal size: 80x24 characters
- ANSI escape code support
- UTF-8 encoding
- Color support (256 colors recommended)

Tested terminals:
- ✅ iTerm2 (macOS)
- ✅ Terminal.app (macOS)
- ✅ GNOME Terminal (Linux)
- ✅ Windows Terminal (Windows)
- ✅ ConEmu (Windows)

---

## Advanced Usage

### Custom Workflows

Create complex workflows with multiple nodes:

1. Navigate to Workflow Builder
2. Create new workflow
3. Add nodes interactively (coming soon)
4. Connect nodes with edges (coming soon)
5. Save and execute

### Automation

The TUI can be automated using scripts:

```bash
# Example: Launch TUI and run specific workflow
echo "workflow run my-pipeline" | npm run super-terminal -- --tui
```

### Integration with React Flow

The TUI state management is designed to sync with the React Flow frontend Zustand store (integration coming in future sprints).

---

## Support

### Getting Help

- Press `4` or select "Help" from Dashboard menu
- View keyboard shortcuts reference
- Check this guide for detailed instructions

### Reporting Issues

If you encounter issues:
1. Enable debug mode
2. Reproduce the issue
3. Check logs at ~/.gemini-flow/logs/
4. Report with log excerpts

### Feature Requests

The TUI is actively developed. Future enhancements planned:
- Advanced workflow editing
- Export/Import workflows
- Custom themes
- Plugin system
- Zustand store integration

---

**Last Updated:** October 27, 2025
**Version:** 1.0.0
**Sprint:** 5
