# Electron + Rsbuild Starter

Professional Electron application starter with vanilla TypeScript and Rsbuild bundling.

## Key Features

- **Modern Toolchain**: Leverages Rsbuild for lightning-fast bundling and development
- **Pure TypeScript**: Clean, framework-free TypeScript implementation
- **Cross-Platform**: Build once, deploy to Windows, macOS, and Linux
- **Modular Architecture**: Scalable use-case pattern for enterprise applications
- **Production Ready**: Includes comprehensive build, linting, and distribution workflows
- **Secure IPC**: Implements secure inter-process communication patterns
- **Code Quality**: Integrated Biome for consistent formatting and linting

## Quick Start

Install dependencies:
```bash
bun install
```

Launch development environment:
```bash
bun run dev
```

Build for production:
```bash
bun run build
```

Package for distribution:
```bash
bun run dist
```

## Architecture Overview

The starter follows Electron's recommended security practices with a clear separation between main and renderer processes:

- **Main Process**: Handles application lifecycle, window management, and native OS integrations
- **Renderer Process**: Implements UI logic with secure access to main process via context isolation
- **Preload Scripts**: Provides secure bridge between renderer and main processes
- **Modular Use-Cases**: Scalable architecture pattern for organizing application features

## Development Workflow

- Hot reloading during development for rapid iteration
- Comprehensive TypeScript type checking
- Automated code formatting and linting
- Production-ready build pipeline
- Cross-platform packaging with electron-builder

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **Rsbuild**: High-performance bundler powered by Rust
- **TypeScript**: Strong typing for reliable code
- **Biome**: Unified code quality tool
- **electron-builder**: Distribution and packaging solution

## Scripts Reference

| Command | Purpose |
|---------|---------|
| `dev` | Start development server with hot reload |
| `build` | Create production build |
| `start` | Run built application |
| `dist` | Package application for distribution |
| `lint` | Code quality check |
| `format` | Apply code formatting |

## License

MIT
