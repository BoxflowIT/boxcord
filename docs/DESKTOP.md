# Boxcord Desktop App

Electron-based desktop wrapper for Boxcord. Provides native OS integration and SharePoint embedding via `<webview>`.

## Why Desktop?

|Feature|Web|Desktop|
|---|---|---|
|SharePoint embedding|❌ CSP blocks iframe|✅ `<webview>` bypasses CSP|
|Native notifications|Browser-level|OS-native with click-to-focus|
|System tray|—|✅ Minimize to tray|
|Auto-update|Server deploy|✅ Download + auto-install|
|Taskbar badge|—|✅ Unread count badge|
|Window state|Lost on close|✅ Persisted (size, position)|

## Architecture

```text
desktop/
├── package.json              # Electron + electron-builder config
├── tsconfig.main.json        # Main process TypeScript
├── tsconfig.preload.json     # Preload script TypeScript
├── build/                    # App icons (ico, icns, png)
├── scripts/
│   └── dev.mjs               # Dev launcher (ESM)
└── src/
    ├── main/
    │   ├── main.ts           # Main process — BrowserWindow, IPC, lifecycle
    │   ├── tray.ts           # System tray icon + context menu
    │   ├── notifications.ts  # Native notification handlers
    │   └── store.ts          # electron-store for persistent settings
    └── preload/
        ├── package.json      # { "type": "commonjs" } — forces CJS output
        └── preload.ts        # contextBridge — safe API for renderer
```

## How It Works

```text
┌─────────────────────────────────────────────┐
│  Electron Main Process                      │
│                                             │
│  BrowserWindow loads → APP_URL              │
│    • Production: https://chat.boxflow.se    │
│    • Dev: http://localhost:5173             │
│                                             │
│  Same React app, same API, same WebSocket   │
│  Zero code duplication                      │
└─────────────────┬───────────────────────────┘
                  │ IPC (contextBridge)
┌─────────────────▼───────────────────────────┐
│  Renderer Process (React app)               │
│                                             │
│  window.electronAPI available?              │
│    → Yes: use native features               │
│    → No: regular web browser behavior       │
│                                             │
│  HelloFlowView:                             │
│    Desktop → <webview> (embedded SP)        │
│    Web → link to open in new tab            │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Loads deployed URL** — Desktop app is a thin wrapper around the web app. No bundled frontend code. Updates to the web app are instantly reflected.
2. **`contextBridge` only** — No `nodeIntegration`, no `require()` in renderer. All IPC goes through the typed `electronAPI` bridge.
3. **`webviewTag: true`** — Enables `<webview>` for SharePoint. The `persist:microsoft` partition shares Microsoft auth cookies across webview instances.
4. **Single instance** — `requestSingleInstanceLock()` prevents multiple Boxcord windows. Second launch focuses existing window.
5. **`Node16` module strategy** — Both `tsconfig.main.json` and `tsconfig.preload.json` use `module: "Node16"` / `moduleResolution: "Node16"`. Main process outputs ESM (root `package.json` has `"type": "module"`). Preload outputs CJS via a local `src/preload/package.json` with `{"type": "commonjs"}` — required by Electron's context bridge.
6. **`setDisplayMediaRequestHandler`** — Screen sharing uses the modern Electron API. The renderer calls standard `getDisplayMedia()`, while the main process intercepts the request and picks a source via `desktopCapturer.getSources()`. No custom IPC needed.

## Development

### Prerequisites

- Backend running: `yarn dev` (root)
- Frontend running: `cd client && yarn dev`

### Start Desktop

```bash
cd desktop
yarn install
yarn dev
```

This compiles TypeScript and starts Electron pointed at `localhost:5173`.

### Available Scripts

|Command|Description|
|---|---|
|`yarn dev`|Compile + start Electron (dev mode)|
|`yarn build`|Compile TypeScript only|
|`yarn build:win`|Build Windows installer (.exe)|
|`yarn build:mac`|Build macOS package (.dmg)|
|`yarn build:linux`|Build Linux packages (.AppImage + .deb)|
|`yarn build:all`|Build for all platforms|
|`yarn typecheck`|TypeScript validation|
|`yarn clean`|Remove dist/ and out/|

## Building Releases

### 1. Add app icons

Place icons in `build/`:

- `icon.png` — 512×512 PNG (Linux)
- `icon.ico` — 256×256 ICO (Windows)
- `icon.icns` — macOS icon set
- `tray-icon.png` — 16×16 or 22×22 PNG (system tray)

### 2. Set production URL

In `desktop/src/main/main.ts`, the `APP_URL` defaults to `http://localhost:5173`. For production builds, set via environment:

```bash
BOXCORD_URL=https://chat.boxflow.se yarn build:all
```

Or hardcode in `main.ts` before building.

### 3. Build

```bash
cd desktop
yarn build:linux    # → out/Boxcord-1.12.0.AppImage + .deb
yarn build:win      # → out/Boxcord Setup 1.12.0.exe
yarn build:mac      # → out/Boxcord-1.12.0.dmg
```

### 4. Auto-update (GitHub Releases)

electron-builder publishes to GitHub Releases. When a new release is created:

1. Desktop app checks every 4 hours
2. Downloads update in background
3. Shows notification via `update:downloaded` event
4. Installs on next app restart (or user clicks "Install update")

Configure in `package.json` → `build.publish`:

```json
{
  "provider": "github",
  "owner": "BoxflowIT",
  "repo": "boxcord"
}
```

## Client-Side Integration

### Platform Detection

```typescript
// client/src/utils/platform.ts
import { isDesktop, getElectronAPI } from '../utils/platform';

if (isDesktop()) {
  const api = getElectronAPI()!;
  api.showNotification({ title: 'Nytt meddelande', body: 'Från Anna' });
  api.setBadgeCount(3);
}
```

### useDesktop Hook

```typescript
// client/src/hooks/useDesktop.ts
const { isDesktop, canEmbed, version, updateReady, installUpdate } = useDesktop();

// SharePoint embedding
if (canEmbed) {
  // Render <webview> instead of external link
}

// Update banner
if (updateReady) {
  // Show "Version {updateReady} ready — click to install"
}
```

### Screen Sharing

Screen sharing works identically in web and desktop. The client calls the standard browser API:

```typescript
// client/src/services/voice/videoManager.ts
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: true,
  audio: false
});
```

In Electron, `session.setDisplayMediaRequestHandler` in the main process intercepts the call and selects a source via `desktopCapturer.getSources()`. The renderer never touches Electron-specific APIs — all screen sharing code is platform-agnostic.

### SharePoint Webview

In desktop mode, `HelloFlowView` renders:

```tsx
<webview
  src="https://boxflow.sharepoint.com/sites/HelloFlow"
  partition="persist:microsoft"
  allowpopups="true"
/>
```

The `persist:microsoft` partition keeps Microsoft auth cookies, so users don't need to re-login to SharePoint after authenticating once.

## Preload IPC API

The preload script exposes these methods via `window.electronAPI`:

|Category|Method|Type|
|---|---|---|
|Platform|`isDesktop()`|invoke → boolean|
|Platform|`getVersion()`|invoke → string|
|Platform|`getPlatform()`|invoke → string|
|Window|`minimize()`, `maximize()`, `close()`|send|
|Notifications|`showNotification(payload)`|send|
|Notifications|`flashFrame()`|send|
|Notifications|`onNotificationClicked(cb)`|listener|
|Badge|`setBadgeCount(count)`|send|
|Webview|`canEmbed()`|invoke → boolean|
|Update|`onUpdateAvailable(cb)`, `onUpdateDownloaded(cb)`|listener|
|Update|`installUpdate()`|send|
|Store|`storeGet(key)`, `storeSet(key, value)`|invoke/send|
|External|`openExternal(url)`|invoke|

## Sync Strategy

**Zero extra work.** Desktop and web are the same app:

- Same JWT auth → same API
- Same WebSocket connection → real-time sync
- Same React Query cache → same UI state
- Desktop-specific features (notifications, tray, webview) degrade gracefully in browser

## Security

- **contextIsolation: true** — Renderer cannot access Node.js APIs
- **nodeIntegration: false** — No `require()` in renderer
- **contextBridge** — Only whitelisted IPC methods exposed
- **webview partition** — Microsoft auth cookies isolated from main session
- **Single instance lock** — Prevents duplicate windows
- **External links** — All non-app URLs open in default browser via `shell.openExternal`
- **URL validation** — `shell.openExternal` only allows `http://` and `https://` schemes
