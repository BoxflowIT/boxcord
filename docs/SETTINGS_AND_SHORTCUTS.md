# Settings & Keyboard Shortcuts

## Advanced Settings

Boxcord includes comprehensive settings organized into dedicated tabs, accessible via the settings button (⚙️) or `Ctrl+,`.

### Settings Tabs

#### � Appearance Tab (#225)

Customize the visual appearance and accessibility of Boxcord.

**Features:**
- **Theme selection** - Choose between Dark (🌙), Medium (🌗), and Light (☀️) themes
- **Message density** - Control message spacing:
  - Compact - Minimal spacing for power users
  - Cozy - Balanced spacing (default)
  - Spacious - Maximum spacing for readability
- **Font size** - Small, Medium, or Large text
- **High contrast mode** - Enhanced contrast for better visibility
- **Reduced motion** - Minimize animations for accessibility
- **Message grouping** - Group consecutive messages from same user
- **Compact mode toggle** - Legacy compact view

**Settings stored in localStorage:**
- `theme` - Theme preference (dark/medium/light)
- `messageDensity` - Spacing preference (compact/cozy/spacious)
- `fontSize` - Text size (small/medium/large)
- `highContrast` - High contrast mode toggle
- `reducedMotion` - Reduced motion toggle
- `messageGrouping` - Message grouping toggle
- `compactMode` - Compact mode toggle

#### 🎥 Video Tab (#223)

Configure video and camera settings for optimal call quality.

**Features:**
- **Camera test** - Preview your camera before joining calls
- **Device selection** - Choose from available video devices
- **Video quality** - Select quality preset:
  - Low: 320x240 @ 24fps
  - Medium: 640x480 @ 24fps (default)
  - High: 1280x720 @ 30fps
- **Mirror video** - Toggle video mirroring (on by default)
- **Live preview** - See changes in real-time

**Settings stored in localStorage:**
- `video-quality` - Quality preset
- `mirror-video` - Mirror toggle
- Selected video device ID

#### � Audio Tab (#226)

Configure audio quality and settings for voice communication.

**Features:**
- **Audio quality presets** - Select quality level:
  - Low: 16kHz, Mono - Optimized for low bandwidth
  - Balanced: 24kHz, Stereo - Good quality (default)
  - High: 48kHz, Stereo - High-quality audio
  - Studio: 48kHz, Stereo - Professional audio quality
- **Device selection** - Choose input/output audio devices
- **Mic testing** - Real-time audio level monitoring
- **Input sensitivity** - Adjust voice activation threshold
- **Output volume** - Control playback volume
- **Monitor mode** - Hear yourself while testing

**Settings stored in localStorage:**
- `audioQualityPreset` - Quality preset selection
- `selectedAudioInputDevice` - Input device ID
- `selectedAudioOutputDevice` - Output device ID

#### 🔔 Notifications Tab (#226)

Customize notification preferences and sounds.

**Features:**
- **Sound toggle** - Enable/disable notification sounds
- **Sound type selection** - Choose from 5 sound options:
  - Default - Standard notification sound
  - Chime - Soft melodic chime
  - Bell - Classic bell sound
  - Pop - Quick pop sound
  - Ding - Simple ding tone
- **Sound preview** - Test sounds before selecting
- **Desktop notifications** - Browser push notifications (if granted)
- **Notification settings** - Per-channel notification preferences

**Settings stored in localStorage:**
- `notificationSoundType` - Selected sound type
- `soundEnabled` - Sound toggle state

#### 🔒 Privacy Tab

Control privacy settings and data preferences.

**Features:**
- Read receipts - Let others see when you've read messages
- Typing indicators - Show typing status to others
- Online status - Display your online/away/offline status
- Activity status - Show what you're currently doing
- Profile visibility - Control who can see your profile
- DM permissions - Who can send you direct messages

#### ⌨️ Keybinds Tab (#227) (#227)

**Fully customizable keyboard shortcuts** with visual recorder and conflict detection.

