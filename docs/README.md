# Boxcord Documentation

Welcome to the Boxcord documentation! This directory contains comprehensive guides for developers, operators, and contributors.

## 📚 Documentation Index

### 🚀 Getting Started

Start here if you're new to Boxcord:

1. [**Development Setup**](DEVELOPMENT.md) - Local environment setup with Docker
2. [**Contributing Guide**](CONTRIBUTING.md) - Git workflow, commit guidelines, code quality standards
3. [**Features Overview**](FEATURES.md) - Complete list of all features and capabilities
4. [Architecture Overview](ARCHITECTURE.md) - Understand the WebSocket-first design
5. [Testing Guide](TESTING.md) - Run tests and verify your setup

### 🏗️ Architecture & Design

Deep dive into how Boxcord is built:

- [**Architecture Overview**](ARCHITECTURE.md) - WebSocket-first architecture, data flow patterns
- [**Voice Architecture**](VOICE_ARCHITECTURE.md) - WebRTC, RNNoise AI, audio processing pipeline
- [**Caching Strategy**](CACHING.md) - React Query client-side caching, Redis server-side

### ✨ Features & Integrations

Learn about specific features:

- [**Features Overview**](FEATURES.md) - Complete feature matrix with status
- [**Settings & Shortcuts**](SETTINGS_AND_SHORTCUTS.md) - Advanced settings tabs, keyboard shortcuts, video quality
- [**Thread Support**](THREADS.md) - Threaded conversations, API, WebSocket events, components
- [**API Documentation**](API.md) - Complete REST API reference with examples
- [**GIF Support**](GIF_SUPPORT.md) - Giphy integration setup and configuration
- [**Internationalization (i18n)**](I18N.md) - Multi-language support (English, Swedish)

### ⚡ Performance & Optimization

Make Boxcord fast and efficient:

- [**Performance Optimizations**](PERFORMANCE_OPTIMIZATIONS.md) - Prisma 6, Redis caching, benchmarks
- [**Database Optimization**](DATABASE_INDEX_OPTIMIZATION.md) - Indexes, query optimization
- [**Testing Guide**](TESTING.md) - Unit tests (197 passing), E2E tests, load testing with K6

### 🚀 Production & Operations

Deploy and scale Boxcord:

- [**Infrastructure Setup**](INFRASTRUCTURE_SETUP.md) - Complete deployment guide for 1,000-3,000+ users
- [**Production Deployment**](PRODUCTION.md) - AWS, Docker, environment variables
- [**Scaling Strategy**](SCALING_STRATEGY.md) - Horizontal scaling, load balancing, Redis clustering
- [**Backup & Recovery**](BACKUP_RECOVERY.md) - Database backups, disaster recovery procedures

## 🎯 Quick Navigation

### By Role

**For Developers:**
1. [Development Setup](DEVELOPMENT.md)
2. [Contributing Guide](CONTRIBUTING.md)
3. [API Documentation](API.md)
4. [Architecture Overview](ARCHITECTURE.md)
5. [Features Overview](FEATURES.md)
6. [Testing Guide](TESTING.md)
7. [Caching Strategy](CACHING.md)

**For DevOps/Operations:**
1. [Infrastructure Setup](INFRASTRUCTURE_SETUP.md)
2. [Production Deployment](PRODUCTION.md)
3. [Scaling Strategy](SCALING_STRATEGY.md)
4. [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md)
5. [Backup & Recovery](BACKUP_RECOVERY.md)

**For Product/Business:**
1. [Features Overview](FEATURES.md)
2. [Scaling Strategy](SCALING_STRATEGY.md)
3. [Testing Guide](TESTING.md)

### By Task
setup development environment"**
→ [Development Setup](DEVELOPMENT.md)

**"I want to 
**"I want to contribute code"**
→ [Contributing Guide](CONTRIBUTING.md)

**"I want to deploy to production"**
→ [Production Deployment](PRODUCTION.md)

**"I need to scale to more users"**
→ [Scaling Strategy](SCALING_STRATEGY.md)

**"App is slow, how do I optimize?"**
→ [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) → [Database Optimization](DATABASE_INDEX_OPTIMIZATION.md)

**"How does voice chat work?"**
→ [Voice Architecture](VOICE_ARCHITECTURE.md)

**"I want to add GIF support"**
→ [GIF Support](GIF_SUPPORT.md)

**"How do I add a new language?"**
→ [Internationalization](I18N.md)

**"How do keyboard shortcuts work?"**
→ [Settings & Shortcuts](SETTINGS_AND_SHORTCUTS.md)

