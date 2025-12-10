#!/usr/bin/env python3
"""
Nexus Ideation Engine - Wizard Generator
Kör en interaktiv wizard baserad på wizard_schema.json och genererar ett projekt.
"""

import json
import os
import sys
import shutil
from pathlib import Path
from typing import Dict, Any

def load_wizard_schema(schema_path: str) -> Dict[str, Any]:
    """Laddar wizard_schema.json"""
    with open(schema_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_input(value: str, question: Dict[str, Any]) -> bool:
    """Validerar användarinput baserat på frågetyp"""
    if question.get('required', False) and not value.strip():
        return False
    
    if 'validation' in question:
        import re
        pattern = question['validation']
        if not re.match(pattern, value):
            return False
    
    return True

def ask_question(question: Dict[str, Any]) -> str:
    """Ställer en fråga till användaren och returnerar svaret"""
    label = question['label']
    default = question.get('default', '')
    help_text = question.get('help_text', '')
    placeholder = question.get('placeholder', '')
    
    # Visa frågan
    print(f"\n📌 {label}")
    if help_text:
        print(f"   💡 {help_text}")
    if placeholder:
        print(f"   Exempel: {placeholder}")
    if default:
        print(f"   Default: {default}")
    
    # Hantera olika frågetyper
    if question['type'] == 'select':
        print("\n   Alternativ:")
        for idx, option in enumerate(question['options'], 1):
            print(f"   {idx}. {option['label']}")
        
        while True:
            choice = input(f"   Välj (1-{len(question['options'])}): ").strip()
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(question['options']):
                    return question['options'][idx]['value']
            except ValueError:
                pass
            print("   ❌ Ogiltigt val, försök igen.")
    
    elif question['type'] == 'textarea':
        print("   (Skriv flera rader, avsluta med tom rad)")
        lines = []
        while True:
            line = input("   > ")
            if not line:
                break
            lines.append(line)
        value = '\n'.join(lines) or default
    
    else:  # text, password, number
        prompt = f"   Svar: "
        value = input(prompt).strip() or default
    
    # Validera
    if not validate_input(value, question):
        print(f"   ❌ Ogiltig input. {'Fältet är obligatoriskt.' if question.get('required') else 'Matchar inte valideringsmönstret.'}")
        return ask_question(question)  # Fråga igen
    
    return value

def run_wizard(schema: Dict[str, Any]) -> Dict[str, str]:
    """Kör wizarden och samlar in alla svar"""
    print("\n" + "="*60)
    print(f"🚀 {schema['wizard_metadata']['name']}")
    print(f"   {schema['wizard_metadata']['description']}")
    print(f"   Uppskattat tid: {schema['wizard_metadata']['estimated_setup_time']}")
    print("="*60)
    
    answers = {}
    
    for step in schema['steps']:
        print(f"\n\n{'='*60}")
        print(f"📋 STEG: {step['title']}")
        print("="*60)
        
        for question in step['questions']:
            var_name = question['var_name']
            answers[var_name] = ask_question(question)
    
    return answers

def replace_variables_in_content(content: str, answers: Dict[str, str]) -> str:
    """Ersätter alla {{VARIABEL}} i en sträng med värden från answers"""
    for var_name, value in answers.items():
        placeholder = f"{{{{{var_name}}}}}"
        content = content.replace(placeholder, value)
    return content

def generate_project(schema: Dict[str, Any], answers: Dict[str, str], output_dir: str):
    """Genererar projektfilerna baserat på template_files/ och answers"""
    
    project_name = answers.get('PROJECT_NAME', 'generated-project')
    project_path = Path(output_dir) / project_name
    
    # Skapa projektmapp
    project_path.mkdir(parents=True, exist_ok=True)
    
    print(f"\n\n{'='*60}")
    print(f"📦 GENERERAR PROJEKT: {project_name}")
    print(f"   Path: {project_path.absolute()}")
    print("="*60)
    
    # Hitta template_files mappen (i samma dir som detta script)
    script_dir = Path(__file__).parent
    template_dir = script_dir / "template_files"
    
    if not template_dir.exists():
        print(f"\n❌ ERROR: template_files/ hittades inte i {script_dir}")
        print("   Se till att alla template-filer ligger i en 'template_files/' mapp.")
        sys.exit(1)
    
    # Kopiera och ersätt variabler i alla filer
    files_created = 0
    for root, dirs, files in os.walk(template_dir):
        # Skapa motsvarande mappstruktur
        rel_path = Path(root).relative_to(template_dir)
        target_dir = project_path / rel_path
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for file in files:
            source_file = Path(root) / file
            target_file = target_dir / file
            
            # Läs innehåll
            with open(source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Ersätt variabler
            content = replace_variables_in_content(content, answers)
            
            # Skriv till target
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            files_created += 1
            print(f"   ✅ {rel_path / file}")
    
    # Kopiera .env.example till .env (men FYLL I den)
    env_example = project_path / ".env.example"
    env_file = project_path / ".env"
    if env_example.exists():
        with open(env_example, 'r') as f:
            env_content = f.read()
        env_content = replace_variables_in_content(env_content, answers)
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"   ✅ .env (genererad från .env.example)")
    
    print(f"\n✨ {files_created} filer skapade!")
    
    # Visa post-generation instruktioner
    print(f"\n\n{'='*60}")
    print("📝 NÄSTA STEG:")
    print("="*60)
    for idx, instruction in enumerate(schema.get('post_generation_instructions', []), 1):
        instruction = replace_variables_in_content(instruction, answers)
        print(f"{idx}. {instruction}")
    
    print(f"\n\n🎉 KLART! Ditt projekt '{project_name}' är redo att användas.")

def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_from_wizard.py <wizard_schema.json> [--output <dir>]")
        sys.exit(1)
    
    schema_path = sys.argv[1]
    output_dir = "."
    
    if "--output" in sys.argv:
        output_dir = sys.argv[sys.argv.index("--output") + 1]
    
    # Ladda wizard
    schema = load_wizard_schema(schema_path)
    
    # Kör interaktiv wizard
    answers = run_wizard(schema)
    
    # Generera projekt
    generate_project(schema, answers, output_dir)

if __name__ == "__main__":
    main()