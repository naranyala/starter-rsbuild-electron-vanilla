#!/usr/bin/env bun
/**
 * Security-Focused Build Pipeline Script
 * Performs security checks before and after building the application
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface BuildConfig {
  securityChecks: boolean;
  codeSigning: boolean;
  dependencyAudit: boolean;
  sastScan: boolean;
  minify: boolean;
  sourcemaps: boolean;
}

async function runCommand(command: string, description: string): Promise<boolean> {
  try {
    console.log(`\x1b[33m[INFO]\x1b[0m ${description}`);
    console.log(`\x1b[36m[CMD]\x1b[0m ${command}`);
    
    const output = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    
    return true;
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Command failed: ${command}`);
    console.error(error);
    return false;
  }
}

async function checkPrerequisites(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Checking prerequisites...');
  
  try {
    // Check if bun is available
    execSync('bun --version', { encoding: 'utf-8' });
    console.log('\x1b[32m[OK]\x1b[0m Bun is available');
  } catch {
    console.error('\x1b[31m[ERROR]\x1b[0m Bun is not available');
    return false;
  }
  
  try {
    // Check if rsbuild is available
    execSync('bunx rsbuild --version', { encoding: 'utf-8' });
    console.log('\x1b[32m[OK]\x1b[0m Rsbuild is available');
  } catch {
    console.error('\x1b[31m[ERROR]\x1b[0m Rsbuild is not available');
    return false;
  }
  
  return true;
}

async function runSecurityAudits(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Running security audits...');
  
  // Run the existing security audit script
  const securityAuditSuccess = await runCommand(
    'bun run scripts/security/audit.ts',
    'Running code security audit'
  );
  
  if (!securityAuditSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Security audit failed');
    return false;
  }
  
  // Run dependency audit
  const dependencyAuditSuccess = await runCommand(
    'bun run scripts/security/dependency-audit.ts',
    'Running dependency vulnerability scan'
  );
  
  if (!dependencyAuditSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Dependency audit failed');
    return false;
  }
  
  return true;
}

async function runStaticAnalysis(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Running static analysis...');
  
  // Run Biome for code quality and security checks
  const biomeSuccess = await runCommand(
    'bunx @biomejs/biome check .',
    'Running Biome linter'
  );
  
  if (!biomeSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Biome check failed');
    return false;
  }
  
  return true;
}

async function runTests(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Running security tests...');
  
  // Run bun tests
  const testSuccess = await runCommand(
    'bun test',
    'Running all tests (including security tests)'
  );
  
  if (!testSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Tests failed');
    return false;
  }
  
  return true;
}

async function buildApplication(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Building application...');
  
  // Clean previous build
  await runCommand('rm -rf dist', 'Cleaning previous build');
  
  // Run the main build process
  const buildSuccess = await runCommand(
    'bunx rsbuild build && bun run build-main && bun run copy-icons',
    'Building application with Rsbuild'
  );
  
  if (!buildSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Build failed');
    return false;
  }
  
  return true;
}

async function verifyBuildSecurity(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Verifying build security...');
  
  const distDir = join(dirname(__dirname), '..', 'dist');
  
  if (!existsSync(distDir)) {
    console.error('\x1b[31m[ERROR]\x1b[0m Dist directory does not exist');
    return false;
  }
  
  // Check for potentially dangerous files in build output
  try {
    const buildFiles = execSync(`find ${distDir} -type f`, { encoding: 'utf-8' }).split('\n');
    
    for (const file of buildFiles) {
      if (file && (file.endsWith('.sh') || file.endsWith('.bat') || file.endsWith('.cmd'))) {
        console.warn(`\x1b[33m[WARN]\x1b[0m Potentially executable file in build: ${file}`);
      }
    }
    
    console.log('\x1b[32m[OK]\x1b[0m Build verification completed');
    return true;
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Build verification failed: ${error}`);
    return false;
  }
}

async function signBuild(): Promise<boolean> {
  console.log('\x1b[33m[INFO]\x1b[0m Signing build (placeholder)...');
  
  // Placeholder for code signing
  // In a real implementation, this would sign the application
  console.log('\x1b[36m[INFO]\x1b[0m Code signing would happen here in a production environment');
  
  return true;
}

async function main() {
  console.log('\x1b[35m' + '='.repeat(60));
  console.log('SECURE BUILD PIPELINE');
  console.log('='.repeat(60) + '\x1b[0m');
  
  const startTime = Date.now();
  
  // Check prerequisites
  if (!(await checkPrerequisites())) {
    process.exit(1);
  }
  
  // Run security checks before build
  console.log('\n\x1b[35m[PHASE 1/4] Pre-build Security Checks\x1b[0m');
  if (!(await runSecurityAudits())) {
    process.exit(1);
  }
  
  if (!(await runStaticAnalysis())) {
    process.exit(1);
  }
  
  if (!(await runTests())) {
    process.exit(1);
  }
  
  // Build the application
  console.log('\n\x1b[35m[PHASE 2/4] Building Application\x1b[0m');
  if (!(await buildApplication())) {
    process.exit(1);
  }
  
  // Verify build security
  console.log('\n\x1b[35m[PHASE 3/4] Post-build Security Verification\x1b[0m');
  if (!(await verifyBuildSecurity())) {
    process.exit(1);
  }
  
  // Sign the build
  console.log('\n\x1b[35m[PHASE 4/4] Code Signing\x1b[0m');
  if (!(await signBuild())) {
    process.exit(1);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n\x1b[32m' + '='.repeat(60));
  console.log(`BUILD SUCCESSFUL (${duration}s)`);
  console.log('='.repeat(60) + '\x1b[0m');
  console.log('\x1b[36m[INFO]\x1b[0m Secure build pipeline completed successfully');
  console.log('\x1b[36m[INFO]\x1b[0m Application is ready for distribution');
}

main().catch((error) => {
  console.error('\x1b[31m[ERROR]\x1b[0m Build pipeline failed:', error);
  process.exit(1);
});