**"How do I configure video quality?"**
→ [Settings & Shortcuts](SETTINGS_AND_SHORTCUTS.md) → [Voice Architecture](VOICE_ARCHITECTURE.md)

**"How does caching work?"**
→ [Caching Strategy](CACHING.md)

**"How do I run tests?"**
→ [Testing Guide](TESTING.md)

## 📊 Documentation Status

| Document | Status | Last Updated | Completeness |
|----------|--------|--------------|--------------|
| [API.md](API.md) | ✅ Current | Feb 26, 2026 | 100% |
| [INFRASTRUCTURE_SETUP.md](INFRASTRUCTURE_SETUP.md) | ✅ Current | Feb 23, 2026 | 100% |
| [FEATURES.md](FEATURES.md) | ✅ Current | Feb 2026 | 100% |
| [THREADS.md](THREADS.md) | ✅ Current | Feb 26, 2026 | 100% |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ✅ Current | Feb 2026 | 95% |
| [VOICE_ARCHITECTURE.md](VOICE_ARCHITECTURE.md) | ✅ Current | - | 95% |
| [CACHING.md](CACHING.md) | ✅ Current | Feb 2026 | 100% |
| [GIF_SUPPORT.md](GIF_SUPPORT.md) | ✅ Current | Feb 2026 | 100% |
| [I18N.md](I18N.md) | ✅ Current | - | 100% |
| [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) | ✅ Current | - | 100% |
| [DATABASE_INDEX_OPTIMIZATION.md](DATABASE_INDEX_OPTIMIZATION.md) | ✅ Current | Feb 23, 2026 | 100% |
| [TESTING.md](TESTING.md) | ✅ Current | Feb 23, 2026 | 100% |
| [SCALING_STRATEGY.md](SCALING_STRATEGY.md) | ✅ Current | Feb 23, 2026 | 90% |
| [PRODUCTION.md](PRODUCTION.md) | ✅ Current | - | 90% |
| [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) | ✅ Current | - | 85% |

## 🤝 Contributing to Documentation

### Documentation Guidelines

1. **Keep it current** - Update docs when features change
2. **Be comprehensive** - Include examples and use cases
3. **Use clear language** - Write for developers of all levels
4. **Add diagrams** - Visual aids help understanding
5. **Link related docs** - Help readers find related information

### File Naming Convention

- Use `SCREAMING_SNAKE_CASE.md` for doc files
- Be descriptive: `VOICE_ARCHITECTURE.md` not `VOICE.md`
- Use underscores, not hyphens: `GIF_SUPPORT.md` not `GIF-SUPPORT.md`

### Documentation Structure

```markdown
# Title

Brief description of what this document covers.

## Section 1
Content...

## Section 2
Content...

## See Also
- [Related Doc 1](RELATED_DOC_1.md)
- [Related Doc 2](RELATED_DOC_2.md)
```

## 🔗 External Resources

- [Main README](../README.md) - Project overview and quick start
- [Client Components](../client/COMPONENTS.md) - Frontend component documentation
- [GitHub Repository](https://github.com/BoxflowIT/boxcord)

## 📝 Status Markers Legend

Throughout the documentation, we use consistent status markers:

### Feature/Component Status
- ✅ **Completed** - Fully implemented, tested, and production-ready
- ⏳ **In Progress** - Currently being developed or tested
- 🔲 **Planned** - Scheduled for future implementation
- ❌ **Deprecated** - No longer supported or not applicable

### Deployment/Infrastructure Status
- 🏗️ **Deployment Required** - Code ready, needs infrastructure setup
- 🔨 **Development Required** - Code changes needed before deployment

### Checklist Items
- [x] ~~Completed item~~ - Task finished (with strikethrough)
- [ ] Pending item - Task not yet started or in progress

**Example Usage:**
```markdown
## Features
- ✅ Real-time messaging - Live in production
- ⏳ Voice chat improvements - Currently optimizing
- 🔲 Video chat - Planned for Q2 2026

## Deployment Checklist
- ✅ Database optimized
- 🏗️ [ ] Load balancer setup required
- 🔨 [ ] Redis Pub/Sub adapter needs implementation
```

## 📝 Need Help?

If you can't find what you're looking for:

1. Check the [Features Overview](FEATURES.md) - Most comprehensive doc
2. Search the docs with `grep -r "search term" docs/`
3. Check the main [README.md](../README.md)
4. Open an issue on GitHub

---

**Last Updated:** February 26, 2026
