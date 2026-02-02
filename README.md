# Professional Electron Desktop Application Framework

Enterprise-grade starter kit for building cross-platform desktop applications with Electron, Rsbuild, and TypeScript. Accelerate your development timeline with a production-ready foundation that follows industry best practices and security standards.

## Transform Your Development Process

Stop spending weeks on boilerplate configuration. Our starter kit provides a complete, production-ready foundation that gets you building features from day one. Focus on your unique value proposition instead of infrastructure concerns.

**Save 40+ Hours of Setup Time**
Eliminate the complexity of configuring Electron security, bundling, IPC communication, and distribution pipelines. Everything is pre-configured with security-first principles and modern tooling.

**Scale from MVP to Enterprise**
Built with modularity and maintainability at the forefront. The architecture supports growth from simple utilities to complex enterprise applications without requiring architectural rewrites.

**Cross-Platform Excellence**
Deploy seamlessly to Windows, macOS, and Linux from a single codebase. Built-in packaging and distribution tools ensure professional installation experiences across all platforms.

## Core Advantages

**Lightning-Fast Development Environment**
Rsbuild leverages Rust-based compilation for exceptional build performance. Development servers launch in seconds with hot module replacement for instant feedback. Production builds are optimized with tree-shaking for minimal bundle sizes.

**Enterprise Security Standards**
Security is embedded into the architecture, not an afterthought. Context isolation is enabled by default, preload scripts provide controlled IPC access, and content security policies protect against injection attacks. Follows all Electron security recommendations out of the box.

**Complete Type Safety**
End-to-end TypeScript implementation with strict type checking across all processes. Shared type definitions ensure consistency between main, renderer, and preload processes. Catch errors at compile time, not runtime.

**Professional Distribution Pipeline**
Comprehensive packaging solution supporting Windows, macOS, and Linux. Includes code signing, auto-update mechanisms, and platform-specific optimizations. Deliver professional installation experiences that meet enterprise deployment requirements.

## Technical Specifications

- **Electron 40+** - Latest cross-platform desktop framework
- **Rsbuild 1.7+** - High-performance Rust-powered bundler
- **TypeScript 5+** - Full type safety across all processes
- **Biome** - Automated code quality and formatting
- **electron-builder** - Professional distribution packaging
- **WinBox** - Advanced modal window management
- **Modular Architecture** - Scalable feature organization

## Rapid Deployment Process

**Get Started in Minutes**

Initialize your development environment:
```bash
git clone <repository-url>
cd starter-rsbuild-electron-vanilla
bun install
```

Launch with live development:
```bash
bun run dev
```

Your application opens immediately with hot reloading. Source changes reflect instantly without application restarts.

**Production Deployment Ready**

Build optimized production assets:
```bash
bun run build
bun run start
```

Create distribution packages:
```bash
bun run dist
```

## Architectural Excellence

**Multi-Process Design Pattern**
Clear separation of concerns between application layers:

- **Main Process**: Application lifecycle, window management, OS integrations (`src/main/index.ts`)
- **Renderer Process**: User interface implementation with web technologies (`src/renderer/`)
- **Preload Scripts**: Secure IPC bridge with context isolation (`src/renderer/preload.ts`)
- **Modular Features**: Extensible use-case pattern for feature organization

**Scalable Feature Architecture**
The use-case pattern enables effortless feature addition without core application modifications. Each feature encapsulates its configuration, behavior, and content generation, ensuring consistent functionality across the application.

## Command Reference

| Command | Purpose |
|---------|---------|
| `bun run dev` | Launch development server with HMR |
| `bun run build` | Generate optimized production build |
| `bun run start` | Execute built application |
| `bun run dist` | Create distribution packages |
| `bun run lint` | Execute code quality analysis |
| `bun run format` | Apply consistent code formatting |

## Extensibility Framework

Expand functionality using the built-in use-case pattern. Create new classes extending the `UseCase` base class, register in the feature index, and the application automatically incorporates them into the user interface. This approach guarantees consistent behavior and simplifies maintenance across the application lifecycle.

Includes comprehensive example implementations covering: architecture patterns, security implementation, native API integration, performance optimization, distribution strategies, development workflows, and version management.

## Business Benefits

- **Reduced Time-to-Market**: Skip infrastructure setup and begin feature development immediately
- **Lower Maintenance Costs**: Modern tooling and architecture reduce long-term maintenance overhead
- **Security Assurance**: Pre-configured security measures protect against common vulnerabilities
- **Professional Quality**: Production-ready code quality and distribution capabilities
- **Team Productivity**: Consistent architecture patterns accelerate team onboarding

## Licensing

MIT License - suitable for both commercial and open-source projects.
