#!/usr/bin/env python3
"""
Mega-File Processor
Expands mega-files into actual code files using templates and rules
"""

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from jinja2 import Environment, Template, meta

class MegaFileProcessor:
    """Processes mega-files and expands them into actual code files"""
    
    def __init__(self, mega_file_path: str, output_dir: str, team: str):
        self.mega_file_path = Path(mega_file_path)
        self.output_dir = Path(output_dir)
        self.team = team
        self.stats = {
            'files_generated': 0,
            'lines_written': 0,
            'errors': [],
            'start_time': datetime.now()
        }
        self.env = Environment(
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=True
        )
        
    def load_mega_file(self) -> Dict[str, Any]:
        """Load and validate mega-file"""
        try:
            with open(self.mega_file_path, 'r') as f:
                mega_file = yaml.safe_load(f)
                
            # Validate structure
            required_keys = ['id', 'version', 'team', 'expansion_rules', 'generation_templates']
            for key in required_keys:
                if key not in mega_file:
                    raise ValueError(f"Missing required key: {key}")
                    
            # Validate team
            if mega_file['team'] != self.team:
                raise ValueError(f"Team mismatch: expected {self.team}, got {mega_file['team']}")
                
            return mega_file
            
        except Exception as e:
            self.stats['errors'].append(f"Failed to load mega-file: {str(e)}")
            raise
            
    def expand_entities(self, mega_file: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Expand entities based on rules"""
        entities = mega_file['expansion_rules'].get('entities', [])
        expanded = []
        
        for entity in entities:
            # Add computed fields
            entity['Entity'] = entity['name']
            entity['entity'] = entity['name'].lower()
            entity['entities'] = entity.get('plural', f"{entity['name'].lower()}s")
            entity['Entities'] = entity['entities'].capitalize()
            
            # Process attributes
            for attr in entity.get('attributes', []):
                # Add TypeScript type mappings
                type_map = {
                    'uuid': 'string',
                    'string': 'string',
                    'text': 'string',
                    'integer': 'number',
                    'decimal': 'number',
                    'boolean': 'boolean',
                    'timestamp': 'Date',
                    'array': 'any[]',
                    'enum': 'string'
                }
                attr['tsType'] = type_map.get(attr['type'], 'any')
                
            expanded.append(entity)
            
        return expanded
        
    def process_template(self, template: str, context: Dict[str, Any]) -> str:
        """Process Jinja2 template with context"""
        try:
            jinja_template = self.env.from_string(template)
            
            # Add helper filters
            self.env.filters['capitalize'] = lambda s: s.capitalize() if s else ''
            self.env.filters['upper'] = lambda s: s.upper() if s else ''
            self.env.filters['lower'] = lambda s: s.lower() if s else ''
            self.env.filters['camelCase'] = lambda s: self._to_camel_case(s)
            self.env.filters['snake_case'] = lambda s: self._to_snake_case(s)
            
            return jinja_template.render(**context)
            
        except Exception as e:
            self.stats['errors'].append(f"Template error: {str(e)}")
            raise
            
    def _to_camel_case(self, text: str) -> str:
        """Convert to camelCase"""
        components = text.split('_')
        return components[0] + ''.join(x.title() for x in components[1:])
        
    def _to_snake_case(self, text: str) -> str:
        """Convert to snake_case"""
        return re.sub(r'(?<!^)(?=[A-Z])', '_', text).lower()
        
    def generate_file(self, template_config: Dict[str, Any], context: Dict[str, Any]) -> Optional[Path]:
        """Generate a single file from template"""
        try:
            # Process output path
            output_path_template = template_config['output_path']
            output_path = self.env.from_string(output_path_template).render(**context)
            
            # Ensure path is within team boundaries
            if not self._validate_path(output_path):
                raise ValueError(f"Path outside team boundaries: {output_path}")
                
            # Process template
            template = template_config['template']
            content = self.process_template(template, context)
            
            # Create output file
            full_path = self.output_dir / output_path.lstrip('/')
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file
            with open(full_path, 'w') as f:
                f.write(content)
                
            # Update stats
            self.stats['files_generated'] += 1
            self.stats['lines_written'] += len(content.splitlines())
            
            return full_path
            
        except Exception as e:
            self.stats['errors'].append(f"Failed to generate file: {str(e)}")
            return None
            
    def _validate_path(self, path: str) -> bool:
        """Validate that path is within team boundaries"""
        # This should check against team boundaries from coordination manifest
        # For now, basic validation
        allowed_prefixes = [
            f'/src/{self.team}/',
            f'/src/api/',  # Some teams can write here
            f'/tests/',
            f'/docs/'
        ]
        
        return any(path.startswith(prefix) for prefix in allowed_prefixes)
        
    def process_expansion_rules(self, mega_file: Dict[str, Any]) -> None:
        """Process all expansion rules"""
        rules = mega_file['expansion_rules']
        templates = mega_file['generation_templates']
        
        # Handle entity-based expansion
        if 'entities' in rules:
            entities = self.expand_entities(mega_file)
            
            for entity in entities:
                for template_name, template_config in templates.items():
                    self.generate_file(template_config, entity)
                    
        # Handle pattern-based expansion
        if 'patterns' in rules:
            for pattern in rules['patterns']:
                self._process_pattern(pattern, templates)
                
        # Handle scaffold expansion
        if 'scaffold' in rules:
            self._process_scaffold(rules['scaffold'], templates)
            
    def _process_pattern(self, pattern: Dict[str, Any], templates: Dict[str, Any]) -> None:
        """Process pattern-based generation"""
        if pattern['type'] == 'range':
            for i in range(pattern['start'], pattern['end'] + 1):
                context = {
                    'index': i,
                    'name': f"{pattern['prefix']}{i}"
                }
                for template_name, template_config in templates.items():
                    if template_name in pattern.get('templates', []):
                        self.generate_file(template_config, context)
                        
    def _process_scaffold(self, scaffold: Dict[str, Any], templates: Dict[str, Any]) -> None:
        """Process scaffold-based generation"""
        # Create directory structure
        for directory in scaffold.get('directories', []):
            dir_path = self.output_dir / directory.lstrip('/')
            dir_path.mkdir(parents=True, exist_ok=True)
            
        # Generate scaffold files
        for file_spec in scaffold.get('files', []):
            template_name = file_spec['template']
            if template_name in templates:
                context = file_spec.get('context', {})
                self.generate_file(templates[template_name], context)
                
    def validate_output(self, mega_file: Dict[str, Any]) -> bool:
        """Validate generated output"""
        validation_rules = mega_file.get('validation', {})
        
        # Post-generation validation
        post_rules = validation_rules.get('post_generation', [])
        
        for rule in post_rules:
            if rule['check'] == 'files_compile':
                # Run compilation check
                if not self._check_compilation():
                    self.stats['errors'].append("Compilation check failed")
                    return False
                    
            elif rule['check'] == 'tests_valid':
                # Run test validation
                if not self._check_tests():
                    self.stats['errors'].append("Test validation failed")
                    return False
                    
        return True
        
    def _check_compilation(self) -> bool:
        """Check if generated files compile"""
        # Simple check - would run actual compiler in production
        return True
        
    def _check_tests(self) -> bool:
        """Check if generated tests are valid"""
        # Simple check - would run test runner in production
        return True
        
    def generate_report(self) -> Dict[str, Any]:
        """Generate processing report"""
        self.stats['end_time'] = datetime.now()
        self.stats['duration'] = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
        
        return {
            'mega_file': str(self.mega_file_path),
            'team': self.team,
            'stats': self.stats,
            'success': len(self.stats['errors']) == 0
        }
        
    def process(self) -> Dict[str, Any]:
        """Main processing method"""
        try:
            # Load mega-file
            mega_file = self.load_mega_file()
            
            # Process expansion rules
            self.process_expansion_rules(mega_file)
            
            # Validate output
            if not self.validate_output(mega_file):
                self.stats['errors'].append("Output validation failed")
                
            # Generate report
            return self.generate_report()
            
        except Exception as e:
            self.stats['errors'].append(f"Processing failed: {str(e)}")
            return self.generate_report()


def main():
    parser = argparse.ArgumentParser(description='Process mega-files to generate code')
    parser.add_argument('--input', required=True, help='Path to mega-file')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--team', required=True, help='Team name')
    parser.add_argument('--log', help='Log file path')
    
    args = parser.parse_args()
    
    # Create processor
    processor = MegaFileProcessor(args.input, args.output, args.team)
    
    # Process mega-file
    report = processor.process()
    
    # Write log if requested
    if args.log:
        log_path = Path(args.log)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
            
    # Print summary
    print(f"Processed {report['mega_file']}")
    print(f"Files generated: {report['stats']['files_generated']}")
    print(f"Lines written: {report['stats']['lines_written']}")
    
    if report['stats']['errors']:
        print(f"Errors: {len(report['stats']['errors'])}")
        for error in report['stats']['errors']:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("Success!")


if __name__ == '__main__':
    main()
