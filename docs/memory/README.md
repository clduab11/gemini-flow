# Memory Management Documentation

This directory contains documentation for the Gemini Flow memory and persistence systems.

## Contents

- [agents-README.md](./agents-README.md) - Agent-specific memory storage documentation
- [sessions-README.md](./sessions-README.md) - Session-based memory storage documentation

## Memory System Overview

Gemini Flow implements a sophisticated memory management system that provides:

1. **Agent Memory** - Persistent state for individual agents
2. **Session Memory** - Conversation and context persistence
3. **Shared Memory** - Cross-agent coordination data
4. **Knowledge Base** - Accumulated learning and patterns

## Architecture

The memory system uses SQLite for persistence with efficient caching and indexing for optimal performance. See the [implementation docs](../implementation/) for technical details.