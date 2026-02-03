# Security

This project is designed to support Electron security best practices, but some settings are currently relaxed for development. Use this checklist to harden production builds.

## Recommended Defaults

- `nodeIntegration: false`
- `contextIsolation: true`
- `webSecurity: true`
- Preload script enabled with a strict, minimal API surface

The `WindowManager` class already defaults to these values, but `src/main/config/app-config.ts` overrides them. Update `appConfig.mainWindow.webPreferences` if you need these stricter settings.

## Preload Guidance

- Keep preload APIs minimal and explicit.
- Whitelist channels and avoid arbitrary message passing.
- Use `contextBridge.exposeInMainWorld` in `src/renderer/preload.ts`.

## IPC Guidance

- Prefer `ipcMain.handle` with input validation.
- Avoid sending entire objects from untrusted renderer input without sanitizing.
- Document IPC channel names and expected payloads.

## Distribution Considerations

- Code signing is not configured by default.
- Review electron-builder targets in `package.json` before releasing.
