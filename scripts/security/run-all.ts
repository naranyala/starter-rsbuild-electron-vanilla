#!/usr/bin/env bun
/**
 * Run All Security Checks
 * Executes all security-related scripts in the proper sequence
 */

import { execSync } from 'child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SecurityCheck {
  name: string;
  script: string;
  description: string;
  required: boolean;
}

async function runSecurityCheck(name: string, command: string, description: string): Promise<boolean> {
  console.log(`\n\x1b[33m[CHECK]\x1b[0m ${name}`);
  console.log(`\x1b[36m[DESC]\x1b[0m ${description}`);
  console.log(`\x1b[36m[CMD]\x1b[0m ${command}`);

  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: join(__dirname, '../..'), // Go up two levels to project root
      encoding: 'utf-8',
    });

    console.log(`\x1b[32m[PASS]\x1b[0m ${name} completed successfully`);
    return true;
  } catch (error) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${name} failed`);
    return false;
  }
}

async function main() {
  console.log('\x1b[35m' + '='.repeat(70));
  console.log('RUNNING ALL SECURITY CHECKS');
  console.log('='.repeat(70) + '\x1b[0m');
  
  const startTime = Date.now();
  
  const securityChecks: SecurityCheck[] = [
    {
      name: 'Code Security Audit',
      script: 'bun run scripts/security/audit.ts',
      description: 'Performs comprehensive code security audit',
      required: true
    },
    {
      name: 'Dependency Vulnerability Scan',
      script: 'bun run scripts/security/dependency-audit.ts',
      description: 'Scans dependencies for known vulnerabilities',
      required: true
    },
    {
      name: 'Security Lint',
      script: 'bun run scripts/security/lint.ts',
      description: 'Runs quick security lint checks',
      required: true
    },
    {
      name: 'Security Tests',
      script: 'bun test tests/security/',
      description: 'Runs security-specific tests',
      required: true
    },
    {
      name: 'Generate Security Report',
      script: 'bun run scripts/security/report-generator.ts',
      description: 'Generates comprehensive security report',
      required: false
    }
  ];
  
  let allPassed = true;
  const results: { name: string; passed: boolean }[] = [];
  
  for (const check of securityChecks) {
    const passed = await runSecurityCheck(check.name, check.script, check.description);
    results.push({ name: check.name, passed });
    
    if (!passed && check.required) {
      allPassed = false;
      console.log(`\x1b[31m[STOP]\x1b[0m Stopping due to required check failure: ${check.name}`);
      break;
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n\x1b[35m' + '='.repeat(70));
  console.log('SECURITY CHECK SUMMARY');
  console.log('='.repeat(70) + '\x1b[0m');
  
  results.forEach(result => {
    const status = result.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`  ${status} ${result.name}`);
  });
  
  console.log(`\nDuration: ${duration}s`);
  console.log(`Checks: ${results.length}, Passed: ${results.filter(r => r.passed).length}, Failed: ${results.filter(r => !r.passed).length}`);
  
  if (allPassed) {
    console.log('\n\x1b[32m🎉 ALL SECURITY CHECKS PASSED!\x1b[0m');
    console.log('\x1b[36mApplication is secure and ready for deployment.\x1b[0m');
    process.exit(0);
  } else {
    console.log('\n\x1b[31m❌ SOME SECURITY CHECKS FAILED!\x1b[0m');
    console.log('\x1b[33mPlease address the failing checks before deployment.\x1b[0m');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Security check runner failed:', error);
  process.exit(1);
});