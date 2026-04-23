# Branch Protection & Security Guidelines

## Recommended GitHub Branch Protection Rules

To ensure code quality and prevent accidental force pushes or direct commits to main branches, configure the following branch protection rules in GitHub Settings → Branches.

### Protection for `main` branch

**Navigate to:** Repository Settings → Branches → Add rule for `main`

#### Required Status Checks
- ✅ Require status checks to pass before merging
  - `Test & Lint` (from CI workflow)
  - `Security Audit` (from CI workflow)
  - `Desktop Typecheck` (from CI workflow)
- ✅ Require branches to be up to date before merging

#### Pull Request Requirements
- ✅ Require a pull request before merging
  - Require approvals: **1** (minimum)
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from Code Owners (if CODEOWNERS file is configured)

#### Additional Restrictions
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches (Admins only)

#### Optional but Recommended
- ✅ Require linear history (prevents merge commits)
- ✅ Require signed commits (for enhanced security)
- ⚠️ Allow force pushes: **Disabled**
- ⚠️ Allow deletions: **Disabled**

### Protection for `develop` branch

**Navigate to:** Repository Settings → Branches → Add rule for `develop`

#### Required Status Checks
- ✅ Require status checks to pass before merging
  - `Test & Lint` (from CI workflow)
  - `Security Audit` (from CI workflow)
  - `Desktop Typecheck` (from CI workflow)
- ✅ Require branches to be up to date before merging

#### Enforce for Admins
- ✅ **Do not allow bypassing the above settings** — Admins cannot push to develop unless all CI checks pass. This ensures no untested code reaches develop or main.

#### Pull Request Requirements
- ✅ Require a pull request before merging
  - Require approvals: **0** (optional for faster iteration)
  - Dismiss stale pull request approvals when new commits are pushed

#### Additional Restrictions
- ✅ Require conversation resolution before merging
- ⚠️ Allow force pushes: **Disabled**
- ⚠️ Allow deletions: **Disabled**

---

## Repository Security Features

Enable these security features in GitHub Settings → Security & analysis:

### Dependency Management
- ✅ **Dependabot alerts** - Get notified about vulnerable dependencies
- ✅ **Dependabot security updates** - Automatically create PRs to update vulnerable dependencies
- ⚠️ **Dependabot version updates** - Optional: Auto-update dependencies (can be noisy)

### Code Scanning
- ✅ **Code scanning** - Automatically scan for security vulnerabilities
  - Use GitHub's default CodeQL analysis
- ✅ **Secret scanning** - Detect accidentally committed secrets
  - Enable for both push protection and historical scanning

---

## Git Configuration Best Practices

### Local Git Configuration

The following are already configured for this repository:

```bash
# Pull strategy (merge with fast-forward only)
git config pull.rebase false
git config pull.ff only

# Optional: Enable commit signing (requires GPG setup)
# git config commit.gpgsign true
# git config user.signingkey <YOUR_GPG_KEY>
```

### Global Git Configuration (Recommended)

```bash
# Set default branch name
git config --global init.defaultBranch main

# Use SSH instead of HTTPS
git config --global url."git@github.com:".insteadOf "https://github.com/"

# Automatically prune deleted remote branches
git config --global fetch.prune true

# Better diff algorithm
git config --global diff.algorithm histogram

# Reuse recorded conflict resolutions
git config --global rerere.enabled true
```

---

## Git Workflow Best Practices

### Feature Development
1. Create feature branch from `develop`: `git checkout -b feature/my-feature develop`
2. Make commits following conventional commits format (enforced by hooks)
3. Push and create PR to `develop`
4. Wait for CI checks and code review
5. Squash and merge to `develop`
6. Delete feature branch (automatic if using GitHub merge button)

### Release Process

**Automated Version Bumping** 🤖

When you merge `develop` to `main`, version is **automatically bumped** based on commit types:

- `feat:` commits → **Minor** bump (1.6.0 → 1.7.0)
- `fix:` commits → **Patch** bump (1.6.0 → 1.6.1)
- `BREAKING CHANGE:` or `!` → **Major** bump (1.6.0 → 2.0.0)
- Other commits → **Patch** bump

**Release Steps:**

1. Create release PR from `develop` to `main`
2. Update `CHANGELOG.md` with release notes (optional but recommended)
3. Get approval and merge to `main`
4. 🤖 **GitHub Actions automatically:**
   - Analyzes commits since last tag
   - Bumps version in `package.json`, `client/package.json`, and `desktop/package.json`
   - Creates git tag (e.g., `v1.7.0`)
   - Commits and pushes to `main`
5. Merge `main` back to `develop` to sync versions

**Manual Release (if needed):**
```bash
# Bump version manually
npm version minor -w client && npm version minor
git commit -m "🔖 chore: bump version to 1.7.0"
git tag v1.7.0
git push origin main --follow-tags
```

### Hotfix Process
1. Create hotfix branch from `main`: `git checkout -b hotfix/critical-bug main`
2. Fix the issue and commit
3. Create PR to `main` with `fix:` prefix
4. After merge, cherry-pick or merge hotfix to `develop`

---

## Commit Message Convention

Enforced by `.husky/commit-msg` hook:

```
<emoji> <type>(<scope>): <subject> (#PR_NUMBER)

Examples:
✨ feat(auth): add OAuth login (#235)
🐛 fix(api): resolve memory leak in WebSocket (#236)
📝 docs: update API documentation (#237)
♻️ refactor(frontend): simplify state management (#238)
🔀 merge: release v1.7.0 into main (#239)
```

### Valid Types

| Type | Emoji | Description | Version Bump |
|------|-------|-------------|--------------|
| `feat` | ✨ | New feature | **Minor** (1.6.0 → 1.7.0) |
| `fix` | 🐛 | Bug fix | **Patch** (1.6.0 → 1.6.1) |
| `refactor` | ♻️ | Code refactoring | Patch |
| `docs` | 📝 | Documentation | Patch |
| `test` | 🧪 | Testing | Patch |
| `chore` | 🔧 | Maintenance | Patch |
| `perf` | ⚡ | Performance | Patch |
| `style` | 💄 | Styling/formatting | Patch |
| `ci` | 👷 | CI/CD | Patch |
| `merge` | 🔀 | Branch merges | **Minor** |
| `BREAKING` | 💥 | Breaking change | **Major** (1.6.0 → 2.0.0) |

**Breaking Changes:**
To trigger a major version bump, use `!` or add `BREAKING CHANGE:` in commit body:
```
feat!: redesign authentication system (#240)

BREAKING CHANGE: Old auth tokens are no longer valid
```

---

## Pre-commit Checks

Automatically run by `.husky/pre-commit`:

1. **Lint-staged** — ESLint + Prettier on staged files only

**Total time:** ~1-2 seconds

> **Note:** Tests are NOT run on pre-commit (moved to pre-push for faster commits).

---

## Pre-push Checks

Automatically run by `scripts/pre-push.sh` (via `.husky/pre-push`):

1. TypeScript compilation check (backend + client)
2. Full ESLint run (backend + client)
3. All backend tests (vitest)
4. All frontend tests (vitest)
5. Client production build (`yarn build`)

**Total time:** ~25-35 seconds

---

## GitHub Actions Workflows

All workflows are in `.github/workflows/`:

