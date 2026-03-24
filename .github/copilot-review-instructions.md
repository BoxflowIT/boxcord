# Copilot Code Review Instructions

## Project Context

Boxcord is an internal team communication platform (Discord-like) built with:
- **Backend:** Fastify, Socket.io, Prisma/PostgreSQL, Redis
- **Frontend:** React 18, Vite, Zustand, TailwindCSS
- **Voice:** WebRTC (SimplePeer), full-mesh topology
- **Auth:** AWS Cognito + Microsoft OAuth 2.0

## Review Focus — What to Flag

Flag these issues — they are always worth a comment:
- **Security vulnerabilities** (injection, XSS, auth bypass, exposed secrets)
- **Runtime bugs** (null derefs, race conditions, unhandled promise rejections, infinite loops)
- **Data integrity** (missing transactions, incorrect Prisma queries, cache invalidation bugs)
- **WebRTC reliability** (ICE negotiation errors, peer lifecycle leaks, missing cleanup)
- **Breaking API changes** without backward compatibility
- **Circular dependencies** between modules

## Review Focus — What NOT to Flag

Do not leave comments on the following. These create noise and review loops:
- **Test style preferences** (test naming, assertion phrasing, test structure choices)
- **Comment wording** (unless factually wrong about behavior)
- **Documentation counts** (test counts, line counts) — these drift naturally
- **Import ordering** or formatting — handled by ESLint and Prettier
- **Adding more tests** — suggest only if a critical code path has zero coverage
- **Release PRs** (develop → main) — this code was already reviewed on the feature PR
- **Hypothetical future issues** ("this could break if someone later does X")
- **Minor refactoring suggestions** that don't fix a real problem

## Git Workflow

- Feature branches merge into `develop` via squash merge
- `develop` merges into `main` via merge commit (release)
- Release PRs (develop → main) contain already-reviewed code — keep review minimal

## Conventions

- Conventional commits with emoji prefix (🐛, ✨, ♻️, 🧪, etc.)
- Logger utility instead of console.log
- Zustand for client state, React Query for server state
- Socket handlers separated from business logic
