#!/usr/bin/env bun
/**
 * Security Audit Script
 * Performs comprehensive security checks on the codebase
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SecurityIssue {
  file: string;
  line?: number;
  severity: 'high' | 'medium' | 'low' | 'info';
  message: string;
  category: string;
}

const issues: SecurityIssue[] = [];

function log(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  const colors = {
    info: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

function checkForSecrets(content: string, filePath: string) {
  const secretPatterns = [
    { pattern: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi, name: 'Potential API Key' },
    { pattern: /secret\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi, name: 'Potential Secret' },
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, name: 'Hardcoded Password' },
    { pattern: /token\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi, name: 'Potential Token' },
    { pattern: /private[_-]?key\s*[:=]\s*['"]/gi, name: 'Private Key' },
    { pattern: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/g, name: 'Private Key Block' },
  ];

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    secretPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          severity: 'high',
          message: `Found ${name} in code`,
          category: 'Secrets Management',
        });
      }
    });
  });
}

function checkForDangerousFunctions(content: string, filePath: string) {
  const dangerousPatterns = [
    { pattern: /\beval\s*\(/g, message: 'Use of eval() - dangerous', severity: 'high' },
    { pattern: /\bexec\s*\(/g, message: 'Use of exec() - potentially dangerous', severity: 'high' },
    {
      pattern: /\bexecSync\s*\(/g,
      message: 'Use of execSync() - potentially dangerous',
      severity: 'medium',
    },
    { pattern: /\.innerHTML\s*=/g, message: 'Use of innerHTML - XSS risk', severity: 'high' },
    { pattern: /\.outerHTML\s*=/g, message: 'Use of outerHTML - XSS risk', severity: 'high' },
    {
      pattern: /document\.write\s*\(/g,
      message: 'Use of document.write() - XSS risk',
      severity: 'high',
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      message: 'dangerouslySetInnerHTML usage - ensure sanitization',
      severity: 'medium',
    },
    {
      pattern: /innerText\s*=/g,
      message: 'Consider using textContent instead of innerText',
      severity: 'low',
    },
  ];

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    dangerousPatterns.forEach(({ pattern, message, severity }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          severity,
          message,
          category: 'Code Security',
        });
      }
    });
  });
}

function checkForInsecureProtocols(content: string, filePath: string) {
  const insecurePatterns = [
    { pattern: /http:\/\//g, message: 'Use of insecure HTTP protocol', severity: 'high' },
    { pattern: /ws:\/\//g, message: 'Use of insecure WebSocket protocol', severity: 'medium' },
  ];

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    insecurePatterns.forEach(({ pattern, message, severity }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          severity,
          message,
          category: 'Transport Security',
        });
      }
    });
  });
}

function checkPackageJson(filePath: string) {
  if (!existsSync(filePath)) return;

  try {
    const content = readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    if (pkg.scripts) {
      const dangerousScripts = ['eval', 'exec', 'spawn'];
      Object.entries(pkg.scripts).forEach(([name, script]) => {
        dangerousPatterns.forEach(({ pattern, message, severity }) => {
          if (pattern.test(script as string)) {
            issues.push({
              file: filePath,
              line: name.length + 2,
              severity,
              message: `Script '${name}': ${message}`,
              category: 'Package Security',
            });
          }
        });
      });
    }
  } catch (error) {
    log(`Failed to parse package.json: ${error}`, 'warning');
  }
}

function scanDirectory(dir: string, extensions: string[]) {
  const dangerousPatterns = [/\beval\s*\(/g, /\bexec\s*\(/g, /\.innerHTML\s*=/g, /http:\/\//g];

  function traverse(currentDir: string) {
    const entries = existsSync(currentDir) ? require('fs').readdirSync(currentDir) : [];

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = require('fs').statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          !entry.startsWith('.') &&
          entry !== 'node_modules' &&
          entry !== 'dist' &&
          entry !== 'build'
        ) {
          traverse(fullPath);
        }
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          checkForSecrets(content, fullPath);
          checkForDangerousFunctions(content, fullPath);
          checkForInsecureProtocols(content, fullPath);
        } catch (error) {
          log(`Failed to read ${fullPath}: ${error}`, 'warning');
        }
      }
    }
  }

  traverse(dir);
}

function generateReport() {
  const highIssues = issues.filter((i) => i.severity === 'high');
  const mediumIssues = issues.filter((i) => i.severity === 'medium');
  const lowIssues = issues.filter((i) => i.severity === 'low');

  console.log('\n' + '='.repeat(60));
  console.log('SECURITY AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal Issues Found: ${issues.length}`);
  console.log(`  - High: ${highIssues.length}`);
  console.log(`  - Medium: ${mediumIssues.length}`);
  console.log(`  - Low: ${lowIssues.length}`);

  if (highIssues.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('HIGH SEVERITY ISSUES:');
    console.log('-'.repeat(60));
    highIssues.forEach((issue) => {
      console.log(`\n[${issue.file}${issue.line ? `:${issue.line}` : ''}]`);
      console.log(`  Category: ${issue.category}`);
      console.log(`  Message: ${issue.message}`);
    });
  }

  if (mediumIssues.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('MEDIUM SEVERITY ISSUES:');
    console.log('-'.repeat(60));
    mediumIssues.slice(0, 10).forEach((issue) => {
      console.log(`  [${issue.file}${issue.line ? `:${issue.line}` : ''}] ${issue.message}`);
    });
    if (mediumIssues.length > 10) {
      console.log(`  ... and ${mediumIssues.length - 10} more`);
    }
  }

  const score = Math.max(
    0,
    100 - highIssues.length * 20 - mediumIssues.length * 5 - lowIssues.length * 1
  );
  console.log('\n' + '='.repeat(60));
  console.log(`SECURITY SCORE: ${score}/100`);
  console.log('='.repeat(60));

  return highIssues.length === 0;
}

async function main() {
  console.log('Starting Security Audit...\n');

  const projectRoot = join(__dirname, '../..');
  const srcDir = join(projectRoot, 'src');
  const packageJsonPath = join(projectRoot, 'package.json');

  log('Scanning for secrets...', 'info');
  scanDirectory(srcDir, ['.ts', '.js', '.tsx', '.jsx', '.json']);

  log('Checking package.json for dangerous scripts...', 'info');
  checkPackageJson(packageJsonPath);

  const passed = generateReport();

  if (!passed) {
    log('\nSecurity audit FAILED. Please review the issues above.', 'error');
    process.exit(1);
  } else {
    log('\nSecurity audit PASSED. No high-severity issues found.', 'info');
    process.exit(0);
  }
}

main().catch((error) => {
  log(`Audit failed: ${error}`, 'error');
  process.exit(1);
});
