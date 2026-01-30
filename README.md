# Electron + Rsbuild Starter

A modern starter template for building Electron applications using vanilla TypeScript, bundled with Rsbuild.

## Features

- Pure TypeScript with no frameworks
- Rsbuild for fast bundling and development
- Electron main and renderer process architecture
- Modular project structure
- Cross-platform support (Windows, macOS, Linux)
- Code linting and formatting with Biome
- Distribution packaging with electron-builder

## Project Structure

```
starter-rsbuild-electron-vanilla/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.cjs          # Main process entry point
│   │   └── lib/              # Main process utilities
│   │       ├── logger.cjs
│   │       ├── window-manager.cjs
│   │       └── ipc-utils.cjs
│   └── renderer/             # Renderer process (UI)
│       ├── index.ts          # Entry point
│       ├── index.html        # HTML template
│       ├── App.ts            # Application component
│       ├── preload.ts        # Preload script
│       ├── assets/           # Static assets
│       ├── lib/              # Renderer utilities
│       ├── components/       # UI components
│       ├── styles/           # CSS styles
│       └── types/            # TypeScript types
├── scripts/                  # Build scripts
│   ├── start-dev-rsbuild.cjs # Development server
│   ├── copy-main.cjs         # Copy main process files
│   └── build-icons.cjs       # Build icons
├── rsbuild.config.ts         # Rsbuild configuration
├── tsconfig.json             # TypeScript configuration (renderer)
├── tsconfig.node.json        # TypeScript configuration (main)
├── biome.json                # Biome configuration
└── package.json              # Project dependencies and scripts
```

## Prerequisites

- Node.js v18 or higher
- Bun (recommended) or npm

## Getting Started

### Installation

Clone or download the repository, then install dependencies:

```bash
bun install
```

If using npm:

```bash
npm install
```

### Development

Start the development server with hot reloading:

```bash
bun run dev
```

This command:
1. Starts the Rsbuild development server on a random available port
2. Launches the Electron application
3. Automatically reloads when source files change

### Building

Create a production build:

```bash
bun run build
```

This command:
1. Bundles the renderer application with Rsbuild
2. Compiles the preload script with TypeScript
3. Copies main process files to the distribution directory
4. Copies icon assets to the distribution directory

The output is located in the `dist/` directory.

### Running the Built Application

Launch the built Electron application:

```bash
bun run start
```

### Distribution Packaging

Package the application for distribution:

```bash
bun run dist
```

This command:
1. Runs a full production build
2. Creates distributable packages using electron-builder

Output is located in `dist/` for build output and platform-specific packages in a `release/` directory.

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server with Electron |
| `start` | Run the built Electron application |
| `build` | Build for production |
| `build-preload` | Compile preload TypeScript |
| `copy-main` | Copy main process files to dist |
| `copy-icons` | Copy icon assets to dist |
| `lint` | Check code with Biome |
| `lint:fix` | Check and fix code issues |
| `format` | Format code with Biome |
| `format:fix` | Format and write changes |
| `dist` | Build and package for distribution |
| `electron-dist` | Run electron-builder only |

## Architecture

### Main Process

The Electron main process handles:
- Application lifecycle (ready, activate, window-all-closed)
- Browser window creation and management
- IPC communication between processes

Located in `src/main/main.cjs` and utilities in `src/main/lib/`.

### Renderer Process

The renderer process handles:
- UI rendering with TypeScript
- Application component logic
- Secure IPC communication via context bridge

Located in `src/renderer/` with the entry point at `src/renderer/index.ts`.

### Preload Script

The preload script (`src/renderer/preload.ts`) provides a secure bridge between the main process and renderer process using Electron's contextBridge API.

### IPC Communication

The application uses Electron's IPC (Inter-Process Communication) for secure communication:

- Main process handlers: `src/main/lib/ipc-utils.cjs`
- Renderer API exposed via preload script

### Environment Modes

- **Development**: Renderer connects to Rsbuild dev server via `ELECTRON_START_URL` environment variable
- **Production**: Renderer loads from local `dist/index.html`

## Configuration

### Rsbuild

Modify `rsbuild.config.ts` to customize bundling behavior:
- Entry points
- Alias configuration
- HTML template
- Output paths

### TypeScript

- Renderer configuration: `tsconfig.json`
- Main process configuration: `tsconfig.node.json`

### Biome

Code linting and formatting configured in `biome.json`:
- Linting rules
- Formatting preferences
- Import organization

### Electron Builder

Distribution packaging configured in `package.json` under the `build` key:
- Application metadata
- Platform-specific targets
- File inclusion patterns

## Troubleshooting

### Development Server Fails to Start

1. Verify dependencies are installed: `bun install`
2. Clear node_modules and reinstall: `rm -rf node_modules && bun install`
3. Check that no other processes are using the required ports

### Build Fails

1. Run linting to check for errors: `bun run lint`
2. Run type checking: `bun run build-preload`
3. Clean the dist directory and rebuild: `rm -rf dist && bun run build`

### Electron Application Does Not Start

1. Ensure the build completed successfully
2. Check that all required files exist in `dist/`
3. Verify the preload script was compiled: `ls -la dist/preload.js`

### Code Quality Issues

Run linting and formatting checks:

```bash
bun run lint
bun run format
```

To automatically fix issues:

```bash
bun run lint:fix
bun run format:fix
```

## Dependencies

### Runtime Dependencies

- `get-port`: Automatic port selection
- `winbox`: Window management library

### Development Dependencies

- `@rsbuild/core`: Build tool
- `@biomejs/biome`: Linter and formatter
- `electron`: Desktop application framework
- `electron-builder`: Distribution packaging
- `typescript`: Type checking
- `fs-extra`: File system utilities
- `wait-on`: Wait for resources
- `electron-reload`: Hot reloading support

## License

MIT
