/**
 * Execute Command Tests
 * 
 * Comprehensive tests for the execute command functionality
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ExecuteCommand } from '@/cli/commands/execute';
import { ConfigManager } from '@/cli/config/config-manager';
import { Logger } from '@/utils/logger';
import { writeFile, mkdir, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock external dependencies
jest.mock('../src/utils/logger');
jest.mock('../src/core/model-orchestrator');
jest.mock('../src/adapters/gemini-adapter');

describe('ExecuteCommand', () => {
  let executeCommand: ExecuteCommand;
  let configManager: ConfigManager;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), `gemini-flow-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Initialize command
    configManager = new ConfigManager();
    executeCommand = new ExecuteCommand(configManager);

    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await rmdir(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Framework Detection', () => {
    test('should detect FastAPI framework', async () => {
      // Create FastAPI project structure
      await writeFile(join(testDir, 'main.py'), 'from fastapi import FastAPI\napp = FastAPI()');
      await writeFile(join(testDir, 'requirements.txt'), 'fastapi\nuvicorn');

      // Test framework detection
      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.framework).toBe('fastapi');
    });

    test('should detect Next.js framework', async () => {
      // Create Next.js project structure
      await writeFile(join(testDir, 'next.config.js'), 'module.exports = {}');
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-app',
        dependencies: { 'next': '^13.0.0' }
      }));

      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.framework).toBe('nextjs');
    });

    test('should detect React framework', async () => {
      await mkdir(join(testDir, 'src'), { recursive: true });
      await writeFile(join(testDir, 'src', 'App.js'), 'import React from "react";');
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-app',
        dependencies: { 'react': '^18.0.0' }
      }));

      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.framework).toBe('react');
    });

    test('should detect Express framework', async () => {
      await writeFile(join(testDir, 'server.js'), 'const express = require("express");');
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-app',
        dependencies: { 'express': '^4.18.0' }
      }));

      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.framework).toBe('express');
    });

    test('should detect Django framework', async () => {
      await writeFile(join(testDir, 'manage.py'), '#!/usr/bin/env python');
      await writeFile(join(testDir, 'settings.py'), 'DEBUG = True');

      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.framework).toBe('django');
    });
  });

  describe('Test Framework Detection', () => {
    test('should detect pytest', async () => {
      await mkdir(join(testDir, 'tests'), { recursive: true });
      await writeFile(join(testDir, 'tests', 'test_main.py'), 'def test_example(): pass');

      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.testFramework).toBe('pytest');
    });

    test('should detect Jest', async () => {
      await writeFile(join(testDir, 'app.test.js'), 'test("example", () => {});');

      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.testFramework).toBe('jest');
    });
  });

  describe('Dependency Analysis', () => {
    test('should parse Python requirements.txt', async () => {
      await writeFile(join(testDir, 'requirements.txt'), 'fastapi==0.104.1\nuvicorn[standard]>=0.24.0\npydantic>=2.0.0');

      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'fastapi' });
      expect(context.dependencies).toContain('fastapi==0.104.1');
      expect(context.dependencies).toContain('uvicorn[standard]>=0.24.0');
      expect(context.dependencies).toContain('pydantic>=2.0.0');
    });

    test('should parse package.json dependencies', async () => {
      const packageJson = {
        name: 'test-app',
        dependencies: {
          'express': '^4.18.0',
          'cors': '^2.8.5'
        },
        devDependencies: {
          'nodemon': '^3.0.0'
        }
      };
      await writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'express' });
      expect(context.dependencies).toContain('express');
      expect(context.dependencies).toContain('cors');
      expect(context.dependencies).toContain('nodemon');
    });

    test('should parse pyproject.toml dependencies', async () => {
      const pyprojectToml = `[project]
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0"
]`;
      await writeFile(join(testDir, 'pyproject.toml'), pyprojectToml);

      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'fastapi' });
      expect(context.dependencies).toContain('fastapi>=0.104.0');
      expect(context.dependencies).toContain('uvicorn[standard]>=0.24.0');
    });
  });

  describe('File Scanning', () => {
    test('should scan Python files for FastAPI project', async () => {
      await writeFile(join(testDir, 'main.py'), 'from fastapi import FastAPI');
      await writeFile(join(testDir, 'models.py'), 'from pydantic import BaseModel');
      await mkdir(join(testDir, 'routers'), { recursive: true });
      await writeFile(join(testDir, 'routers', 'users.py'), 'from fastapi import APIRouter');

      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'fastapi' });
      
      const pyFiles = context.files.filter((f: string) => f.endsWith('.py'));
      expect(pyFiles.length).toBeGreaterThan(0);
      expect(pyFiles.some((f: string) => f.includes('main.py'))).toBe(true);
      expect(pyFiles.some((f: string) => f.includes('models.py'))).toBe(true);
      expect(pyFiles.some((f: string) => f.includes('users.py'))).toBe(true);
    });

    test('should scan JavaScript/TypeScript files for React project', async () => {
      await mkdir(join(testDir, 'src'), { recursive: true });
      await writeFile(join(testDir, 'src', 'App.js'), 'import React from "react";');
      await writeFile(join(testDir, 'src', 'index.js'), 'import ReactDOM from "react-dom";');
      await mkdir(join(testDir, 'src', 'components'), { recursive: true });
      await writeFile(join(testDir, 'src', 'components', 'Header.tsx'), 'export const Header = () => {};');

      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'react' });
      
      const jsFiles = context.files.filter((f: string) => f.match(/\.(js|jsx|ts|tsx)$/));
      expect(jsFiles.length).toBeGreaterThan(0);
      expect(jsFiles.some((f: string) => f.includes('App.js'))).toBe(true);
      expect(jsFiles.some((f: string) => f.includes('Header.tsx'))).toBe(true);
    });

    test('should ignore node_modules and hidden directories', async () => {
      await mkdir(join(testDir, 'node_modules'), { recursive: true });
      await writeFile(join(testDir, 'node_modules', 'package.js'), 'module.exports = {};');
      await mkdir(join(testDir, '.git'), { recursive: true });
      await writeFile(join(testDir, '.git', 'config'), '[core]');

      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'react' });
      
      expect(context.files.some((f: string) => f.includes('node_modules'))).toBe(false);
      expect(context.files.some((f: string) => f.includes('.git'))).toBe(false);
    });
  });

  describe('Environment Setup', () => {
    test('should set FastAPI environment variables', async () => {
      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'fastapi' });
      
      expect(context.environment.PYTHONPATH).toBe(process.cwd());
      expect(context.environment.FASTAPI_ENV).toBe('development');
    });

    test('should set Next.js environment variables', async () => {
      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'nextjs' });
      
      expect(context.environment.NODE_ENV).toBe('development');
      expect(context.environment.NEXT_TELEMETRY_DISABLED).toBe('1');
    });

    test('should set React environment variables', async () => {
      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'react' });
      
      expect(context.environment.NODE_ENV).toBe('development');
      expect(context.environment.REACT_APP_NODE_ENV).toBe('development');
    });

    test('should set Django environment variables', async () => {
      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'django' });
      
      expect(context.environment.DJANGO_SETTINGS_MODULE).toBe('settings');
      expect(context.environment.PYTHONPATH).toBe(process.cwd());
    });
  });

  describe('Execution Commands', () => {
    test('should generate correct FastAPI execution command', () => {
      const context = {
        framework: 'fastapi',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getExecutionCommand(context);
      expect(command.cmd).toBe('uvicorn');
      expect(command.args).toEqual(['main:app', '--reload']);
    });

    test('should generate correct Next.js execution command', () => {
      const context = {
        framework: 'nextjs',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getExecutionCommand(context);
      expect(command.cmd).toBe('npm');
      expect(command.args).toEqual(['run', 'dev']);
    });

    test('should generate correct Django execution command', () => {
      const context = {
        framework: 'django',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getExecutionCommand(context);
      expect(command.cmd).toBe('python');
      expect(command.args).toEqual(['manage.py', 'runserver']);
    });

    test('should generate correct Express execution command', () => {
      const context = {
        framework: 'express',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getExecutionCommand(context);
      expect(command.cmd).toBe('node');
      expect(command.args).toEqual(['server.js']);
    });
  });

  describe('Test Commands', () => {
    test('should generate correct pytest command', () => {
      const context = {
        testFramework: 'pytest',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getTestCommand(context);
      expect(command.cmd).toBe('pytest');
      expect(command.args).toEqual(['--cov=.', '--cov-report=term-missing']);
    });

    test('should generate correct Jest command', () => {
      const context = {
        testFramework: 'jest',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getTestCommand(context);
      expect(command.cmd).toBe('npm');
      expect(command.args).toEqual(['test', '--coverage']);
    });

    test('should generate correct Mocha command', () => {
      const context = {
        testFramework: 'mocha',
        workingDirectory: testDir,
        environment: {}
      };

      const command = (executeCommand as any).getTestCommand(context);
      expect(command.cmd).toBe('nyc');
      expect(command.args).toEqual(['mocha']);
    });
  });

  describe('Coverage Extraction', () => {
    test('should extract pytest coverage percentage', () => {
      const output = `
========================= test session starts =========================
collected 10 items

tests/test_main.py .......... [100%]

---------- coverage: platform linux, python 3.9.18-final-0 ----------
Name                 Stmts   Miss  Cover   Missing
--------------------------------------------------
main.py                 25      2    92%   45-46
models.py               15      0   100%
--------------------------------------------------
TOTAL                   40      2    95%
      `;

      const coverage = (executeCommand as any).extractCoverage(output, 'pytest');
      expect(coverage).toBe(95);
    });

    test('should extract Jest coverage percentage', () => {
      const output = `
 PASS  src/App.test.js
  ✓ renders learn react link (23ms)

----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------------------|---------|----------|---------|---------|-------------------
All files             |   88.24 |    75.00 |   85.71 |   87.50 |                   
 src                  |   88.24 |    75.00 |   85.71 |   87.50 |                   
  App.js              |   100.00|   100.00 |   100.00|   100.00|                   
  index.js            |   85.71 |    50.00 |   85.71 |   83.33 | 7,12              
----------------------|---------|----------|---------|---------|-------------------
      `;

      const coverage = (executeCommand as any).extractCoverage(output, 'jest');
      expect(coverage).toBe(88.24);
    });

    test('should return 0 for unknown test framework', () => {
      const output = 'Some test output';
      const coverage = (executeCommand as any).extractCoverage(output, 'unknown');
      expect(coverage).toBe(0);
    });

    test('should return 0 when no coverage pattern matches', () => {
      const output = 'Tests passed but no coverage info';
      const coverage = (executeCommand as any).extractCoverage(output, 'pytest');
      expect(coverage).toBe(0);
    });
  });

  describe('File Type Detection', () => {
    test('should identify relevant Python files for FastAPI', () => {
      expect((executeCommand as any).isRelevantFile('main.py', '.py', 'fastapi')).toBe(true);
      expect((executeCommand as any).isRelevantFile('models.py', '.py', 'fastapi')).toBe(true);
      expect((executeCommand as any).isRelevantFile('requirements.txt', '.txt', 'fastapi')).toBe(true);
      expect((executeCommand as any).isRelevantFile('config.yaml', '.yaml', 'fastapi')).toBe(true);
    });

    test('should identify relevant JavaScript/TypeScript files for React', () => {
      expect((executeCommand as any).isRelevantFile('App.js', '.js', 'react')).toBe(true);
      expect((executeCommand as any).isRelevantFile('Component.jsx', '.jsx', 'react')).toBe(true);
      expect((executeCommand as any).isRelevantFile('App.ts', '.ts', 'react')).toBe(true);
      expect((executeCommand as any).isRelevantFile('Component.tsx', '.tsx', 'react')).toBe(true);
      expect((executeCommand as any).isRelevantFile('package.json', '.json', 'react')).toBe(true);
    });

    test('should reject irrelevant files', () => {
      expect((executeCommand as any).isRelevantFile('data.csv', '.csv', 'fastapi')).toBe(false);
      expect((executeCommand as any).isRelevantFile('image.png', '.png', 'react')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing framework gracefully', async () => {
      // Create empty directory with no recognizable framework files
      const context = await (executeCommand as any).analyzeExecutionContext();
      expect(context.framework).toBeTruthy(); // Should fallback to user selection or default
    });

    test('should handle missing dependencies file gracefully', async () => {
      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'fastapi' });
      expect(context.dependencies).toEqual([]); // Should return empty array
    });

    test('should handle invalid JSON in package.json gracefully', async () => {
      await writeFile(join(testDir, 'package.json'), '{ invalid json }');
      
      const context = await (executeCommand as any).analyzeExecutionContext(undefined, { framework: 'react' });
      expect(context.dependencies).toEqual([]); // Should return empty array
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete FastAPI project analysis', async () => {
      // Create a complete FastAPI project structure
      await writeFile(join(testDir, 'main.py'), `
from fastapi import FastAPI
from routers import users

app = FastAPI()
app.include_router(users.router)
      `);
      
      await writeFile(join(testDir, 'requirements.txt'), `
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
pytest>=7.4.0
      `);
      
      await mkdir(join(testDir, 'routers'), { recursive: true });
      await writeFile(join(testDir, 'routers', '__init__.py'), '');
      await writeFile(join(testDir, 'routers', 'users.py'), `
from fastapi import APIRouter
router = APIRouter()

@router.get("/users")
async def get_users():
    return {"users": []}
      `);
      
      await mkdir(join(testDir, 'tests'), { recursive: true });
      await writeFile(join(testDir, 'tests', 'test_main.py'), `
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_users():
    response = client.get("/users")
    assert response.status_code == 200
      `);

      const context = await (executeCommand as any).analyzeExecutionContext();
      
      expect(context.framework).toBe('fastapi');
      expect(context.testFramework).toBe('pytest');
      expect(context.dependencies.length).toBeGreaterThan(0);
      expect(context.files.length).toBeGreaterThan(0);
      expect(context.environment.PYTHONPATH).toBe(process.cwd());
    });

    test('should handle complete React project analysis', async () => {
      // Create a complete React project structure
      await writeFile(join(testDir, 'package.json'), JSON.stringify({
        name: 'test-react-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@testing-library/react': '^13.4.0',
          '@testing-library/jest-dom': '^5.16.5'
        },
        scripts: {
          'start': 'react-scripts start',
          'test': 'react-scripts test'
        }
      }, null, 2));

      await mkdir(join(testDir, 'src'), { recursive: true });
      await writeFile(join(testDir, 'src', 'App.js'), `
import React from 'react';
import './App.css';

function App() {
  return <div className="App">Hello World</div>;
}

export default App;
      `);

      await writeFile(join(testDir, 'src', 'App.test.js'), `
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders hello world', () => {
  render(<App />);
  const linkElement = screen.getByText(/hello world/i);
  expect(linkElement).toBeInTheDocument();
});
      `);

      await mkdir(join(testDir, 'public'), { recursive: true });
      await writeFile(join(testDir, 'public', 'index.html'), `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
      `);

      const context = await (executeCommand as any).analyzeExecutionContext();
      
      expect(context.framework).toBe('react');
      expect(context.testFramework).toBe('jest');
      expect(context.dependencies).toContain('react');
      expect(context.dependencies).toContain('react-dom');
      expect(context.files.some((f: string) => f.includes('App.js'))).toBe(true);
      expect(context.environment.NODE_ENV).toBe('development');
      expect(context.environment.REACT_APP_NODE_ENV).toBe('development');
    });
  });
});