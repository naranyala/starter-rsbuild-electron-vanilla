# Electron + Vanilla TypeScript + WinBox Starter

A modern starter template for building Electron applications using vanilla TypeScript with WinBox.js window management, bundled with Rsbuild.

## Features

- ✅ **Pure TypeScript** - No React or other frameworks, just vanilla TypeScript
- ✅ **WinBox.js Integration** - Modern window management with custom windows
- ✅ **Rsbuild Bundler** - Fast, modern bundling with Rsbuild
- ✅ **Electron Ready** - Pre-configured for desktop application development
- ✅ **FOUC Prevention** - Critical CSS inlined to prevent flash of unstyled content
- ✅ **Modular Structure** - Clean project organization with all sources in `src/`
- ✅ **Hot Reloading** - Development with live reloading
- ✅ **Cross Platform** - Works on Windows, macOS, and Linux

## Project Structure

```
starter-rsbuild-electron-vanilla/
├── src/                    # Source files
│   ├── assets/            # Static assets (icons, images)
│   ├── lib/               # Shared libraries and utilities
│   │   ├── main/          # Main process utilities
│   │   └── renderer/      # Renderer process utilities
│   ├── App.ts             # Main application logic
│   ├── index.ts           # Application entry point
│   ├── index.html         # HTML template
│   ├── App.css            # Application styles
│   ├── index.css          # Base styles
│   └── reset.css          # CSS reset
├── scripts/               # Build and development scripts
├── main.cjs               # Electron main process
├── rsbuild.config.ts      # Rsbuild configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies and scripts
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (recommended) or npm/yarn

## Getting Started

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
bun install
# or if using npm
npm install
```

### Development

To start the development server with hot reloading:

```bash
bun run dev
# or if using npm
npm run dev
```

This will:
1. Start the Rsbuild development server
2. Launch the Electron application
3. Connect the renderer to the dev server

### Building

To create a production build:

```bash
bun run build
# or if using npm
npm run build
```

This will:
1. Bundle the application with Rsbuild
2. Copy required assets to the `dist/` directory

### Packaging for Distribution

To package the application for distribution:

```bash
bun run dist
# or if using npm
npm run dist
```

This will create distributable files in the `dist/` directory using electron-builder.

## Scripts Available

| Script | Description |
|--------|-------------|
| `dev` | Start development server with Electron app |
| `build` | Build the application for production |
| `start` | Run the built Electron application |
| `rsbuild-dev` | Start Rsbuild dev server only |
| `rsbuild-build` | Build with Rsbuild only |
| `dist` | Build and package for distribution |
| `type-check` | Run TypeScript type checking |
| `lint` | Lint and fix code |
| `format` | Format code |

## WinBox.js Integration

The application includes WinBox.js for creating custom windows. Click on any card in the main interface to open a dynamic window with content generated based on the card title.

Features:
- Dynamic content generation
- Theme-based coloring
- Custom window controls
- Responsive design

## Styling

The application uses a dark-themed UI with CSS variables for consistent theming. Critical CSS is inlined in the HTML to prevent FOUC (Flash of Unstyled Content).

## Architecture

- **Main Process**: Handles Electron app lifecycle in `main.cjs`
- **Renderer Process**: UI and application logic in `src/`
- **Bundling**: Rsbuild for fast builds and development
- **State Management**: Pure TypeScript without external state management libraries

## Environment

The application supports both development and production environments:

- **Development**: Connects to Rsbuild dev server via `ELECTRON_START_URL`
- **Production**: Loads from `dist/index.html`

## Troubleshooting

### Development Server Issues

If the development server doesn't launch properly:

1. Ensure all dependencies are installed: `bun install`
2. Clear cache if needed: `rm -rf node_modules && bun install`
3. Check that ports are available

### Build Issues

For build problems:

1. Verify TypeScript compilation: `bun run type-check`
2. Check for linting errors: `bun run lint`
3. Clean and rebuild: `rm -rf dist && bun run build`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT © [Your Name]