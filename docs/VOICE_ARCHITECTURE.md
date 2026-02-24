# Voice & Audio System - Architecture

## Overview

Refactored voice and audio system following clean architecture principles with proper separation of concerns.

## Structure

### Core Utilities (`utils/`)

**audioPipeline.ts** - Centralized audio processing

- `createAudioPipeline()` - Creates Discord-quality processing chain
- `updateOutputGain()` - Dynamic gain adjustment
- `cleanupAudioPipeline()` - Resource cleanup
- Pipeline: Pre-gain → HPF → Noise Gate → Compression → Limiting → Output

**rnnoise.ts** - AI noise suppression

- `initializeRNNoise()` - Loads WASM binary
- `applyRNNoise()` - Applies AI processing to MediaStream
- `cleanupRNNoise()` - Cleanup
- Uses @sapphi-red/web-noise-suppressor

**voiceSound.ts** - Sound effects

- `playVoiceJoinSound()` - Web Audio API generated tone
- `playVoiceLeaveSound()` - Web Audio API generated tone

### Custom Hooks (`hooks/`)

**useAudioDevices.ts** - Device management

- Enumerates input/output devices
- Handles permission requests
- Auto-updates on device changes
- Returns: `{ inputDevices, outputDevices, isLoading, error, refreshDevices }`

**useMicTest.ts** - Mic testing logic

- Manages test state and audio stream
- Applies RNNoise + audio pipeline
- Real-time level monitoring
- Monitoring (hear yourself) support
- Auto-restart on settings change
- Returns: `{ isTesting, micLevel, isMonitoring, startTest, stopTest, toggleTest, toggleMonitoring }`

### UI Components (`components/settings/voice/`)

**DeviceSelector.tsx** - Reusable device dropdown

- Props: `label, devices, selectedDeviceId, onSelect, disabled`
- Used for both input and output device selection

**VolumeSlider.tsx** - Reusable volume control

- Props: `label, value, onChange`
- Displays percentage, 0-100% range

**MicTest.tsx** - Microphone testing

- Props: `micTest` (from useMicTest hook)
- Volume meter with gradient bar
- Test button (start/stop)
- Monitor toggle (hear yourself)

**AudioQualityToggles.tsx** - Quality settings

- Echo cancellation toggle
- Native noise suppression toggle
- **RNNoise AI toggle** (with status badge)
- Auto gain control toggle
- Live preview indicator
- Pipeline info box

**VoiceAudioTab.tsx** - Main orchestrator (100 lines, down from 568)

- Loads settings from store
- Uses custom hooks
- Renders sub-components
- Minimal logic, mostly composition

### Services (`services/`)

**voice.service.ts** - WebRTC management

- Uses centralized audio pipeline utility
- Applies RNNoise if enabled
- Creates audio processing via `createAudioPipeline()`
- Proper cleanup via `cleanupAudioPipeline()`
- Reduced code duplication

### Data Layer (`store/`)

**audioSettingsStore.ts** - Zustand store

- Device IDs (input/output)
- Quality toggles (echo, noise, AGC, **useRNNoise**)
- Volume levels (input/output)
- Testing state
- Persisted to localStorage

**voiceStore.ts** - Zustand store

- Voice/video state management
- Peer connections (SimplePeer instances)
- Local stream and remote streams
- Video window state (mode, position, size, timestamps)
- Mute/deafen state
- Speaking indicators

## Video Communication System

### Video Streaming

**VideoGrid.tsx** - Main video display component

- Renders local and remote video streams
- Supports camera and screen sharing simultaneously
- Always-mounted PiP-specific video elements (off-screen)
- Uses callback refs with `useCallback` for reliable element tracking
- Automatic layout based on participant count
- Fullscreen modal with controls

**useVideoStream.ts** - Video stream management hook

- Handles single video stream setup and teardown
- Automatically selects correct video track (camera vs screen)
- Cleanup on unmount
- Returns: `{ setupStream: (element, stream) => void }`

**useVideoStreams.ts** - Multi-stream orchestration

- Manages local camera and screen share streams
- Coordinates multiple video elements
- Tracks video enabled state per stream type

**useLocalVideoStream.ts** - Local video management

- Dedicated hook for user's own video
- Handles local stream updates
- Mirror effect for local camera

### Video Window Controls

**Video Window Modes:**
- `fullscreen` - Full overlay with controls and video grid
- `minimized` - Small fixed preview in corner
- `floating` - Draggable/resizable window
- `pip` - Browser native Picture-in-Picture

**FloatingVideoWindowNew.tsx** - Floating window component

- Drag to reposition anywhere on screen
- Resize with 8 resize handles (corners + edges)
- Min/max size constraints (300x200 to 1200x900)
- Persists position and size to localStorage
- Click debouncing to prevent mode switching during drag/resize
- Uses `react-draggable` and `react-resizable`

**MinimizedVideoIndicatorNew.tsx** - Minimized preview

- Fixed position in bottom-right corner
- Shows video preview with participant count
- Click to restore to fullscreen
- Compact 256px wide design

