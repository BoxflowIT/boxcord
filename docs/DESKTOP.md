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

### CI / CD — Automated builds (recommended)

Releases are built automatically via **GitHub Actions** (`.github/workflows/desktop-release.yml`). Just push a tag:

```bash
# Bump version in desktop/package.json first, then:
git tag desktop-v1.13.0
git push origin desktop-v1.13.0
```

The workflow runs three parallel jobs — Linux (`ubuntu-latest`), Windows (`windows-latest`), macOS (`macos-latest`) — and publishes the results to a GitHub Release automatically. Artifacts:

| Platform | Output |
|---|---|
| Linux | `Boxcord-1.13.0.AppImage`, `boxcord_1.13.0_amd64.deb` |
| Windows | `Boxcord Setup 1.13.0.exe` |
| macOS | `Boxcord-1.13.0.dmg` |

No manual icon conversion needed — `electron-builder` auto-converts `icon-1024.png` to `.ico` (Windows runner) and `.icns` (macOS runner).

### Local builds

```bash
cd desktop
yarn build:linux    # → out/Boxcord-1.12.0.AppImage + .deb
yarn build:win      # → out/Boxcord Setup 1.12.0.exe  (Windows or cross-compile)
yarn build:mac      # → out/Boxcord-1.12.0.dmg        (macOS only)
```

The production URL is injected via `BOXCORD_URL` env var (defaults to `http://localhost:5173` for dev). The CI workflow sets `BOXCORD_URL=https://chat.boxflow.se` automatically.

### Icons

All platforms use `build/icon-1024.png` (1024×1024) as the source. `electron-builder` converts it to the required format per platform. The tray icon uses `build/icon-256.png`.

Icon PNGs are marked as `asarUnpack` in `package.json` so they are extracted outside the asar archive at build time. The `getAssetPath()` helper in `main.ts` and `tray.ts` resolves to the unpacked path in production and the regular path in development. This is required on Linux where BrowserWindow and Tray cannot reliably read icons from inside asar.

### macOS code signing (optional)

The macOS build runs without code signing by default (`CSC_IDENTITY_AUTO_DISCOVERY=false`). For a signed + notarized DMG (required for distribution outside your org), add these secrets to the GitHub repo:

| Secret | Value |
|---|---|
| `CSC_LINK` | Base64-encoded `.p12` certificate |
| `CSC_KEY_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID email (for notarization) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | Developer Team ID |

Then remove the `CSC_IDENTITY_AUTO_DISCOVERY: 'false'` line from the workflow.

### Auto-update (GitHub Releases)

The desktop app checks for updates every 4 hours via `electron-updater`:

1. Checks the GitHub Release matching `build.publish` in `package.json`
2. Downloads the update in the background
3. Fires `update:downloaded` event → shows notification banner in the UI
4. Installs on next restart (or when user clicks "Install update")

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
|Update|`onUpdateAvailable(cb)`, `onUpdateDownloaded(cb)`, `onUpdateError(cb)`|listener|
|Update|`installUpdate()`|send|
|Cache|`clearCache()`|invoke|
|Store|`storeGet(key)`, `storeSet(key, value)`|invoke/send|
|External|`openExternal(url)`|invoke|

## Sync Strategy

**Zero extra work.** Desktop and web are the same app:

- Same JWT auth → same API
- Same WebSocket connection → real-time sync
- Same React Query cache → same UI state
- Desktop-specific features (notifications, tray, webview) degrade gracefully in browser

## Session Persistence

The desktop app keeps users logged in across restarts:

1. **Cognito session restore** — On startup, `restoreSession()` in `App.tsx` calls `getCurrentSession()` which uses the Cognito SDK refresh token (stored in localStorage by the SDK) to obtain a fresh ID token. Users stay logged in for up to 30 days without re-entering credentials.
2. **Auto-refresh on 401** — If a request returns 401, the API service automatically tries to refresh the token via `refreshAuthToken()` before logging out. This handles mid-session token expiry transparently.
3. **Cache management** — Logout clears React Query cache and Electron HTTP cache via `clearCache()` IPC to prevent stale data.

## Notification Click Navigation

Desktop notifications include a tag (`channel-{id}` or `dm-{id}`). When the user clicks a notification, the `onNotificationClicked` handler in `Chat.tsx` parses the tag and navigates to the correct channel or DM.

## Update Banner

When `electron-updater` downloads a new version, the `UpdateBanner` component appears at the top of the chat page showing "Version X.Y.Z is ready — restart to update" with a restart button. Errors from the update process are also captured via `onUpdateError` IPC.

## Security

- **contextIsolation: true** — Renderer cannot access Node.js APIs
- **nodeIntegration: false** — No `require()` in renderer
- **contextBridge** — Only whitelisted IPC methods exposed
- **webview partition** — Microsoft auth cookies isolated from main session
- **Single instance lock** — Prevents duplicate windows
- **External links** — All non-app URLs open in default browser via `shell.openExternal`
- **URL validation** — Only `http://` and `https://` schemes allowed for `shell.openExternal` and `will-navigate`
- **Global navigation guard** — `web-contents-created` listener blocks non-HTTP navigations on all webContents
