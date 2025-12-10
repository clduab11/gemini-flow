python#!/usr/bin/env python3
"""
Auto Fixer - Automatically fixes detected issues.
"""
import subprocess
import json
import os
from pathlib import Path

class AutoFixer:
    def __init__(self):
        self.state = self._load_state()
        self.fixes_applied = []
        
    def _load_state(self):
        """Load state from verifier."""
        state_file = Path(".setup_state.json")
        if state_file.exists():
            return json.loads(state_file.read_text())
        return {"issues": []}
        
    def fix_all(self):
        """Apply all fixes."""
        for issue in self.state.get("issues", []):
            self._fix_issue(issue)
        self._update_state()
        
    def _fix_issue(self, issue):
        """Fix a specific issue."""
        fix_type = issue["type"]
        
        if fix_type == "missing_package":
            self._install_package(issue["package"])
        elif fix_type == "missing_directory":
            Path(issue["path"]).mkdir(parents=True, exist_ok=True)
            self.fixes_applied.append(f"Created {issue['path']}")
        elif fix_type in ["missing_database", "corrupt_database"]:
            self._init_database()
        elif fix_type == "missing_config":
            self._create_config(issue["config"])
            
    def _install_package(self, package):
        """Install missing package."""
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", package
            ], check=True, capture_output=True)
            self.fixes_applied.append(f"Installed {package}")
        except:
            print(f"Could not install {package}, skipping")
            
    def _init_database(self):
        """Initialize database."""
        try:
            import duckdb
            con = duckdb.connect("seo_analyst.db")
            if Path("data/schema.sql").exists():
                con.execute(Path("data/schema.sql").read_text())
            else:
                # Create minimal schema
                con.execute("""
                    CREATE TABLE IF NOT EXISTS backlinks (
                        id INTEGER PRIMARY KEY,
                        src_url VARCHAR,
                        dst_url VARCHAR,
                        anchor_text VARCHAR
                    )
                """)
            con.close()
            self.fixes_applied.append("Initialized database")
        except Exception as e:
            print(f"Database init failed: {e}")
            
    def _create_config(self, config_type):
        """Create missing configuration files."""
        configs = {
            "env": {
                "path": ".env",
                "content": """
# SEO Analyst Configuration
API_PORT=8000
DB_PATH=seo_analyst.db
LOG_LEVEL=INFO
CACHE_ENABLED=true
"""
            },
            "logging": {
                "path": "config/logging.yaml",
                "content": """
version: 1
handlers:
  file:
    class: logging.FileHandler
    filename: logs/app.log
root:
  level: INFO
  handlers: [file]
"""
            }
        }
        
        if config_type in configs:
            cfg = configs[config_type]
            Path(cfg["path"]).parent.mkdir(exist_ok=True)
            Path(cfg["path"]).write_text(cfg["content"])
            self.fixes_applied.append(f"Created {cfg['path']}")
            
    def _update_state(self):
        """Update state file."""
        self.state["fixes_applied"] = self.fixes_applied
        Path(".setup_state.json").write_text(
            json.dumps(self.state, indent=2)
        )

if __name__ == "__main__":
    fixer = AutoFixer()
    fixer.fix_all()