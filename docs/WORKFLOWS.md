# Workflows

This guide lists the common ways to run, build, and distribute the app.

## Prerequisites

- Bun is required because the scripts call `bun` and `bunx`.

## Development

1. Install dependencies with `bun install`.
1. Start the dev environment with `bun run dev`.

Notes:

- The dev script launches Rsbuild and then Electron using `dist/main/index.js`.
- If you change main process code, rebuild it with `bun run build-main`.
- If you change preload, run `bun run build-preload`.

## Build and Run

- `bun run build` builds the renderer, compiles the main process, and copies icons.
- `bun run start` runs the built Electron app from `dist/main/index.js`.

## Distribution

- `bun run dist` runs the full build and packages the app with electron-builder.
- Package configuration is in `package.json` under the `build` key.

## Quality Checks

- `bun run lint` checks code with Biome.
- `bun run lint:fix` fixes issues where possible.
- `bun run format` formats code with Biome.
- `bun run format:fix` formats and writes changes.
