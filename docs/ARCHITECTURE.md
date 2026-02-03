# Architecture

This project follows the standard Electron split and adds a structured use-case system for feature delivery.

## Process Boundaries

- Main process: `src/main/index.ts` is the entry point.
- Preload: `src/renderer/preload.ts` runs in an isolated context.
- Renderer: `src/renderer/index.ts` bootstraps the UI.

## Main Process

- Window creation and lifecycle are handled by `src/main/services/window-manager.ts`.
- App configuration lives in `src/main/config/app-config.ts`.
- Use cases are registered in `src/main/features/electron-info/index.ts`.
- IPC helpers live in `src/main/utils/backend/ipc.ts` and `src/main/services/ipc-utils.ts`.
- Logging uses `src/main/services/logger.ts`.

## Renderer

- UI entry point: `src/renderer/index.ts`.
- Home experience and WinBox windows: `src/renderer/pages/home-page.ts`.
- Use cases registry: `src/renderer/features/electron-info/index.ts`.
- Custom reactivity system: `src/renderer/lib/reactivity.ts`.
- Custom template system: `src/renderer/lib/template.ts`.
- Styling utilities: `src/renderer/lib/styling.ts`, `src/renderer/lib/class-utils.ts`.
- Global styles: `src/renderer/styles/app.css`.

## Build Outputs

- Renderer bundle: `dist/index.html` and related assets via Rsbuild.
- Main bundle: `dist/main/index.js` via `tsconfig.main.json`.
- Preload bundle: `dist/preload.js` via `tsconfig.preload.json`.

## Data Flow Overview

1. `mainUseCaseRegistry` registers IPC handlers on app start.
1. The renderer loads use cases from `useCaseRegistry`.
1. The home page renders cards from the registry and spawns WinBox windows.
1. Optional IPC flows can bridge data between main and renderer through preload.