**Features:**
- **Custom keybinds** - Assign any key combination to 17 actions
- **Visual recorder** - Click to record key combinations
- **Conflict detection** - Real-time warnings for duplicate shortcuts
- **Category filtering** - Filter by Navigation, Messaging, Voice, Reactions, General
- **Reset shortcuts** - Reset individual shortcuts or all to defaults
- **Enable/disable toggle** - Turn shortcuts on/off globally
- **Persistent storage** - Shortcuts saved in localStorage

**Navigation Shortcuts (Default):**
- `Alt+↓` - Next channel (customizable)
- `Alt+↑` - Previous channel (customizable)
- `Ctrl+K` - Search (customizable)

**Messaging Shortcuts (Default):**
- `Ctrl+U` - Upload file (customizable)
- `Ctrl+E` - Emoji picker (customizable)
- `Ctrl+Shift+A` - Mark all as read (customizable)
- `Ctrl+P` - Pin message (customizable)

**Voice Shortcuts (Default):**
- `Ctrl+Shift+M` - Toggle mute (customizable)
- `Ctrl+Shift+D` - Toggle deafen (customizable)
- `Ctrl+Shift+V` - Toggle video (customizable)
- `Ctrl+Shift+S` - Toggle screen share (customizable)
- `Ctrl+Shift+L` - Leave voice channel (customizable)

**Quick Reaction Shortcuts (Default):**
- `1` - React with 👍 (customizable)
- `2` - React with ❤️ (customizable)
- `3` - React with 😂 (customizable)
- `4` - React with 🎉 (customizable)
- `5` - React with 🔥 (customizable)

> **Thread routing:** When the thread sidebar is open, quick reaction shortcuts (1-5) react to the last reply in the active thread instead of the last channel message.

**General Shortcuts:**
- `Ctrl+,` - Open settings (hardcoded, not customizable)
- `Esc` - Close modal/dialog
- `Enter` - Send message
- `Shift+Enter` - New line in message
- `↑` (in empty input) - Edit last message
- `Esc` (while editing) - Cancel edit
- `Tab` - Accept autocomplete suggestion
- `@` - Mention autocomplete
- `/` - Slash command autocomplete

**Settings stored in localStorage:**
- `keyboard-shortcuts` - All custom shortcut mappings
- `keyboard-shortcuts-enabled` - Global enable/disable state

#### 👤 Account Tab

Manage your account settings and preferences.

**Features:**
- Profile information - Name, email, bio
- Avatar upload - Custom profile picture
- Password change - Update your password
- Language preferences - Switch between languages
- Theme settings - Appearance customization
- Account deletion - Permanently delete account

#### ℹ️ About Tab

Version info and update management (desktop only).

**Features:**
- App version display (desktop version vs web)
- "Check for updates" button — manually triggers update check via IPC
- Update status indicators:
  - Downloading version X...
  - Version X ready to install + "Restart now" button
  - Error display with retry option (AlertTriangle icon)
  - Linux manual-install error surfaced via the update banner, which shows the dpkg command with a ClipboardCopy icon
- Privacy & Security information
- Technology Stack information

## Video Quality System

### Architecture

**Components:**
- `VideoTab.tsx` - Settings UI with camera test
- `VideoQualitySelector.tsx` - Live quality switcher in calls
- `videoQuality.ts` - Utility functions and types

### Quality Presets

```typescript
type VideoQuality = 'low' | 'medium' | 'high';

const QUALITY_CONSTRAINTS = {
  low: {
    width: { ideal: 320 },
    height: { ideal: 240 },
    frameRate: { ideal: 24 }
  },
  medium: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 }
  },
  high: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};
```

### Live Quality Switching

**VideoQualitySelector.tsx** - In-call quality control

- Dropdown selector in video controls
- Live switching during active calls
- Restarts video stream with new constraints
- Available resolutions: 360p, 480p, 720p, 1080p
- Smooth transition without disconnecting call

**Implementation:**
```typescript
const changeVideoQuality = (quality: string) => {
  // Parse quality (e.g., "720p" -> 1280x720)
  const constraints = getConstraintsForResolution(quality);
  
  // Restart video track with new constraints
  navigator.mediaDevices.getUserMedia({
    video: constraints
  }).then(newStream => {
    // Replace track in peer connections
    replaceVideoTrack(newStream.getVideoTracks()[0]);
  });
};
```

