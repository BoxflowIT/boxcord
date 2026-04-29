# Contributing to Boxcord

This guide explains our development workflow, git strategy, and code quality standards.

> 📚 **For comprehensive Git workflow documentation including branch protection, security guidelines, and troubleshooting, see [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)**

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

| Type | Emoji | Description | Example |
|------|-------|-------------|---------|
| `feat` | ✨ | New feature | `✨ feat: add retry logic for Giphy API (#230)` |
| `fix` | 🐛 | Bug fix | `🐛 fix: resolve socket reconnection issue (#231)` |
| `refactor` | ♻️ | Code refactoring | `♻️ refactor(backend): convert console to logger (#232)` |
| `docs` | 📝 | Documentation | `📝 docs: update architecture diagrams (#233)` |
| `test` | 🧪 | Tests | `🧪 test: add E2E tests for video calls (#234)` |
| `chore` | 🔧 | Maintenance | `🔧 chore: update dependencies (#235)` |
| `perf` | ⚡ | Performance | `⚡ perf: optimize database queries (#236)` |
| `style` | 💄 | Formatting | `💄 style: fix linting errors (#237)` |
| `ci` | 👷 | CI/CD | `👷 ci: update GitHub Actions workflow (#238)` |
| `merge` | 🔀 | Merge commits | `🔀 merge: Phase 1 into main (v1.2.0) (#239)` |

**Note:** Emojis are automatically added by the `prepare-commit-msg` hook.

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

**Examples:**
```bash
✅ feat: add video window controls with PiP support
✅ fix: resolve Giphy API rate limiting errors
✅ refactor: convert console.log to structured logger
✅ 🔀 merge: Phase 1 - Appearance Settings into main (v1.2.0)
```

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

- **Copilot Code Review** runs automatically on all PRs (inline comments, security, best practices)
- **Self-review** your changes first
- **Request reviews** from team members
- **Address feedback** from both Copilot and human reviewers promptly
- **Keep PR updated** with develop if needed

> 🤖 **Copilot Code Review** is enabled org-wide for all BoxflowIT repositories.
> It reviews every PR automatically and provides inline suggestions for bugs,
> security issues, performance, and code quality. You can also request a manual
> Copilot review from the Reviewers panel on any PR.

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

**For develop → main (Release):**
```bash
# Merge develop to main (triggers automated version bump)
git checkout main
git merge --no-ff develop -m "🔀 merge: release into main"
git push origin main

# 🤖 GitHub Actions will automatically:
# - Analyze commits and bump version (feat=minor, fix=patch)
# - Update package.json files
# - Create git tag (v1.7.0)
# - Commit and push to main

# Then sync main back to develop
git checkout develop
git merge main
git push origin develop
```

**Automated Version Bumping:**
- `feat:` commits → Minor (1.6.0 → 1.7.0)
- `fix:` commits → Patch (1.6.0 → 1.6.1)
- `BREAKING CHANGE:` → Major (1.6.0 → 2.0.0)

See [GIT_WORKFLOW.md](./GIT_WORKFLOW.md#release-process) for details.

---

## ✨ Code Quality

### Automated Git Hooks

Our repository uses automated git hooks to ensure all commits follow CONTRIBUTING.md standards:

#### prepare-commit-msg (Automatic)
**Runs BEFORE you edit the commit message**

- ✨ Automatically adds emoji based on commit type

**What it does:**
```bash
# You write:
feat(frontend): add dark mode

# Hook transforms to:
✨ feat(frontend): add dark mode
```

#### commit-msg (Validation)
**Runs AFTER you write the commit message**

- ✅ Validates conventional commit format
- ✅ Warns if subject line is too long (>72 chars)
- ❌ Rejects commits that don't follow format

**Validation rules:**
- Must have valid type: `feat|fix|refactor|docs|test|chore|perf|style|ci|merge`
- Emoji is optional but recommended

**Example workflow:**
```bash
# 1. Make changes
git add .

# 2. Just write a simple commit message
git commit -m "feat: add dark mode"

# 3. Hooks automatically:
#    - Add emoji: ✨
#    - Validate format

# Final commit message:
# ✨ feat: add dark mode
```

### Pre-commit Hooks

Automatically runs on `git commit`:
- Lint-staged (ESLint + Prettier formatting)

### Pre-push Hooks

Automatically runs on `git push`:
- Backend: TypeScript check (`tsc --noEmit`)
- Frontend: TypeScript check (`tsc --noEmit`)

Full tests run in CI, not locally.

**Skip hooks (emergency only):**
```bash
git commit --no-verify  # Skip all commit hooks
git push --no-verify    # Skip push hooks
```

⚠️ **Warning:** Only use `--no-verify` in emergencies. Hooks enforce quality standards.

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
- Unit tests (`vitest run`) - 113 passing
- No console.log statements (use logger)

✅ **Frontend:**
- TypeScript compilation (`tsc --noEmit`)
- ESLint (`eslint src/`)
- Unit tests (`vitest run`) - 84 passing
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
