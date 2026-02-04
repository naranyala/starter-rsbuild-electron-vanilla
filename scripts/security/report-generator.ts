#!/usr/bin/env bun
/**
 * Security Report Generator
 * Generates a comprehensive security report combining all security checks
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  file?: string;
  line?: number;
  recommendation: string;
}

interface SecurityReport {
  timestamp: string;
  projectName: string;
  version: string;
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  score: number;
}

class SecurityReportGenerator {
  private findings: SecurityFinding[] = [];
  private projectRoot: string;
  private packageInfo: any;

  constructor() {
    this.projectRoot = join(__dirname, '..');
    this.loadPackageInfo();
  }

  private loadPackageInfo(): void {
    try {
      const packagePath = join(this.projectRoot, 'package.json');
      this.packageInfo = JSON.parse(readFileSync(packagePath, 'utf-8'));
    } catch (error) {
      console.error('Failed to load package.json:', error);
      this.packageInfo = { name: 'unknown', version: '0.0.0' };
    }
  }

  async runAllScans(): Promise<void> {
    console.log('\x1b[33m[INFO]\x1b[0m Running comprehensive security scans...\n');

    // Run code security scan
    await this.runCodeSecurityScan();

    // Run dependency scan
    await this.runDependencyScan();

    // Run configuration scan
    await this.runConfigurationScan();

    // Run build security scan
    await this.runBuildSecurityScan();
  }

  private async runCodeSecurityScan(): Promise<void> {
    console.log('\x1b[36m[SCAN]\x1b[0m Running code security scan...');
    
    // Scan for dangerous patterns in source code
    const srcDir = join(this.projectRoot, 'src');
    await this.scanDirectoryForSecurityIssues(srcDir, ['.ts', '.js', '.tsx', '.jsx']);
    
    console.log('\x1b[32m[DONE]\x1b[0m Code security scan completed\n');
  }

  private async scanDirectoryForSecurityIssues(dir: string, extensions: string[]): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    if (!existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules' &&
          entry.name !== 'dist' &&
          entry.name !== 'build'
        ) {
          await this.scanDirectoryForSecurityIssues(fullPath, extensions);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        await this.scanFileForSecurityIssues(fullPath);
      }
    }
  }

  private async scanFileForSecurityIssues(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Check for eval usage
        if (/\beval\s*\(/.test(line)) {
          this.addFinding({
            id: 'CODE-EVAL-001',
            title: 'Use of eval()',
            description: 'The eval() function is dangerous and can lead to code injection attacks',
            severity: 'high',
            category: 'Code Security',
            file: filePath,
            line: lineNumber,
            recommendation: 'Avoid using eval(). Use safer alternatives like JSON.parse() for parsing JSON.'
          });
        }
        
        // Check for exec usage
        if (/\bexec\s*\(/.test(line)) {
          this.addFinding({
            id: 'CODE-EXEC-001',
            title: 'Use of exec()',
            description: 'The exec() function can lead to command injection vulnerabilities',
            severity: 'high',
            category: 'Code Security',
            file: filePath,
            line: lineNumber,
            recommendation: 'Validate and sanitize all inputs before passing to exec(). Consider using safer alternatives.'
          });
        }
        
        // Check for innerHTML usage
        if (/\.innerHTML\s*=/.test(line)) {
          this.addFinding({
            id: 'CODE-XSS-001',
            title: 'Use of innerHTML',
            description: 'innerHTML can lead to Cross-Site Scripting (XSS) vulnerabilities',
            severity: 'high',
            category: 'Code Security',
            file: filePath,
            line: lineNumber,
            recommendation: 'Use textContent or innerText instead, or properly sanitize content before assignment.'
          });
        }
        
        // Check for hardcoded secrets
        if (/(?:password|secret|key|token)\s*[:=]\s*['"`][^'"`]+['"`]/i.test(line)) {
          this.addFinding({
            id: 'CODE-SECRET-001',
            title: 'Hardcoded Secret',
            description: 'Sensitive credentials should not be hardcoded in source code',
            severity: 'critical',
            category: 'Secrets Management',
            file: filePath,
            line: lineNumber,
            recommendation: 'Move secrets to environment variables or secure configuration management systems.'
          });
        }
        
        // Check for insecure HTTP
        if (/http:\/\/[^s]/.test(line) && !line.includes('localhost') && !line.includes('127.0.0.1')) {
          this.addFinding({
            id: 'CODE-HTTPS-001',
            title: 'Insecure HTTP Protocol',
            description: 'Using HTTP instead of HTTPS can expose data to interception',
            severity: 'medium',
            category: 'Transport Security',
            file: filePath,
            line: lineNumber,
            recommendation: 'Use HTTPS for all external communications.'
          });
        }
      }
    } catch (error) {
      console.error(`Failed to scan file ${filePath}:`, error);
    }
  }

  private async runDependencyScan(): Promise<void> {
    console.log('\x1b[36m[SCAN]\x1b[0m Running dependency vulnerability scan...');
    
    try {
      // Try to run npm audit
      const auditResult = execSync('npm audit --json', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
      
      const auditData = JSON.parse(auditResult);
      
      if (auditData.vulnerabilities) {
        for (const [name, info] of Object.entries(auditData.vulnerabilities as Record<string, any>)) {
          const severity = info.severity || 'medium';
          this.addFinding({
            id: `DEP-${name.toUpperCase()}-${Date.now()}`,
            title: `Vulnerable Dependency: ${name}`,
            description: info.title || info.description || `Dependency ${name} has known vulnerabilities`,
            severity: severity as any,
            category: 'Dependency Security',
            recommendation: info.recommendation || `Update ${name} to a patched version`
          });
        }
      }
    } catch (error: any) {
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          if (auditData.vulnerabilities) {
            for (const [name, info] of Object.entries(auditData.vulnerabilities as Record<string, any>)) {
              const severity = info.severity || 'medium';
              this.addFinding({
                id: `DEP-${name.toUpperCase()}-${Date.now()}`,
                title: `Vulnerable Dependency: ${name}`,
                description: info.title || info.description || `Dependency ${name} has known vulnerabilities`,
                severity: severity as any,
                category: 'Dependency Security',
                recommendation: info.recommendation || `Update ${name} to a patched version`
              });
            }
          }
        } catch {
          console.log('\x1b[33m[WARN]\x1b[0m Could not parse npm audit output');
        }
      } else {
        console.log('\x1b[33m[WARN]\x1b[0m npm audit failed, skipping dependency scan');
      }
    }
    
    console.log('\x1b[32m[DONE]\x1b[0m Dependency scan completed\n');
  }

  private async runConfigurationScan(): Promise<void> {
    console.log('\x1b[36m[SCAN]\x1b[0m Running configuration security scan...');
    
    // Check Electron security configurations
    const configPath = join(this.projectRoot, 'src/main/config/app-config.ts');
    if (existsSync(configPath)) {
      const configContent = readFileSync(configPath, 'utf-8');
      
      if (configContent.includes('nodeIntegration: false')) {
        // Good - nodeIntegration is disabled
      } else {
        this.addFinding({
          id: 'CONF-NODEINT-001',
          title: 'Node Integration Enabled',
          description: 'Node integration in renderer processes is enabled, which is a security risk',
          severity: 'high',
          category: 'Configuration Security',
          file: configPath,
          recommendation: 'Set nodeIntegration to false in webPreferences'
        });
      }
      
      if (configContent.includes('contextIsolation: false')) {
        this.addFinding({
          id: 'CONF-CTXISO-001',
          title: 'Context Isolation Disabled',
          description: 'Context isolation is disabled, which reduces security',
          severity: 'medium',
          category: 'Configuration Security',
          file: configPath,
          recommendation: 'Enable contextIsolation by setting it to true'
        });
      }
      
      if (!configContent.includes('webSecurity: true')) {
        this.addFinding({
          id: 'CONF-WEBSEC-001',
          title: 'Web Security Disabled',
          description: 'Web security is not explicitly enabled',
          severity: 'high',
          category: 'Configuration Security',
          file: configPath,
          recommendation: 'Explicitly set webSecurity to true'
        });
      }
    }
    
    console.log('\x1b[32m[DONE]\x1b[0m Configuration scan completed\n');
  }

  private async runBuildSecurityScan(): Promise<void> {
    console.log('\x1b[36m[SCAN]\x1b[0m Running build security scan...');
    
    // Check if dist directory exists and scan for potential issues
    const distDir = join(this.projectRoot, 'dist');
    if (existsSync(distDir)) {
      const fs = await import('fs');
      const path = await import('path');
      
      const checkBuildDir = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            checkBuildDir(fullPath);
          } else {
            // Check for potentially dangerous files in build output
            if (entry.name.endsWith('.sh') || entry.name.endsWith('.bat') || entry.name.endsWith('.cmd')) {
              this.addFinding({
                id: 'BUILD-EXEC-001',
                title: 'Executable File in Build Output',
                description: `Potentially executable file found in build output: ${entry.name}`,
                severity: 'medium',
                category: 'Build Security',
                file: fullPath,
                recommendation: 'Remove executable files from build output unless absolutely necessary'
              });
            }
            
            // Check content of JS files for security issues
            if (entry.name.endsWith('.js')) {
              try {
                const content = readFileSync(fullPath, 'utf-8');
                
                if (/\beval\s*\(/.test(content)) {
                  this.addFinding({
                    id: 'BUILD-EVAL-001',
                    title: 'eval() in Build Output',
                    description: 'eval() function found in built JavaScript',
                    severity: 'high',
                    category: 'Build Security',
                    file: fullPath,
                    recommendation: 'Ensure build process does not introduce eval() calls'
                  });
                }
              } catch (error) {
                console.log(`Could not read file ${fullPath}:`, error);
              }
            }
          }
        }
      };
      
      checkBuildDir(distDir);
    }
    
    console.log('\x1b[32m[DONE]\x1b[0m Build security scan completed\n');
  }

  private addFinding(finding: SecurityFinding): void {
    this.findings.push(finding);
  }

  generateReport(): SecurityReport {
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    this.findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
        case 'info':
          summary.info++;
          break;
      }
    });

    const score = Math.max(
      0,
      100 - 
      summary.critical * 25 - 
      summary.high * 15 - 
      summary.medium * 5 - 
      summary.low * 1
    );

    const report: SecurityReport = {
      timestamp: new Date().toISOString(),
      projectName: this.packageInfo.name || 'unknown',
      version: this.packageInfo.version || '0.0.0',
      findings: this.findings,
      summary,
      score
    };

    return report;
  }

  saveReport(report: SecurityReport, outputPath: string): void {
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      const fs = await import('fs');
      const path = await import('path');
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\x1b[32m[SAVED]\x1b[0m Security report saved to ${outputPath}`);
  }

  printSummary(report: SecurityReport): void {
    console.log('\n\x1b[35m' + '='.repeat(60));
    console.log('COMPREHENSIVE SECURITY REPORT');
    console.log('='.repeat(60) + '\x1b[0m');
    console.log(`Project: ${report.projectName} v${report.version}`);
    console.log(`Generated: ${report.timestamp}`);
    console.log(`Findings: ${report.findings.length} total`);
    console.log('');
    console.log('SUMMARY:');
    console.log(`  Critical: ${report.summary.critical} \x1b[31m●\x1b[0m`);
    console.log(`  High:     ${report.summary.high} \x1b[31m●\x1b[0m`);
    console.log(`  Medium:   ${report.summary.medium} \x1b[33m●\x1b[0m`);
    console.log(`  Low:      ${report.summary.low} \x1b[36m●\x1b[0m`);
    console.log(`  Info:     ${report.summary.info} \x1b[37m●\x1b[0m`);
    console.log('');
    console.log(`\x1b[36mSECURITY SCORE: ${report.score}/100\x1b[0m`);
    console.log('');

    if (report.summary.critical > 0 || report.summary.high > 0) {
      console.log('\x1b[31m🔴 SECURITY RISK DETECTED\x1b[0m');
      console.log('Critical or high severity issues found. Address immediately.');
    } else if (report.summary.medium > 0) {
      console.log('\x1b[33m🟡 MEDIUM RISK DETECTED\x1b[0m');
      console.log('Medium severity issues found. Review and address.');
    } else {
      console.log('\x1b[32m🟢 RELATIVELY SECURE\x1b[0m');
      console.log('No critical or high severity issues found.');
    }

    if (report.findings.length > 0) {
      console.log('\nTOP FINDINGS:');
      const topFindings = report.findings
        .sort((a, b) => this.severityToNumber(b.severity) - this.severityToNumber(a.severity))
        .slice(0, 5);
      
      topFindings.forEach(finding => {
        const severityColor = this.getSeverityColor(finding.severity);
        console.log(`  ${severityColor}●\x1b[0m ${finding.title} [\x1b[36m${finding.category}\x1b[0m]`);
      });
    }
  }

  private severityToNumber(severity: string): number {
    switch (severity) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      case 'info': return 1;
      default: return 0;
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '\x1b[31m'; // Red
      case 'high': return '\x1b[31m';     // Red
      case 'medium': return '\x1b[33m';   // Yellow
      case 'low': return '\x1b[36m';      // Cyan
      case 'info': return '\x1b[37m';     // White
      default: return '\x1b[0m';          // Reset
    }
  }
}

async function main() {
  const generator = new SecurityReportGenerator();
  
  try {
    await generator.runAllScans();
    const report = generator.generateReport();
    
    // Print summary to console
    generator.printSummary(report);
    
    // Save detailed report to file
    const outputPath = join(__dirname, '..', 'reports', 'security-report.json');
    generator.saveReport(report, outputPath);
    
    // Exit with error code if critical or high issues found
    if (report.summary.critical > 0 || report.summary.high > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Security report generation failed:', error);
    process.exit(1);
  }
}

main();