### Settings Storage

**localStorage keys:**
- `video-quality` - Quality preset (low/medium/high)
- `mirror-video` - Mirror toggle (true/false)
- Selected video device ID

### Use Cases

**Settings Tab (VideoTab.tsx):**
- Test camera before calls
- Choose quality preset for future calls
- Select preferred camera device
- Toggle video mirroring

**Live Call (VideoQualitySelector.tsx):**
- Adjust quality based on network conditions
- Reduce bandwidth usage if needed
- Increase quality for presentations
- Switch between resolutions quickly

## Keyboard Shortcuts Implementation

### Architecture

**useKeyboardShortcuts.ts** - Global shortcuts hook

```typescript
export function useKeyboardShortcuts(options?: {
  onToggleSettings?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+M - Toggle Mute
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
      
      // ... more shortcuts
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dependencies]);
}
```

### Integration

**Chat.tsx** - Main app component

```typescript
function Chat() {
  const [showSettings, setShowSettings] = useState(false);
  
  // Register global shortcuts
  useKeyboardShortcuts({
    onToggleSettings: () => setShowSettings(prev => !prev)
  });
  
  // ...rest of app
}
```

### Shortcut Design Principles

1. **Ctrl+Shift** prefix - Avoids conflicts with browser shortcuts
2. **Mnemonic keys** - M for Mute, V for Video, S for Screen share
3. **Works globally** - Functions anywhere in the app
4. **Visual feedback** - Toast notifications on action
5. **Logged** - Actions logged for debugging

### Conflict Prevention

**Disabled contexts:**
- When typing in input fields (unless specified)
- When modal/dialog is open (except Esc)
- When contentEditable is focused

**Example:**
```typescript
if (
  e.target instanceof HTMLInputElement ||
  e.target instanceof HTMLTextAreaElement
) {
  return; // Ignore shortcuts in text fields
}
```

## Best Practices

### Video Settings

1. **Test before important calls** - Use Video Tab to verify camera
2. **Start with medium quality** - Good balance of quality and bandwidth
3. **Adjust during call** - Increase/decrease based on connection
4. **Mirror local video** - Easier to see yourself naturally

### Keyboard Shortcuts

1. **Learn core shortcuts first**:
   - `Ctrl+Shift+M` - Mute (most used)
   - `Ctrl+,` - Settings
   - `Enter` - Send message
2. **Practice in test calls** - Familiarize yourself with shortcuts
3. **Check Keybinds tab** - Reference when needed

### Privacy Settings

1. **Review defaults** - Check privacy settings after first login
2. **Adjust DM permissions** - Control who can message you
3. **Profile visibility** - Choose what others can see
4. **Regular review** - Revisit settings periodically

## Accessibility

### Keyboard Navigation

- All settings accessible via keyboard
- Tab navigation through all controls
- Enter/Space to activate buttons
- Escape to close dialogs
- Focus indicators visible

### Screen Readers

- ARIA labels on all interactive elements
- Form labels properly associated
- Status announcements for actions
- Descriptive button text

### Visual

- High contrast in dark mode
- Clear focus indicators
- Readable font sizes
- Icon + text labels

## Troubleshooting

### Video Settings Issues

**Camera not detected:**
1. Grant browser camera permissions
2. Check system camera settings
3. Restart browser
4. Try different device

**Poor video quality:**
1. Check network connection
2. Lower quality in settings
3. Close other bandwidth-heavy apps
4. Use wired connection if possible

**Mirror not working:**
1. Toggle mirror setting off and on
2. Refresh page
3. Clear localStorage
4. Check browser compatibility

### Keyboard Shortcut Issues

**Shortcut not working:**
1. Check if input field is focused
2. Verify correct key combination
3. Check browser extensions (may conflict)
4. Reload page

**Accidental triggering:**
1. Be careful with Ctrl+Shift combinations
2. Check for stuck keys
3. Review Keybinds tab for conflicts

## Technical Details

### Video Quality Storage

**localStorage structure:**
```json
{
  "video-quality": "medium",
  "mirror-video": "true",
  "selectedVideoDeviceId": "default"
}
```

