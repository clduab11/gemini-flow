# Legacy Archive Inventory

## Complete Archive Contents

### 📁 .hive-mind/ (Distributed Coordination System)
```
.hive-mind/
├── config.json                    # Hive configuration
├── hive.db                        # Main coordination database
├── hive.db-shm                   # Shared memory file
├── hive.db-wal                   # Write-ahead log
├── memory.db                     # Memory management
└── sessions/
    ├── hive-mind-prompt-swarm-1754080677307-azu23tze3.txt
    ├── session-1754080677310-2m7gdi3cz-auto-save-1754080707312.json
    ├── hive-mind-prompt-swarm-1754081983462-u8ohklimp.txt
    └── session-1754081983463-bnk6hn10h-auto-save-1754082013464.json
```

### 📁 .swarm/ (Swarm Memory System)
```
.swarm/
├── memory.db                     # Swarm coordination database
├── memory.db-shm                # Shared memory file
└── memory.db-wal                # Write-ahead log
```

### 📁 .roo/ (Room-based Coordination)
```
.roo/
├── mcp.md                        # MCP protocol documentation
├── mcp-list.txt                  # MCP server list
├── rules-code/                   # Code generation rules
│   ├── rules.md
│   ├── tool_guidelines_index.md
│   ├── file_operations_guidelines.md
│   ├── insert_content.md
│   └── code_editing.md
├── rules-debug/                  # Debug mode rules
│   └── rules.md
├── rules-post-deployment-monitoring-mode/
│   └── rules.md
├── rules-refinement-optimization-mode/
│   └── rules.md
├── rules-sparc/                  # SPARC methodology rules
│   └── rules.md
├── rules-spec-pseudocode/        # Specification rules
│   └── rules.md
└── rules-tutorial/               # Tutorial rules
    └── rules.md
```

### 📁 .claude/ (Complete Claude Configuration)
```
.claude/
├── settings.json                 # Main settings
├── settings.local.json          # Local overrides
├── agents/                       # Agent definitions
│   ├── README.md
│   ├── MIGRATION_SUMMARY.md
│   ├── base-template-generator.md
│   ├── analysis/
│   ├── architecture/
│   ├── consensus/
│   ├── core/
│   ├── data/
│   ├── development/
│   ├── devops/
│   ├── documentation/
│   ├── github/
│   ├── hive-mind/
│   ├── optimization/
│   ├── sparc/
│   ├── specialized/
│   ├── testing/
│   └── workflow/
├── commands/                     # Command documentation
│   ├── analysis/
│   ├── automation/
│   ├── coordination/
│   ├── github/
│   ├── hooks/
│   ├── memory/
│   ├── monitoring/
│   ├── optimization/
│   ├── training/
│   └── workflows/
└── helpers/                      # Automation scripts
    ├── setup-mcp.sh
    ├── quick-start.sh
    ├── github-setup.sh
    ├── github-safe.js
    ├── standard-checkpoint-hooks.sh
    └── checkpoint-manager.sh
```

### 📄 Single Files
- `.roomodes` - Room mode configuration

## Archive Statistics

- **Total Files**: 100+ files
- **Database Files**: 6 SQLite databases (with WAL/SHM)
- **Configuration Files**: 15+ JSON/YAML configs
- **Documentation**: 50+ markdown files
- **Scripts**: 10+ shell/JavaScript automation scripts
- **Session Data**: Multiple session snapshots

## Migration Impact

- **Space Freed**: ~25MB removed from active codebase
- **Git History**: Preserved, now properly ignored
- **References**: All updated to gemini-flow
- **Functionality**: Core features preserved in new structure

## Recovery Instructions

To restore specific functionality from archive:

1. **Identify Component**: Locate in archive structure above
2. **Extract Configuration**: Copy relevant settings to `.gemini/`
3. **Update References**: Replace claude-flow → gemini-flow
4. **Test Compatibility**: Verify with current codebase
5. **Update Documentation**: Reflect changes in GEMINI.md

⚠️ **Warning**: Do not restore database files directly - schema may be incompatible