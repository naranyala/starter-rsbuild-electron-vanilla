# Electron + Rsbuild + Vanilla TS Starter

Build production-grade desktop apps faster with a modern Electron foundation, a lightning-fast renderer pipeline, and a clean, extensible feature architecture. This starter kit gives you a polished baseline with real-world patterns instead of demo-only scaffolding.

## Why This Repo

- Fast renderer builds with Rsbuild.
- Secure-by-design defaults are supported and easy to enforce.
- A structured use-case system for feature discovery and expansion.
- A minimal, powerful UI layer using custom reactivity and templating.
- WinBox-powered floating windows for desktop-grade UX patterns.
- Clear separation between main, preload, and renderer concerns.

## What’s Inside

- Electron main process with window manager and lifecycle services.
- Renderer app in vanilla TypeScript with a lightweight template engine.
- Custom signal-based reactivity for state and updates.
- Goober + Clsx for component-level styling.
- Global CSS for layout and app-level styling.
- Preload bridge ready for secure IPC.
- Electron-builder distribution config baked in.

## Quick Start

```bash
bun install
bun run dev
```

Notes:

- The dev script starts Electron from `dist/main/index.js`.
- If you edit main process files, run `bun run build-main`.
- If you edit preload, run `bun run build-preload`.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Run Rsbuild dev server + Electron |
| `bun run build` | Build renderer, compile main, copy icons |
| `bun run start` | Run the built Electron app |
| `bun run dist` | Build and package with electron-builder |
| `bun run lint` | Biome code checks |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run format` | Format with Biome |
| `bun run format:fix` | Format and write changes |

## Architecture At A Glance

- Main process entry: `src/main/index.ts`
- Window and lifecycle services: `src/main/services`
- Use-case system (main): `src/main/features/electron-info`
- Renderer entry: `src/renderer/index.ts`
- Home page and WinBox UI: `src/renderer/pages/home-page.ts`
- Use-case system (renderer): `src/renderer/features/electron-info`
- Preload bridge: `src/renderer/preload.ts`
- Styles: `src/renderer/styles/app.css`

## Documentation

- Start here: `docs/INDEX.md`
- AI agents: `docs/AI-AGENTS.md`
- Architecture: `docs/ARCHITECTURE.md`
- Workflows: `docs/WORKFLOWS.md`
- Conventions: `docs/CONVENTIONS.md`
- Security: `docs/SECURITY.md`
- Styling: `docs/STYLING.md`
- Reactive styling: `docs/REACTIVE-STYLING.md`

## Use-Case Feature Framework

Features are shipped as self-contained use cases. Each use case provides:

- Metadata like `id`, `title`, and tags.
- Optional IPC handlers in the main process.
- Renderer content and theme configuration.

Main-side use cases live in `src/main/features/electron-info`. Renderer-side use cases live in `src/renderer/features/electron-info`. The UI is built from the registry, so new use cases show up automatically once registered.

## Security Posture

This starter is compatible with Electron security recommendations. The `WindowManager` defaults to strict settings, but `src/main/config/app-config.ts` currently overrides them. Review `docs/SECURITY.md` and update `contextIsolation`, `preload`, and IPC exposure before production releases.

## Distribution

Packaging is handled by electron-builder and configured in `package.json` under `build`. Targets include:

- Windows MSI
- Linux AppImage and DEB

The config also includes a DMG layout for macOS builds.

## License

MIT License.
