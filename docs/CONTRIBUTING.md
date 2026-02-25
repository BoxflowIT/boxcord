# Contributing to Boxcord

This guide explains our development workflow, git strategy, and code quality standards.

## 📋 Table of Contents

1. [Git Workflow](#git-workflow)
2. [Branch Strategy](#branch-strategy)
3. [Commit Guidelines](#commit-guidelines)
4. [Pull Request Process](#pull-request-process)
5. [Code Quality](#code-quality)
6. [Testing Requirements](#testing-requirements)

---

## 🌳 Git Workflow

We use a **trunk-based development** workflow with feature branches:

```
main (production)
  ↑
develop (staging)
  ↑
feature/*, refactor/*, fix/* (short-lived branches)
```

### Branch Overview

- **`main`** - Production-ready code, deployed automatically
- **`develop`** - Integration branch, deployed to staging
- **`feature/*`** - New features and enhancements
- **`refactor/*`** - Code improvements without behavior changes
- **`fix/*`** - Bug fixes
- **`hotfix/*`** - Emergency production fixes (branch from `main`)

---

## 🌿 Branch Strategy

### Creating a Branch

```bash
# Always branch from develop (unless hotfix)
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Or refactor branch
git checkout -b refactor/cleanup-services

# Or fix branch
git checkout -b fix/socket-reconnect-issue
```

### Branch Naming Convention

**Format:** `type/brief-description`

**Examples:**
- ✅ `feature/video-window-controls`
- ✅ `refactor/backend-cleanup`
- ✅ `fix/giphy-rate-limiting`
- ✅ `hotfix/critical-security-patch`
- ❌ `my-branch` (no type)
- ❌ `feature/FIX_STUFF` (use lowercase)

### Branch Lifetime

- **Keep branches short-lived** (< 1-2 days)
- **Merge frequently** to avoid long-lived branches
- **Delete after merge** to keep repo clean

```bash
# After branch is merged
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

---

## 💬 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for standardized commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add retry logic for Giphy API` |
| `fix` | Bug fix | `fix: resolve socket reconnection issue` |
| `refactor` | Code refactoring | `refactor(backend): convert console to logger` |
| `docs` | Documentation | `docs: update architecture diagrams` |
| `test` | Tests | `test: add E2E tests for video calls` |
| `chore` | Maintenance | `chore: update dependencies` |
| `perf` | Performance | `perf: optimize database queries` |
| `style` | Formatting | `style: fix linting errors` |
| `ci` | CI/CD | `ci: update GitHub Actions workflow` |

### Scope (Optional)

Specify what part of the codebase is affected:

- `backend` - Backend services
- `frontend` - Client code
- `api` - REST API
- `websocket` - WebSocket functionality
- `tests` - Test code
- `docs` - Documentation

**Examples:**
```bash
feat(backend): add Redis pub/sub for horizontal scaling (#230)
fix(frontend): resolve video grid layout issues (#229)
refactor(websocket): improve connection handling (#228)
test(api): add unit tests for bookmark service (#231)
```

### Subject

- **Imperative mood** - "add" not "added" or "adds"
- **Lowercase** - Start with lowercase letter
- **No period** - Don't end with `.`
- **Max 72 characters** - Keep it concise

✅ **Good:**
```
feat: add video window controls with PiP support (#224)
fix: resolve Giphy API rate limiting errors (#223)
refactor: convert console.log to structured logger (#220)
```

❌ **Bad:**
```
Added new feature for videos
Fixed stuff
Update code
```

### Body (Optional but Recommended)

Explain **what** and **why**, not **how**.

```
feat: add retry logic and caching for Giphy API

- Create retry utility with exponential backoff (2s, 4s, 8s)
- Handle rate limiting errors (425, 429, 503) automatically
- Add 5-minute cache for GIF results to reduce API calls
- Graceful fallback when all retries fail

Fixes #42
```

### Footer (Optional)

Reference issues, breaking changes, or co-authors:

```
Fixes #123
Closes #456
BREAKING CHANGE: API endpoint changed from /v1 to /v2
Co-authored-by: Name <email@example.com>
```

### 🚨 PR Numbers (MANDATORY)

**ALL commits MUST include the GitHub PR/issue number at the end of the subject line.**

This is required for:
- **Searchability** - Find all commits related to a PR/issue
- **Traceability** - Link code changes to discussions and reviews
- **Audit trail** - Understand context of changes months later

**Format:** `<type>(<scope>): <subject> (#PR_NUMBER)`

**Examples:**
```bash
✅ feat: add video window controls with PiP support (#224)
✅ fix: resolve Giphy API rate limiting errors (#223)
✅ refactor: convert console.log to structured logger (#220)
✅ 🔀 merge: Phase 1 - Appearance Settings into main (v1.2.0) (#225)
```

**Invalid commits (will be rejected):**
```bash
❌ feat: add video window controls with PiP support
❌ fix: resolve Giphy API rate limiting errors
❌ merge: Phase 1 - Appearance Settings into main
```

**Why this matters:**
- When reviewing code months later, you can instantly find the discussion/review
- GitHub search works: searching "#225" shows all related commits
- Release notes generation becomes automated
- Bug tracking connects commits to issues

### 🚨 PR Numbers (MANDATORY)

**ALL commits MUST include the GitHub PR/issue number at the end of the subject line.**

This is required for:
- **Searchability** - Find all commits related to a PR/issue
- **Traceability** - Link code changes to discussions and reviews
- **Audit trail** - Understand context of changes months later

**Format:** `<type>(<scope>): <subject> (#PR_NUMBER)`

**Examples:**
```bash
✅ feat: add video window controls with PiP support (#224)
✅ fix: resolve Giphy API rate limiting errors (#223)
✅ refactor: convert console.log to structured logger (#220)
✅ 🔀 merge: Phase 1 - Appearance Settings into main (v1.2.0) (#225)
```

**Invalid commits (will be rejected):**
```bash
❌ feat: add video window controls with PiP support
❌ fix: resolve Giphy API rate limiting errors
❌ 🔀 merge: Phase 1 - Appearance Settings into main (v1.2.0)
```

**Note:** Even single commits on feature branches need PR numbers, as they will be part of the merge commit history.

---

## 🔄 Pull Request Process

### Before Creating a PR

1. **Update from develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-branch
   git merge develop
   ```

2. **Run all checks:**
   ```bash
   # Backend checks
   yarn tsc --noEmit
   yarn lint
   yarn test

   # Frontend checks
   cd client
   yarn tsc --noEmit
   yarn lint
   yarn test
   ```

3. **Clean up commits** (optional but recommended):
   ```bash
   # Interactive rebase to squash/edit commits
   git rebase -i develop
   ```

### Creating the PR

1. **Push your branch:**
   ```bash
   git push -u origin your-branch
   ```

2. **Create PR on GitHub:**
   - Base: `develop` (not `main`)
   - Title: Use conventional commit format
   - Description: Explain changes, add screenshots if UI changes
   - Link related issues

3. **PR Title Examples:**
   ```
   feat: Add video window controls with minimize, float, resize, and PiP modes (#224)
   fix: Resolve Giphy API rate limiting with retry logic (#223)
   refactor: Systematic backend cleanup with structured logging (#220)
   ```

### PR Review Process

- **Self-review** your changes first
- **Request reviews** from team members
- **Address feedback** promptly
- **Keep PR updated** with develop if needed

### Merging Strategy

**For feature branches:**
```bash
# Squash and merge (recommended for small features)
git checkout develop
git merge --squash feature/your-feature
git commit -m "feat: descriptive commit message"

# Or merge with merge commit (for larger features)
git merge --no-ff feature/your-feature
```

**For develop → main:**
```bash
# Always use merge commit to preserve history
git checkout main
git merge --no-ff develop -m "chore: Release vX.X.X"
```

---

## ✨ Code Quality

### Pre-commit Hooks

Automatically runs on `git commit`:
- Lint-staged (ESLint + formatting)
- Type checking where applicable

### Pre-push Hooks

Automatically runs on `git push`:
- Backend: TypeScript check, ESLint, tests
- Frontend: TypeScript check, ESLint, tests

**Skip hooks (emergency only):**
```bash
git commit --no-verify
git push --no-verify
```

### Code Style

- **TypeScript** - Prefer explicit types, avoid `any`
- **Naming** - camelCase for variables, PascalCase for components
- **Imports** - Organize imports logically
- **Comments** - Explain "why", not "what"
- **Console logs** - Use logger utility, not `console.log`

---

## 🧪 Testing Requirements

### Before Merging

All PRs must pass:

✅ **Backend:**
- TypeScript compilation (`tsc --noEmit`)
- ESLint (`eslint src/`)
- Unit tests (`vitest run`) - 61/61 passing
- No console.log statements (use logger)

✅ **Frontend:**
- TypeScript compilation (`tsc --noEmit`)
- ESLint (`eslint src/`)
- Unit tests (`vitest run`) - 61/61 passing
- No console.log statements (use logger)

✅ **Integration:**
- E2E tests pass (when applicable)
- Manual testing completed
- No breaking changes (or documented)

### Writing Tests

- **Unit tests** - Test individual functions/components
- **Integration tests** - Test feature workflows
- **E2E tests** - Test critical user journeys

See [TESTING.md](TESTING.md) for detailed testing guide.

---

## 🚀 Quick Reference

### Starting New Work

```bash
# 1. Update develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/awesome-feature

# 3. Make changes and commit
git add .
git commit -m "feat: add awesome feature"

# 4. Push and create PR
git push -u origin feature/awesome-feature
```

### Common Git Commands

```bash
# Update current branch with develop
git checkout develop && git pull
git checkout your-branch
git merge develop

# Squash last 3 commits
git rebase -i HEAD~3

# Amend last commit
git commit --amend

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Stash changes temporarily
git stash
git stash pop
```

### Cleaning Up Branches

```bash
# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Clean up old remote tracking branches
git fetch --prune
```

---

## 🤝 Getting Help

- **Questions?** Open a discussion on GitHub
- **Found a bug?** Create an issue with reproduction steps
- **Security issue?** Email security@boxflow.se (do not open public issue)

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
- [Semantic Versioning](https://semver.org/)

---

**Happy coding! 🎉**