### Shortcut Event Flow

```
User presses Ctrl+Shift+M
  ↓
useKeyboardShortcuts catches event
  ↓
Checks if valid context (not in input)
  ↓
Calls voiceStore.setMuted()
  ↓
Updates Zustand state
  ↓
Components re-render with new state
  ↓
Toast notification shown
  ↓
Logger records action
```

### Quality Switching Flow

```
User selects 720p in dropdown
  ↓
changeVideoQuality('720p') called
  ↓
Parse to constraints (1280x720)
  ↓
getUserMedia with new constraints
  ↓
Get new video track
  ↓
Replace track in all peer connections
  ↓
Update local video element
  ↓
Toast notification shown
  ↓
Quality applied instantly
```

## Implementation Details

### Custom Keyboard Shortcuts System (#227)

**Architecture:**
- `keyboardShortcutsStore.ts` - Zustand store with persist middleware
- `KeyRecorder.tsx` - Visual key combination recorder component
- `KeybindEditor.tsx` - Individual shortcut editor with conflict detection
- `useKeyboardShortcuts.ts` - Global keyboard event handler hook

**Key Features:**
- Records modifier keys (Ctrl, Shift, Alt) and main key
- Maps special keys (arrows → ↑↓←→, space → Space)
- Validates shortcuts (requires modifier + key OR special key alone)
- Checks typing context (ignores shortcuts in input fields)
- Real-time conflict detection across all shortcuts
- Category-based organization (5 categories)
- Individual and bulk reset functionality

**Storage Format:**
```json
{
  "shortcuts": {
    "toggle-mute": {
      "keys": "Ctrl+Shift+M",
      "description": "Toggle microphone mute",
      "category": "voice",
      "customizable": true
    }
  },
  "enabled": true
}
```

### Audio Quality System (#226)

**Quality Presets:**
```typescript
type AudioQuality = 'low' | 'balanced' | 'high' | 'studio';

const presets = {
  low: { sampleRate: 16000, channelCount: 1, bitrate: 32000 },
  balanced: { sampleRate: 24000, channelCount: 2, bitrate: 64000 },
  high: { sampleRate: 48000, channelCount: 2, bitrate: 96000 },
  studio: { sampleRate: 48000, channelCount: 2, bitrate: 128000 }
};
```

**Components:**
- `AudioQualityPresetSelector.tsx` - Preset selection UI
- `NotificationSoundSelector.tsx` - Sound type selection with preview
- `audioSettingsStore.ts` - Audio state management
- `notificationSound.ts` - Sound playback utilities

### Message Density System (#225)

**CSS Variable System:**
```typescript
const spacing = {
  compact: { messageGap: '4px', padding: '8px' },
  cozy: { messageGap: '8px', padding: '12px' },
  spacious: { messageGap: '16px', padding: '16px' }
};
```

Applied via CSS custom properties:
- `--message-gap` - Spacing between messages
- `--message-padding` - Padding around message content

**Theme System:**
- `dark` - Dark background (#1e1e2e), light text
- `medium` - Medium background (#2a2a3a), balanced contrast
- `light` - Light background (#f5f5f5), dark text

### Accessibility Modes (#225)

**High Contrast:**
- Adds `.high-contrast` class to document root
- Increases border visibility
- Enhances color contrast ratios
- Improves focus indicator visibility

**Reduced Motion:**
- Adds `.reduced-motion` class to document root
- Disables or reduces animations
- Replaces transitions with instant changes
- Improves experience for vestibular disorders

## Future Enhancements

### Planned Settings

- [ ] Per-workspace settings
- [ ] Import/export settings
- [ ] Cloud sync for settings
- [ ] Notification scheduling
- [ ] Advanced audio filters

### Planned Shortcuts

- [ ] Channel-specific shortcuts
- [ ] Workspace switcher shortcuts
- [ ] Search history navigation
- [ ] Custom macro shortcuts

### Quality Improvements

- [ ] Adaptive quality based on network
- [ ] Bandwidth usage indicator
- [ ] Quality presets per network type
- [ ] Advanced manual controls (bitrate, etc.)
- [ ] Quality statistics overlay
