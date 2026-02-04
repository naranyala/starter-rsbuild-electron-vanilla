#!/usr/bin/env bun
/**
 * Dependency Vulnerability Scanner
 * Scans package.json for known vulnerabilities using npm audit API
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Vulnerability {
  severity: 'critical' | 'high' | 'moderate' | 'low';
  package: string;
  vulnerableVersions: string;
  patchedIn?: string;
  description: string;
  recommendation?: string;
}

interface AuditResult {
  vulnerabilities: Vulnerability[];
  auditId: number;
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
  };
}

async function runNpmAudit(packageJsonPath: string): Promise<AuditResult | null> {
  try {
    const { execSync } = await import('child_process');
    const output = execSync(`npm audit --json`, {
      cwd: dirname(packageJsonPath),
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    const result = JSON.parse(output);
    return parseAuditResult(result);
  } catch (error: any) {
    if (error.stdout) {
      try {
        const result = JSON.parse(error.stdout);
        return parseAuditResult(result);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function parseAuditResult(auditData: any): AuditResult {
  const vulnerabilities: Vulnerability[] = [];

  if (auditData.vulnerabilities) {
    for (const [name, info] of Object.entries(auditData.vulnerabilities as Record<string, any>)) {
      vulnerabilities.push({
        severity: info.severity,
        package: name,
        vulnerableVersions: info.vulnerable_versions,
        patchedIn: info.patched_in_version,
        description: info.description || '',
        recommendation: getRecommendation(info.severity),
      });
    }
  }

  const summary = {
    critical: vulnerabilities.filter((v) => v.severity === 'critical').length,
    high: vulnerabilities.filter((v) => v.severity === 'high').length,
    moderate: vulnerabilities.filter((v) => v.severity === 'moderate').length,
    low: vulnerabilities.filter((v) => v.severity === 'low').length,
    info: 0,
  };

  return {
    vulnerabilities,
    auditId: auditData.audit_id || 0,
    summary,
  };
}

function getRecommendation(severity: string): string {
  const recommendations: Record<string, string> = {
    critical: 'URGENT: Update immediately or find alternative package',
    high: 'Update to patched version as soon as possible',
    moderate: 'Review and plan update in near-term release',
    low: 'Consider updating in next maintenance window',
  };
  return recommendations[severity] || 'Review and take appropriate action';
}

function log(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
  const colors: Record<string, string> = {
    info: '\x1b[36m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    success: '\x1b[32m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('DEPENDENCY VULNERABILITY SCANNER');
  console.log('='.repeat(60) + '\n');

  const projectRoot = join(__dirname, '../..');
  const packageJsonPath = join(projectRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    log('package.json not found!', 'error');
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    log(`Scanning ${packageJson.name}@${packageJson.version}`);
    log(`Found ${Object.keys(packageJson.dependencies || {}).length} dependencies`);
    log(`Found ${Object.keys(packageJson.devDependencies || {}).length} devDependencies\n`);

    log('Running npm audit...', 'info');
    const result = await runNpmAudit(packageJsonPath);

    if (!result) {
      log('Could not run npm audit. Checking npm availability...', 'warning');

      const { execSync } = await import('child_process');
      try {
        execSync('npm --version', { encoding: 'utf-8' });
        log('npm is available but audit failed. This may be due to network issues.', 'warning');
      } catch {
        log('npm is not available. Please install npm to run vulnerability scans.', 'error');
      }
    }

    if (result && result.vulnerabilities.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('VULNERABILITIES FOUND:');
      console.log('-'.repeat(60));
      console.log(`\nTotal: ${result.vulnerabilities.length} vulnerabilities`);
      console.log(`  Critical: ${result.summary.critical}`);
      console.log(`  High: ${result.summary.high}`);
      console.log(`  Moderate: ${result.summary.moderate}`);
      console.log(`  Low: ${result.summary.low}\n`);

      const criticalVulns = result.vulnerabilities.filter(
        (v) => v.severity === 'critical' || v.severity === 'high'
      );

      if (criticalVulns.length > 0) {
        console.log('-'.repeat(60));
        console.log('CRITICAL & HIGH SEVERITY:');
        console.log('-'.repeat(60));

        for (const vuln of criticalVulns) {
          console.log(`\n  Package: ${vuln.package}`);
          console.log(`  Severity: ${vuln.severity.toUpperCase()}`);
          console.log(`  Vulnerable: ${vuln.vulnerableVersions}`);
          if (vuln.patchedIn) {
            console.log(`  Patched in: ${vuln.patchedIn}`);
          }
          console.log(`  Action: ${vuln.recommendation}`);
        }
      }

      const moderateVulns = result.vulnerabilities.filter((v) => v.severity === 'moderate');
      if (moderateVulns.length > 0) {
        console.log('\n' + '-'.repeat(60));
        console.log('MODERATE SEVERITY (first 5):');
        console.log('-'.repeat(60));
        moderateVulns.slice(0, 5).forEach((v) => {
          console.log(`  - ${v.package}: ${v.severity}`);
        });
        if (moderateVulns.length > 5) {
          console.log(`  ... and ${moderateVulns.length - 5} more`);
        }
      }

      const score = Math.max(
        0,
        100 - result.summary.critical * 30 - result.summary.high * 20 - result.summary.moderate * 5
      );
      console.log('\n' + '='.repeat(60));
      console.log(`DEPENDENCY SECURITY SCORE: ${score}/100`);
      console.log('='.repeat(60));

      if (result.summary.critical > 0 || result.summary.high > 0) {
        log('\nACTION REQUIRED: Update vulnerable dependencies', 'error');
        log('Run: npm audit fix', 'info');
        process.exit(1);
      }
    } else {
      console.log('\n' + '-'.repeat(60));
      console.log('NO VULNERABILITIES FOUND');
      console.log('-'.repeat(60));
      log('\nDependency security check PASSED!', 'success');
    }
  } catch (error) {
    log(`Scan failed: ${error}`, 'error');
    process.exit(1);
  }
}

main();
