# Git Hooks

This directory contains automated git hooks that enforce CONTRIBUTING.md standards.

## 🪝 Available Hooks

### pre-commit
**Runs:** Before commit is created  
**Purpose:** Ensure code quality

**What it does:**
- 🎨 Runs ESLint with auto-fix via lint-staged
- 💄 Runs Prettier formatting via lint-staged

### prepare-commit-msg
**Runs:** Before you edit the commit message  
**Purpose:** Automatically adds emoji prefix based on commit type

**What it does:**
- ✨ Adds emoji based on conventional commit type
- Skips merge and squash commits

**Example:**
```bash
# You write:
git commit -m "feat(frontend): add dark mode"

# Hook transforms to:
# ✨ feat(frontend): add dark mode
```

### commit-msg
**Runs:** After you write the commit message  
**Purpose:** Validates commit message format

**What it validates:**
- ✅ Conventional commit format (type, optional scope, subject)
- ✅ Valid commit type
- ⚠️  Subject length (<72 chars recommended)

**Will reject:**
- ❌ Invalid commit type
- ❌ Incorrect format

### pre-push
**Runs:** Before push to remote  
**Purpose:** Fast typecheck validation

**What it does:**
- 📦 Runs backend TypeScript check (`tsc --noEmit`)
- 🎨 Runs client TypeScript check (`tsc --noEmit`)
- Auto-installs client deps if `client/node_modules` is missing

### post-commit
**Runs:** After successful commit  
**Purpose:** No-op (PR number tracking removed)

## 🔧 Emoji Mapping

| Type | Emoji | Description |
|------|-------|-------------|
| feat | ✨ | New feature |
| fix | 🐛 | Bug fix |
| refactor | ♻️ | Code refactoring |
| docs | 📝 | Documentation |
| test | 🧪 | Tests |
| chore | 🔧 | Maintenance |
| perf | ⚡ | Performance |
| style | 💄 | Formatting |
| ci | 👷 | CI/CD |
| merge | 🔀 | Merge commits |

## 🚀 Usage

Hooks run automatically - no manual intervention needed!

```bash
# 1. Make changes
git add .

# 2. Write simple commit message
git commit -m "feat: add dark mode"

# 3. Hooks automatically:
#    ✨ Add emoji
#    ✅ Validate format

# Result: ✨ feat: add dark mode
```

## ⚠️ Bypassing Hooks (Emergency Only)

```bash
# Skip commit hooks
git commit --no-verify -m "emergency fix"

# Skip push hooks
git push --no-verify
```

**Warning:** Only use in emergencies. Hooks enforce quality standards.

## 🔍 Troubleshooting

### Hook not running?
```bash
# Make sure hooks are executable
chmod +x .husky/prepare-commit-msg
chmod +x .husky/commit-msg

# Reinstall husky
yarn husky install
```

### Commit rejected?
Check that your message follows the format:
```
[emoji] type(scope): subject

Examples:
✅ ✨ feat(frontend): add dark mode
✅ 🐛 fix: resolve memory leak
✅ feat(backend): add caching
```
