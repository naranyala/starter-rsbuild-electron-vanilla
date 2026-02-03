# Conventions

These conventions keep the repo consistent and easy to extend.

## TypeScript and Modules

- Main process code is ESM and imports use `.js` file extensions.
- Renderer code is bundled by Rsbuild and can use the `@` alias for `src/renderer`.
- Prefer strict typing and keep shared types in `src/types` or `src/renderer/types`.

## Structure and Naming

- Use kebab-case for file names.
- Use PascalCase for classes and type names.
- Keep feature-specific code inside `src/main/features` and `src/renderer/features`.

## Styling

- Use Goober for component-level styles and `clsx` for conditional classes.
- Keep global or layout styles in `src/renderer/styles/app.css`.
- Reactive styling helpers live in `src/renderer/lib/reactive-styles.ts`.

## IPC and Preload

- Prefer a minimal, explicit preload API in `src/renderer/preload.ts`.
- Avoid exposing `ipcRenderer` directly to the renderer.
- Use handler-based IPC (`ipcMain.handle`) for request-response flows.

## Files to Avoid Editing

- `dist/` is generated output.
- `node_modules/` is managed by the package manager.
