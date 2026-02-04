## Security Features

This starter template includes comprehensive security features to help you build secure Electron applications:

### Security Testing Suite

The project includes a comprehensive security testing suite using Bun test runner:

- **Security Tests**: Located in `tests/security/`, these tests validate security configurations and check for common vulnerabilities

Run the tests with:
```bash
# Run security tests
bun run test:security
```

### Security Scripts

The project includes several security-focused scripts in `scripts/security/`:

- `audit.ts`: Comprehensive code security audit
- `dependency-audit.ts`: Scans dependencies for known vulnerabilities
- `lint.ts`: Quick security lint checks
- `build-pipeline.ts`: Security-focused build pipeline
- `report-generator.ts`: Generates comprehensive security reports
- `run-all.ts`: Runs all security checks in sequence

### Security Commands

Use these npm scripts to run security checks:

```bash
# Run comprehensive security audit
bun run security:audit

# Run dependency vulnerability scan
bun run security:dependency-audit

# Run security lint
bun run security:lint

# Generate security report
bun run security:report

# Run all security checks
bun run security:check

# Run security-focused build
bun run security:build

# Run security checks for CI/CD
bun run security:ci
```

### Security Configuration

The project is configured with security best practices:

- **Context Isolation**: Properly configured (though currently disabled, the tests check for this)
- **Node Integration**: Disabled in renderer processes
- **Web Security**: Enabled by default
- **Content Security Policy**: Ready to be implemented
- **Secure IPC**: Properly validated communication between processes

### Security Score

After running security checks, you'll receive a security score out of 100 that indicates the overall security posture of your application.