**usePictureInPicture.ts** - Browser PiP support

- Native browser Picture-in-Picture API
- Automatic PiP exit when switching modes
- Handles browser PiP controls (play/pause)
- Separate always-mounted video elements for PiP
- Listens to `leavepictureinpicture` event

**useVideoWindowMode.ts** - Mode management

- Centralizes video window mode state
- 200ms click debouncing to prevent rapid mode changes
- Force mode change option for programmatic updates
- Returns mode state and helper booleans

**videoStreamHelpers.ts** - DRY utilities

- `findVideoTrack()` - Select camera vs screen track
- `setupVideoElement()` - Configure video element with stream
- `clearVideoElement()` - Clean up video element
- Reduces code duplication across components

### Technical Implementation

**Callback Refs Pattern:**
```typescript
const cameraRefCallback = useCallback((element: HTMLVideoElement | null) => {
  setVideoElement(element);
}, []);
```

- Prevents stale references when components mount/unmount
- Triggers useEffect hooks when video elements become available
- Avoids infinite re-render loops

**PiP Architecture:**
- Separate video elements always mounted off-screen for PiP
- Main video elements conditionally rendered based on mode
- PiP elements updated via refs to maintain PiP session
- Auto-exit PiP when user switches to other modes

**State Management:**
```typescript
videoWindow: {
  mode: 'fullscreen' | 'minimized' | 'floating' | 'pip',
  previousMode: VideoWindowMode | null,
  floatingPosition: { x: number, y: number },
  floatingSize: { width: number, height: number },
  modeChangedAt: number  // timestamp for debouncing
}
```

## Benefits of Refactoring

### Before

- VoiceAudioTab.tsx: **568 lines** - monolithic, hard to maintain
- voice.service.ts: **Duplicated audio pipeline code**
- No code reuse between mic test and voice calls
- Logic mixed with UI rendering
- Difficult to test individual parts

### After

- VoiceAudioTab.tsx: **~100 lines** - clean orchestrator
- Utilities: **Shared audio pipeline**, no duplication
- Hooks: **Reusable business logic**, testable in isolation
- Components: **Small, focused, composable**
- Easy to extend (add new devices, effects, etc.)
- Easy to test (mock hooks, test utilities independently)

## Data Flow

```
User Action
    ↓
VoiceAudioTab (orchestrator)
    ↓
Hooks (useAudioDevices, useMicTest)
    ↓
Utilities (audioPipeline, rnnoise)
    ↓
Store (audioSettingsStore)
    ↓
Services (voice.service.ts)
    ↓
WebRTC
```

## Testing Strategy

### Utilities (Pure Functions)

- Test `createAudioPipeline()` with mock AudioContext
- Test `applyRNNoise()` with mock streams
- Easy to test in isolation

### Hooks (Custom Hooks)

- Test with `@testing-library/react-hooks`
- Mock MediaDevices API
- Verify state changes

### Components (React Components)

- Test with `@testing-library/react`
- Mock hooks
- Test user interactions

### Integration (E2E)

- Test full flow: settings → mic test → voice call
- Verify audio quality with real devices

## Performance

### Optimizations

- Audio pipeline created once, reused
- RNNoise WASM loaded once at startup
- Device enumeration cached, updated on changes only
- Volume updates use existing pipeline nodes (no recreation)
- Settings changes trigger  targeted restarts only

### Memory Management

- Proper cleanup on unmount
- Stream tracks stopped
- AudioContext closed
- Pipeline nodes disconnected
- RNNoise resources released

## Future Enhancements

### Easy to Add

- More audio effects (reverb, EQ, etc.)
- Device hot-swapping without restart
- Advanced visualizations (spectrogram, waveform)
- Recording functionality
- Audio presets (gaming, streaming, podcast)
- Per-channel audio settings

### Maintainability

- Change audio pipeline → Edit one file (audioPipeline.ts)
- Add device features → Edit useAudioDevices.ts
- Add UI controls → Create new component in voice/
- All components follow same pattern

## Code Quality

### Principles Followed

- **Single Responsibility**: Each file has one clear purpose
- **DRY**: Audio pipeline code not duplicated
- **Separation of Concerns**: UI, logic, data separated
- **Composition**: Small components composed into larger ones
- **Testability**: Pure functions, mockable dependencies
- **Type Safety**: Full TypeScript coverage
- **Documentation**: Clear comments and interfaces

### File Sizes (After Refactoring)

- `VoiceAudioTab.tsx`: ~100 lines (was 568)
- `audioPipeline.ts`: ~140 lines
- `useAudioDevices.ts`: ~80 lines
- `useMicTest.ts`: ~220 lines
- `DeviceSelector.tsx`: ~40 lines
- `VolumeSlider.tsx`: ~20 lines
- `MicTest.tsx`: ~60 lines
- `AudioQualityToggles.tsx`: ~140 lines

**Total**: ~800 lines split across 8 focused files (was ~650 in 2 monolithic files)
**Benefit**: Much easier to navigate, test, and maintain despite slightly higher total line count
