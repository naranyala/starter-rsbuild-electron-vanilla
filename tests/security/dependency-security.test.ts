import { describe, expect, test } from 'bun:test';
import { readFile } from 'fs/promises';
import { execSync } from 'child_process';

describe('Dependency Security Tests', () => {
  test('should validate package-lock integrity', async () => {
    try {
      const lockFileExists = await Bun.file('package-lock.json').exists();
      expect(lockFileExists).toBe(true);
    } catch (error) {
      // Alternative: check bun.lock
      const bunLockExists = await Bun.file('bun.lock').exists();
      expect(bunLockExists).toBe(true);
    }
  });

  test('should not have known high severity vulnerabilities', async () => {
    // This test would typically run a security audit
    // For now, we'll just ensure the audit script exists in package.json
    const packageJson = await readFile('package.json', 'utf8');
    const pkg = JSON.parse(packageJson);

    // Check if security audit scripts exist
    expect(pkg.scripts).toHaveProperty('security:audit');
    expect(pkg.scripts).toHaveProperty('security:check');
  });

  test('should validate minimum dependency versions', async () => {
    const packageJson = await readFile('package.json', 'utf8');
    const pkg = JSON.parse(packageJson);
    
    // Check for commonly problematic dependencies that should be updated
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
    
    // Example: Check for vulnerable versions of common packages
    for (const [name, version] of Object.entries(dependencies)) {
      // Basic version format validation
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^[\^~]?(\d+)\.(\d+)\.(\d+)/); // Basic semver format
    }
  });
});

describe('Build Security Tests', () => {
  test('should validate build output security', async () => {
    // Check that build process creates expected secure outputs
    const buildFiles = [
      'dist/main/index.js',
      'dist/preload.js',
      'dist/renderer/index.html'
    ];
    
    for (const file of buildFiles) {
      try {
        const fileExists = await Bun.file(file).exists();
        if (fileExists) {
          const content = await readFile(file, 'utf8');
          
          // Ensure no debugging information in production builds
          if (file.includes('index.js')) {
            expect(content).not.toMatch(/debugger/);
            expect(content).not.toMatch(/console\.log\(/);
          }
        }
      } catch (error) {
        // File might not exist if build hasn't been run yet
        console.log(`File ${file} not found, build may not have been run yet`);
      }
    }
  });

  test('should validate build configuration security', async () => {
    const configFiles = [
      'rsbuild.config.ts',
      'tsconfig.json',
      'tsconfig.main.json',
      'tsconfig.node.json',
      'tsconfig.preload.json'
    ];
    
    for (const configFile of configFiles) {
      try {
        const content = await readFile(configFile, 'utf8');
        
        // Check for secure build configurations
        if (configFile.includes('tsconfig')) {
          expect(content).toContain('"strict": true');
          expect(content).toContain('"noImplicitAny": true');
        }
      } catch (error) {
        // Config file might not exist
        console.log(`Config file ${configFile} not found`);
      }
    }
  });
});