# AI Agent Guide

This guide is the fastest way to become productive in this repo. It is written for automated agents and human collaborators who want safe, high-signal changes.

## Quick Facts

- Runtime: Electron main + preload + renderer.
- Bundler: Rsbuild for the renderer.
- Language: TypeScript everywhere.
- UI: Vanilla TS + custom template engine + custom reactivity.
- Windows: WinBox for draggable in-app windows.
- Styling: Goober + Clsx + global CSS.

## Repo Map

- `src/main` - Electron main process entry, window manager, IPC, and use cases.
- `src/renderer` - UI, features, template system, reactivity, and styles.
- `src/renderer/preload.ts` - Context bridge API for renderer.
- `src/shared` - Shared config and menu definitions, currently not wired in main.
- `scripts` - Dev and build helpers.
- `dist` - Build output. Do not edit by hand.

## Golden Paths

### Add a New Use Case

1. Create a main-process handler in `src/main/features/electron-info/`.
1. Extend `MainUseCase` and define a config with `id`, `title`, and `tags`.
1. Register it in `src/main/features/electron-info/index.ts`.
1. Create a renderer counterpart in `src/renderer/features/electron-info/`.
1. Extend `UseCase` and register it in `src/renderer/features/electron-info/index.ts`.
1. The UI pulls from the registry in `src/renderer/pages/home-page.ts`.

### Add Secure IPC

1. Define strict channels in the main process, prefer `ipcMain.handle`.
1. Expose minimal APIs in `src/renderer/preload.ts` via `contextBridge`.
1. Keep the renderer side usage narrow and avoid leaking `ipcRenderer`.

### Update App Window Defaults

1. The main entry in `src/main/index.ts` passes `appConfig.mainWindow`.
1. `WindowManager` has secure defaults, but `appConfig` overrides them.
1. Update `src/main/config/app-config.ts` if you need preload or isolation.

## Commands

- `bun run dev` - Rsbuild dev server + Electron.
- `bun run build` - Build renderer and main, copy icons.
- `bun run start` - Run the built app.
- `bun run dist` - Package with electron-builder.
- `bun run lint` - Biome checks.
- `bun run format` - Biome formatting.

## Gotchas

- `WindowManager` defaults to `contextIsolation: true` and a preload script, but `appConfig.mainWindow.webPreferences` overrides those defaults. In `src/main/config/app-config.ts`, `contextIsolation` is currently `false` and there is no `preload`. If you rely on preload or stricter security, update `appConfig`.
- `tsconfig.preload.json` exists, but `bun run build` does not invoke `build-preload`. If you change `src/renderer/preload.ts`, run `bun run build-preload` or wire it into the build.
- `src/shared/config/app-config.ts` defines another `appConfig` and menu config that are not currently used by the main process.

## Change Checklist

- Prefer `src/main/config/app-config.ts` as the live app config.
- Keep renderer logic in `src/renderer` and main logic in `src/main`.
- Do not edit `dist/` or `node_modules/`.
- If you add new files, update docs or README when it improves discoverability.
