# Architecture

This project follows a centralized structure with dedicated directories for backend and frontend, each having their own `lib` and `use-cases` folders.

## Process Boundaries

- Main process: `src/main/index.ts` is the entry point.
- Preload: `src/renderer/preload.ts` runs in an isolated context.
- Renderer: `src/renderer/index.ts` bootstraps the UI.

## Directory Structure

```
src/
├── backend/           # Backend code (Main process utilities)
│   ├── lib/          # Backend utilities (array, async, ipc, logger, etc.)
│   └── use-cases/    # Backend use-cases (electron-info, etc.)
├── frontend/         # Frontend code (Renderer process utilities)
│   ├── lib/          # Frontend utilities (reactivity, template, styling, etc.)
│   └── use-cases/    # Frontend use-cases (electron-info, etc.)
├── main/             # Main process entry point and services
│   ├── config/       # App configuration
│   └── services/     # Main process services (window-manager, logger, etc.)
├── renderer/         # Renderer process
│   ├── components/   # UI components
│   ├── pages/        # Page components
│   ├── styles/       # CSS styles
│   └── types/        # Renderer-specific types
└── shared/           # Shared code between processes
    ├── config/       # Shared configuration
    ├── lib/          # Shared libraries
    └── types/        # Shared types
```

## Backend (Main Process)

- Window creation and lifecycle are handled by `src/main/services/window-manager.ts`.
- App configuration lives in `src/main/config/app-config.ts`.
- Backend use-cases are registered in `src/backend/use-cases/electron-info/index.ts`.
- Backend utilities: `src/backend/lib/` (array, async, ipc, logger, network, etc.)
- IPC helpers: `src/backend/lib/ipc.ts` and `src/main/services/ipc-utils.ts`.
- Logging uses `src/main/services/logger.ts`.

## Frontend (Renderer)

- UI entry point: `src/renderer/index.ts`.
- Home experience and WinBox windows: `src/renderer/pages/home-page.ts`.
- Frontend use-cases registry: `src/frontend/use-cases/electron-info/index.ts`.
- Custom reactivity system: `src/frontend/lib/reactivity.ts`.
- Custom template system: `src/frontend/lib/template.ts`.
- Styling utilities: `src/frontend/lib/styling.ts`, `src/frontend/lib/class-utils.ts`.
- Global styles: `src/renderer/styles/app.css`.

## Build Outputs

- Renderer bundle: `dist/index.html` and related assets via Rsbuild.
- Main bundle: `dist/main/index.js` via `tsconfig.main.json`.
- Preload bundle: `dist/preload.js` via `tsconfig.preload.json`.

## Data Flow Overview

1. `mainUseCaseRegistry` registers IPC handlers on app start.
2. The renderer loads use cases from `useCaseRegistry`.
3. The home page renders cards from the registry and spawns WinBox windows.
4. Optional IPC flows can bridge data between main and renderer through preload.

## Import Aliases

The project uses TypeScript path aliases for cleaner imports:
- `@/backend/lib/*` → `src/backend/lib/*`
- `@/backend/use-cases/*` → `src/backend/use-cases/*`
- `@/frontend/lib/*` → `src/frontend/lib/*`
- `@/frontend/use-cases/*` → `src/frontend/use-cases/*`
- `@/shared/lib/*` → `src/shared/lib/*`

