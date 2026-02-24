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
