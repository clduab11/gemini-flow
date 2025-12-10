python#!/usr/bin/env python3
"""
Environment Verifier - Checks all dependencies and structure.
"""
import json
import importlib
import os
from pathlib import Path

class EnvironmentVerifier:
    def __init__(self):
        self.issues = []
        self.verified = {}
        
    def verify_all(self):
        """Run all verifications."""
        self.check_python_version()
        self.check_packages()
        self.check_directories()
        self.check_database()
        self.save_state()
        
    def check_python_version(self):
        """Verify Python 3.9+."""
        import sys
        if sys.version_info < (3, 9):
            self.issues.append({
                "type": "python_version",
                "issue": f"Python {sys.version} < 3.9",
                "fix": "upgrade_python"
            })
        self.verified["python"] = sys.version
        
    def check_packages(self):
        """Check all required packages."""
        required = {
            "core": ["fastapi", "duckdb", "polars", "requests"],
            "optional": ["sentence_transformers", "google.auth"],
            "extras": ["python-multipart", "aiofiles"]
        }
        
        for category, packages in required.items():
            for package in packages:
                try:
                    if package == "google.auth":
                        importlib.import_module("google.auth")
                    else:
                        importlib.import_module(package.replace("-", "_"))
                    self.verified[package] = "installed"
                except ImportError:
                    self.issues.append({
                        "type": "missing_package",
                        "package": package,
                        "category": category,
                        "fix": f"pip install {package}"
                    })
                    
    def check_directories(self):
        """Verify project structure."""
        required_dirs = [
            "app", "algos", "ingest/adapters", "data", "kb", 
            "outputs", "inputs", "tests", "logs", "cache"
        ]
        
        for dir_path in required_dirs:
            path = Path(dir_path)
            if not path.exists():
                self.issues.append({
                    "type": "missing_directory",
                    "path": dir_path,
                    "fix": f"mkdir -p {dir_path}"
                })
            self.verified[f"dir_{dir_path}"] = path.exists()
            
    def check_database(self):
        """Check if database is initialized."""
        db_path = Path("seo_analyst.db")
        if db_path.exists():
            try:
                import duckdb
                con = duckdb.connect(str(db_path))
                tables = con.execute(
                    "SELECT table_name FROM information_schema.tables"
                ).fetchall()
                self.verified["database"] = len(tables)
                con.close()
            except:
                self.issues.append({
                    "type": "corrupt_database",
                    "fix": "reinit_database"
                })
        else:
            self.issues.append({
                "type": "missing_database",
                "fix": "init_database"
            })
            
    def save_state(self):
        """Save verification state."""
        state = {
            "verified": self.verified,
            "issues": self.issues
        }
        
        Path(".setup_state.json").write_text(
            json.dumps(state, indent=2)
        )
        
        if self.issues:
            print(f"Found {len(self.issues)} issues to fix")

if __name__ == "__main__":
    verifier = EnvironmentVerifier()
    verifier.verify_all()