| Workflow | Trigger | Jobs | Duration |
|----------|---------|------|---------|
| **CI** (`ci.yml`) | Push to main/develop, PRs | Test & Lint, Desktop Typecheck, E2E Tests, Security Audit | ~3 min |
| **Deploy Staging** (`deploy-staging.yml`) | Push to develop | Deploy to AWS staging | ~30s |
| **Deploy Preview** (`deploy-preview.yml`) | PR to develop | Create/cleanup preview env | ~1 min |
| **Smoke Test** (`smoke-test.yml`) | After version bump or manual | 5 production health checks | ~1 min |
| **Version Bump** (`version-bump.yml`) | Push to main | Auto-bump version + git tag | ~30s |
| **Desktop Release** (`desktop-release.yml`) | After version bump | Build Win/Mac/Linux installers | ~5 min |
| **Deploy to AWS** (`deploy-aws.yml`) | Push to main | Build backend + deploy frontend | ~3 min |
| **Uptime Monitor** (`uptime.yml`) | Cron (every 10 min) | Health check on production | ~10s |

### CI Pipeline Architecture

All 4 CI jobs run **in parallel** for fast feedback:

```
┌────────────────────┐
│  Test & Lint       │  ~2 min (typecheck, lint, 174 tests)
├────────────────────┤
│  Desktop Typecheck │  ~20 sec (Electron main + preload)
├────────────────────┤
│  E2E Tests         │  ~3 min (Playwright, chromium cached)
├────────────────────┤
│  Security Audit    │  ~8 sec (yarn audit)
└────────────────────┘
```

### E2E Test Strategy

- Auth-dependent tests tagged with `{ tag: '@auth' }` — excluded in CI
- CI runs: `yarn test:e2e --project=chromium --grep-invert @auth`
- Playwright chromium browser cached between runs (~300MB saved)
- Non-auth tests: Health Check, API Docs, Swagger UI, Frontend loads

### Branch Protection

Activate via: `./scripts/setup-branch-protection.sh`

This configures:

- **main**: Require PR + 1 approval + 3 CI checks (`Test & Lint`, `Security Audit`, `Desktop Typecheck`)
- **develop**: Require 3 CI checks + `enforce_admins` (no admin bypass)

### Copilot Review Ruleset

Configured via GitHub Rulesets (Settings → Rules):

- **Scope**: `develop` branch only (main excluded to allow auto version bump)
- **Rules**: Copilot code review on push + draft PRs, PR required with conversation resolution
- **Bypass**: Organization admins

---

## Security Considerations

### Secrets Management
- ✅ Never commit `.env` files (in `.gitignore`)
- ✅ Use environment variables for sensitive data
- ✅ Use GitHub Secrets for CI/CD credentials
- ⚠️ Rotate secrets regularly (every 90 days)

### Dependency Audits
- ✅ Automated via CI: `yarn audit --level high`
- ✅ Run manually before releases: `yarn audit --level high`
- ⚠️ Review and update dependencies monthly

### Code Review Checklist
- [ ] No commented-out code
- [ ] No TODO/FIXME without GitHub issues
- [ ] No console.log in production code
- [ ] Proper error handling
- [ ] Tests added for new features
- [ ] Documentation updated if needed

---

## Helpful Commands

```bash
# List all merged branches (safe to delete)
git branch --merged develop | grep -v "^\*" | grep -v "main" | grep -v "develop"

# Delete merged branches locally
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Clean up stale remote references
git remote prune origin
git fetch --prune

# View CI status for current branch
gh pr checks

# View PR list
gh pr list

# Check current PR number
cat .pr-number
```

---

## Troubleshooting

### Hooks not running
```bash
# Reinstall hooks
yarn husky install
chmod +x .husky/*
```

### PR number conflicts
```bash
# Manually sync PR number
./scripts/update-pr-number.sh 235
git add .pr-number
git commit --no-verify -m "🔧 chore: sync PR counter"
```

### Failed CI checks
```bash
# Run full validation locally (same as CI)
yarn pre-push

# Run specific checks
yarn typecheck
yarn lint
yarn test
cd client && yarn test
```

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Husky Git Hooks](https://typicode.github.io/husky/)

---

**Last Updated:** March 5, 2026  
**Document Version:** 2.0.0
