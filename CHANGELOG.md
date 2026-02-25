# Changelog

All notable changes to Boxcord will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-02-25

### Added
- Call hangup sounds for all scenarios (reject, hangup, timeout) (#6)
- Real-time socket events for channel message pin/unpin updates (#6)
- Optimized cache invalidation for DM channels navigation (#6)
- Async cache invalidation for bookmarks (#6)

### Fixed
- Theme and font size persistence on page refresh (JSON parse fix) (#6)
- Keyboard shortcuts panel styling and keybind handling (#6)
- Unused variable cleanup (ESLint) (#6)

### Changed
- Improved DM channels cache for faster navigation (#6)

## [1.4.0] - 2026-02-25

### Added
- Custom keyboard shortcuts system (#227)
- 17+ customizable shortcuts with conflict detection (#227)
- Keyboard shortcuts settings tab (#227)

### Changed
- Keybinds now fully customizable by users (#227)

## [1.3.0] - 2026-02-25

### Added
- Audio quality presets (Low/Balanced/High/Studio) (#226)
- Custom notification sounds (Default, Chime, Bell, Pop, Ding) (#226)
- Sound preview feature for notification sounds (#226)

### Changed
- Enhanced audio settings UI (#226)
- Improved notification settings panel (#226)

## [1.2.0] - 2026-02-25

### Added
- Theme customization (Dark/Medium/Light) (#225)
- Message density settings (Compact/Cozy/Spacious) (#225)
- High contrast mode for accessibility (#225)
- Reduced motion option for accessibility (#225)
- Appearance settings tab (#225)

### Changed
- Settings modal now includes appearance customization (#225)

## [1.1.0] - 2026-02-XX

### Added
- Multi-language support (English, Swedish)
- Real-time voice channels with WebRTC
- AI noise suppression (RNNoise)
- Video calls with screen sharing
- Message reactions and emoji picker
- File attachments and GIF support
- Message pinning and bookmarks
- User profiles and custom status
- Direct Messages (DMs)
- Workspace management

### Changed
- Improved WebSocket performance
- Enhanced UI/UX with Discord-inspired design

## [1.0.0] - 2026-02-XX

### Added
- Initial release
- Basic messaging functionality
- Real-time updates via WebSocket
- AWS Cognito authentication
- PostgreSQL database with Prisma
- React frontend with Vite
- Docker development environment
