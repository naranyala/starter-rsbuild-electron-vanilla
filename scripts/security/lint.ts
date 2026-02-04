#!/usr/bin/env bun
/**
 * Security Lint Script
 * Performs quick security checks on the codebase
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning';
  pattern: RegExp;
  category: string;
}

class SecurityLinter {
  private rules: SecurityRule[] = [
    {
      id: 'SEC-EVAL-001',
      name: 'Use of eval()',
      description: 'eval() is dangerous and should be avoided',
      severity: 'error',
      pattern: /\beval\s*\(/g,
      category: 'Code Injection'
    },
    {
      id: 'SEC-EXEC-001',
      name: 'Use of exec()',
      description: 'exec() can lead to command injection',
      severity: 'error',
      pattern: /\bexec\s*\(/g,
      category: 'Command Injection'
    },
    {
      id: 'SEC-INNERHTML-001',
      name: 'Use of innerHTML',
      description: 'innerHTML can lead to XSS vulnerabilities',
      severity: 'error',
      pattern: /\.innerHTML\s*=/g,
      category: 'Cross-Site Scripting'
    },
    {
      id: 'SEC-HTTP-001',
      name: 'Insecure HTTP Protocol',
      description: 'Using HTTP instead of HTTPS can expose data',
      severity: 'warning',
      pattern: /http:\/\/[^s]/g,
      category: 'Transport Security'
    },
    {
      id: 'SEC-SECRET-001',
      name: 'Hardcoded Secrets',
      description: 'Hardcoded secrets in source code are a security risk',
      severity: 'error',
      pattern: /(?:password|secret|key|token)\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      category: 'Secrets Management'
    },
    {
      id: 'SEC-NODEINT-001',
      name: 'Node Integration Enabled',
      description: 'Node integration in renderer should be disabled',
      severity: 'error',
      pattern: /nodeIntegration:\s*true/g,
      category: 'Electron Security'
    },
    {
      id: 'SEC-CONTEXTISO-001',
      name: 'Context Isolation Disabled',
      description: 'Context isolation should be enabled for security',
      severity: 'warning',
      pattern: /contextIsolation:\s*false/g,
      category: 'Electron Security'
    }
  ];

  private issues: {
    file: string;
    line: number;
    rule: SecurityRule;
    match: string;
  }[] = [];

  async lintDirectory(dir: string, extensions: string[]): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    // Check if directory exists before trying to read it
    if (!fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'dist' &&
          entry.name !== 'build' &&
          entry.name !== 'reports'
        ) {
          await this.lintDirectory(fullPath, extensions);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        await this.lintFile(fullPath);
      }
    }
  }

  async lintFile(filePath: string): Promise<void> {
    if (!existsSync(filePath)) return;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const rule of this.rules) {
          const matches = line.match(rule.pattern);
          if (matches) {
            for (const match of matches) {
              this.issues.push({
                file: filePath,
                line: i + 1,
                rule,
                match
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
    }
  }

  generateReport(): void {
    const errors = this.issues.filter(issue => issue.rule.severity === 'error');
    const warnings = this.issues.filter(issue => issue.rule.severity === 'warning');
    
    console.log('\n\x1b[35m' + '='.repeat(60));
    console.log('SECURITY LINT REPORT');
    console.log('='.repeat(60) + '\x1b[0m');
    console.log(`Total Issues: ${this.issues.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}\n`);
    
    if (errors.length > 0) {
      console.log('\x1b[31m' + 'ERRORS:\x1b[0m');
      errors.forEach(issue => {
        console.log(`  \x1b[31m[ERROR]\x1b[0m ${issue.rule.id} - ${issue.rule.name}`);
        console.log(`         ${issue.rule.description}`);
        console.log(`         ${issue.file}:${issue.line} - ${issue.match.trim()}`);
        console.log(`         Category: ${issue.rule.category}\n`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\x1b[33m' + 'WARNINGS:\x1b[0m');
      warnings.forEach(issue => {
        console.log(`  \x1b[33m[WARN]\x1b[0m ${issue.rule.id} - ${issue.rule.name}`);
        console.log(`         ${issue.rule.description}`);
        console.log(`         ${issue.file}:${issue.line} - ${issue.match.trim()}`);
        console.log(`         Category: ${issue.rule.category}\n`);
      });
    }
    
    if (this.issues.length === 0) {
      console.log('\x1b[32m✓ No security issues found!\x1b[0m\n');
    }
    
    const score = Math.max(0, 100 - errors.length * 10 - warnings.length * 2);
    console.log(`\x1b[36mSecurity Score: ${score}/100\x1b[0m`);
  }

  hasErrors(): boolean {
    return this.issues.some(issue => issue.rule.severity === 'error');
  }
}

async function main() {
  console.log('\x1b[33m[INFO]\x1b[0m Starting security lint...\n');
  
  const projectRoot = join(__dirname, '..');
  const linter = new SecurityLinter();
  
  await linter.lintDirectory(join(projectRoot, 'src'), ['.ts', '.js', '.tsx', '.jsx']);
  await linter.lintDirectory(join(projectRoot, 'scripts'), ['.ts', '.js']);
  
  linter.generateReport();
  
  if (linter.hasErrors()) {
    console.log('\n\x1b[31m[ERROR]\x1b[0m Security lint failed due to errors');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m[SUCCESS]\x1b[0m Security lint passed');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Security lint failed:', error);
  process.exit(1);
});