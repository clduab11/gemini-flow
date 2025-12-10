#!/usr/bin/env python3
"""
Conflict Detector for LLM Bulk Orchestration
Identifies and helps resolve conflicts between team outputs
"""

import argparse
import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple

import yaml


class ConflictDetector:
    """Detects and analyzes conflicts in team-generated code"""
    
    def __init__(self, workspace: str, manifest_path: str = None):
        self.workspace = Path(workspace)
        self.manifest_path = Path(manifest_path) if manifest_path else None
        self.team_boundaries = self._load_team_boundaries()
        self.conflicts = []
        self.file_ownership = defaultdict(list)
        
    def _load_team_boundaries(self) -> Dict[str, Dict[str, List[str]]]:
        """Load team boundaries from coordination manifest"""
        if not self.manifest_path or not self.manifest_path.exists():
            return {}
            
        with open(self.manifest_path, 'r') as f:
            manifest = yaml.safe_load(f)
            
        boundaries = {}
        for team_name, team_config in manifest.get('teams', {}).items():
            boundaries[team_name] = {
                'write_paths': team_config.get('boundaries', {}).get('write_paths', []),
                'read_paths': team_config.get('boundaries', {}).get('read_paths', []),
                'forbidden_paths': team_config.get('boundaries', {}).get('forbidden_paths', [])
            }
            
        return boundaries
        
    def scan_workspace(self) -> Dict[str, List[str]]:
        """Scan workspace and map files to teams"""
        file_map = defaultdict(list)
        
        # Scan all source files
        for path in self.workspace.rglob('*'):
            if path.is_file() and not any(part.startswith('.') for part in path.parts):
                relative_path = path.relative_to(self.workspace)
                team = self._identify_team_for_file(str(relative_path))
                if team:
                    file_map[str(relative_path)].append(team)
                    
        return file_map
        
    def _identify_team_for_file(self, file_path: str) -> str:
        """Identify which team should own a file based on boundaries"""
        # Check git history or file metadata if available
        # For now, infer from path patterns
        
        for team, boundaries in self.team_boundaries.items():
            for write_path in boundaries['write_paths']:
                # Convert glob pattern to match
                if self._path_matches_pattern(file_path, write_path):
                    return team
                    
        return 'unknown'
        
    def _path_matches_pattern(self, path: str, pattern: str) -> bool:
        """Check if path matches a pattern (supports ** and *)"""
        import fnmatch
        
        # Normalize paths
        path = path.replace('\\', '/')
        pattern = pattern.replace('\\', '/').lstrip('/')
        
        # Direct match
        if fnmatch.fnmatch(path, pattern):
            return True
            
        # Check if path starts with pattern directory
        if pattern.endswith('/**'):
            prefix = pattern[:-3]
            if path.startswith(prefix):
                return True
                
        return False
        
    def detect_conflicts(self) -> List[Dict]:
        """Detect all types of conflicts"""
        conflicts = []
        
        # 1. File ownership conflicts
        file_map = self.scan_workspace()
        for file_path, teams in file_map.items():
            if len(teams) > 1:
                conflicts.append({
                    'type': 'ownership_conflict',
                    'severity': 'high',
                    'file': file_path,
                    'teams': teams,
                    'description': f"Multiple teams claiming ownership of {file_path}"
                })
                
        # 2. Boundary violations
        boundary_violations = self._check_boundary_violations()
        conflicts.extend(boundary_violations)
        
        # 3. Integration conflicts
        integration_conflicts = self._check_integration_conflicts()
        conflicts.extend(integration_conflicts)
        
        # 4. Dependency conflicts
        dependency_conflicts = self._check_dependency_conflicts()
        conflicts.extend(dependency_conflicts)
        
        self.conflicts = conflicts
        return conflicts
        
    def _check_boundary_violations(self) -> List[Dict]:
        """Check for boundary violations"""
        violations = []
        
        for team, boundaries in self.team_boundaries.items():
            team_dir = self.workspace / 'src' / team
            if not team_dir.exists():
                continue
                
            for file_path in team_dir.rglob('*'):
                if file_path.is_file():
                    relative_path = str(file_path.relative_to(self.workspace))
                    
                    # Check forbidden paths
                    for forbidden in boundaries['forbidden_paths']:
                        if self._path_matches_pattern(relative_path, forbidden):
                            violations.append({
                                'type': 'boundary_violation',
                                'severity': 'critical',
                                'team': team,
                                'file': relative_path,
                                'rule': f"Forbidden path: {forbidden}",
                                'description': f"Team {team} wrote to forbidden path"
                            })
                            
        return violations
        
    def _check_integration_conflicts(self) -> List[Dict]:
        """Check for integration-level conflicts"""
        conflicts = []
        
        # Check for duplicate class/function definitions
        definitions = defaultdict(list)
        
        for source_file in self.workspace.rglob('*.ts'):
            if source_file.is_file():
                content = source_file.read_text()
                
                # Simple pattern matching for class/function names
                import re
                
                # Find class definitions
                class_pattern = r'(?:export\s+)?class\s+(\w+)'
                for match in re.finditer(class_pattern, content):
                    class_name = match.group(1)
                    definitions[f"class:{class_name}"].append(str(source_file))
                    
                # Find function definitions
                func_pattern = r'(?:export\s+)?(?:async\s+)?function\s+(\w+)'
                for match in re.finditer(func_pattern, content):
                    func_name = match.group(1)
                    definitions[f"function:{func_name}"].append(str(source_file))
                    
        # Check for duplicates
        for definition, locations in definitions.items():
            if len(locations) > 1:
                conflicts.append({
                    'type': 'duplicate_definition',
                    'severity': 'high',
                    'definition': definition,
                    'locations': locations,
                    'description': f"Duplicate {definition} found in multiple files"
                })
                
        return conflicts
        
    def _check_dependency_conflicts(self) -> List[Dict]:
        """Check for dependency conflicts"""
        conflicts = []
        
        # Check for circular dependencies
        dependency_graph = self._build_dependency_graph()
        cycles = self._find_cycles(dependency_graph)
        
        for cycle in cycles:
            conflicts.append({
                'type': 'circular_dependency',
                'severity': 'high',
                'cycle': cycle,
                'description': f"Circular dependency detected: {' → '.join(cycle)}"
            })
            
        # Check for missing dependencies
        missing = self._find_missing_dependencies()
        for dep in missing:
            conflicts.append({
                'type': 'missing_dependency',
                'severity': 'medium',
                'file': dep['file'],
                'import': dep['import'],
                'description': f"Missing dependency: {dep['import']} in {dep['file']}"
            })
            
        return conflicts
        
    def _build_dependency_graph(self) -> Dict[str, Set[str]]:
        """Build dependency graph from imports"""
        graph = defaultdict(set)
        
        for source_file in self.workspace.rglob('*.ts'):
            if source_file.is_file():
                content = source_file.read_text()
                file_key = str(source_file.relative_to(self.workspace))
                
                # Find imports
                import re
                import_pattern = r'import\s+.*?\s+from\s+[\'"]([^\'"\n]+)[\'"]'
                
                for match in re.finditer(import_pattern, content):
                    import_path = match.group(1)
                    if import_path.startswith('.'):
                        # Relative import
                        resolved = self._resolve_import(source_file, import_path)
                        if resolved:
                            graph[file_key].add(resolved)
                            
        return graph
        
    def _resolve_import(self, from_file: Path, import_path: str) -> str:
        """Resolve relative import to absolute path"""
        try:
            base_dir = from_file.parent
            resolved = (base_dir / import_path).resolve()
            
            # Try with .ts extension
            if not resolved.exists():
                resolved = resolved.with_suffix('.ts')
                
            if resolved.exists():
                return str(resolved.relative_to(self.workspace))
                
        except Exception:
            pass
            
        return None
        
    def _find_cycles(self, graph: Dict[str, Set[str]]) -> List[List[str]]:
        """Find cycles in dependency graph using DFS"""
        cycles = []
        visited = set()
        rec_stack = set()
        
        def dfs(node, path):
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor, path):
                        return True
                elif neighbor in rec_stack:
                    # Found cycle
                    cycle_start = path.index(neighbor)
                    cycle = path[cycle_start:] + [neighbor]
                    cycles.append(cycle)
                    return True
                    
            path.pop()
            rec_stack.remove(node)
            return False
            
        for node in graph:
            if node not in visited:
                dfs(node, [])
                
        return cycles
        
    def _find_missing_dependencies(self) -> List[Dict]:
        """Find imports that can't be resolved"""
        missing = []
        
        for source_file in self.workspace.rglob('*.ts'):
            if source_file.is_file():
                content = source_file.read_text()
                
                import re
                import_pattern = r'import\s+.*?\s+from\s+[\'"]([^\'"\n]+)[\'"]'
                
                for match in re.finditer(import_pattern, content):
                    import_path = match.group(1)
                    
                    if import_path.startswith('.'):
                        resolved = self._resolve_import(source_file, import_path)
                        if not resolved:
                            missing.append({
                                'file': str(source_file.relative_to(self.workspace)),
                                'import': import_path
                            })
                            
        return missing
        
    def generate_resolution_suggestions(self) -> List[Dict]:
        """Generate suggestions for resolving conflicts"""
        suggestions = []
        
        for conflict in self.conflicts:
            if conflict['type'] == 'ownership_conflict':
                # Suggest based on team boundaries
                correct_owner = self._determine_correct_owner(conflict['file'])
                suggestions.append({
                    'conflict': conflict,
                    'action': 'reassign_ownership',
                    'suggestion': f"Assign {conflict['file']} to team {correct_owner}",
                    'commands': [
                        f"git mv {conflict['file']} src/{correct_owner}/"
                    ]
                })
                
            elif conflict['type'] == 'duplicate_definition':
                # Suggest renaming or consolidation
                suggestions.append({
                    'conflict': conflict,
                    'action': 'consolidate',
                    'suggestion': f"Consolidate {conflict['definition']} into single location",
                    'commands': [
                        f"# Option 1: Keep in {conflict['locations'][0]}, remove from others",
                        f"# Option 2: Create shared module in src/shared/"
                    ]
                })
                
            elif conflict['type'] == 'circular_dependency':
                # Suggest refactoring
                suggestions.append({
                    'conflict': conflict,
                    'action': 'refactor',
                    'suggestion': "Break circular dependency by extracting shared interface",
                    'commands': [
                        "# Create interface file in src/shared/interfaces/",
                        "# Update imports to use interface instead of concrete implementation"
                    ]
                })
                
        return suggestions
        
    def _determine_correct_owner(self, file_path: str) -> str:
        """Determine correct owner based on boundaries and patterns"""
        scores = {}
        
        for team, boundaries in self.team_boundaries.items():
            score = 0
            
            # Check write paths
            for write_path in boundaries['write_paths']:
                if self._path_matches_pattern(file_path, write_path):
                    score += 10
                    
            # Penalize if in forbidden paths
            for forbidden_path in boundaries['forbidden_paths']:
                if self._path_matches_pattern(file_path, forbidden_path):
                    score -= 20
                    
            scores[team] = score
            
        # Return team with highest score
        if scores:
            return max(scores, key=scores.get)
            
        return 'shared'
        
    def generate_report(self, output_path: str = None) -> Dict:
        """Generate comprehensive conflict report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'workspace': str(self.workspace),
            'summary': {
                'total_conflicts': len(self.conflicts),
                'critical': len([c for c in self.conflicts if c.get('severity') == 'critical']),
                'high': len([c for c in self.conflicts if c.get('severity') == 'high']),
                'medium': len([c for c in self.conflicts if c.get('severity') == 'medium']),
                'low': len([c for c in self.conflicts if c.get('severity') == 'low'])
            },
            'conflicts': self.conflicts,
            'resolutions': self.generate_resolution_suggestions()
        }
        
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
                
        return report
        
    def auto_fix(self, dry_run: bool = True) -> List[Dict]:
        """Attempt to automatically fix certain conflicts"""
        fixes = []
        
        for suggestion in self.generate_resolution_suggestions():
            conflict = suggestion['conflict']
            
            if conflict['type'] == 'ownership_conflict' and conflict['severity'] != 'critical':
                if not dry_run:
                    # Implement auto-fix
                    pass
                    
                fixes.append({
                    'conflict': conflict,
                    'action': 'auto-fixed' if not dry_run else 'would-fix',
                    'details': suggestion['suggestion']
                })
                
        return fixes


def main():
    parser = argparse.ArgumentParser(description='Detect conflicts in team-generated code')
    parser.add_argument('--workspace', required=True, help='Project workspace directory')
    parser.add_argument('--manifest', help='Team coordination manifest path')
    parser.add_argument('--report', help='Output report file path')
    parser.add_argument('--fix', action='store_true', help='Attempt auto-fix')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be fixed')
    
    args = parser.parse_args()
    
    # Create detector
    detector = ConflictDetector(args.workspace, args.manifest)
    
    # Detect conflicts
    print("Scanning for conflicts...")
    conflicts = detector.detect_conflicts()
    
    print(f"\nFound {len(conflicts)} conflicts:")
    
    # Group by type
    by_type = defaultdict(list)
    for conflict in conflicts:
        by_type[conflict['type']].append(conflict)
        
    for conflict_type, items in by_type.items():
        print(f"\n{conflict_type}: {len(items)}")
        for item in items[:3]:  # Show first 3
            print(f"  - {item['description']}")
        if len(items) > 3:
            print(f"  ... and {len(items) - 3} more")
            
    # Generate report
    report = detector.generate_report(args.report)
    
    if args.report:
        print(f"\nDetailed report saved to: {args.report}")
        
    # Auto-fix if requested
    if args.fix or args.dry_run:
        print("\nAttempting auto-fixes...")
        fixes = detector.auto_fix(dry_run=args.dry_run)
        
        for fix in fixes:
            print(f"  {fix['action']}: {fix['details']}")
            
    # Exit with error if critical conflicts
    critical_count = len([c for c in conflicts if c.get('severity') == 'critical'])
    if critical_count > 0:
        print(f"\n❌ {critical_count} critical conflicts must be resolved manually!")
        exit(1)
    else:
        print("\n✅ No critical conflicts found")


if __name__ == '__main__':
    main()
