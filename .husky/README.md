# Git Hooks

This directory contains automated git hooks that enforce CONTRIBUTING.md standards.

## 🪝 Available Hooks

### pre-commit
**Runs:** Before commit is created  
**Purpose:** Ensure code quality and all tests pass

**What it does:**
- 🎨 Runs ESLint with auto-fix
- 💄 Runs Prettier formatting
- 🧪 Runs all backend tests (61 tests)
- 🧪 Runs all frontend tests (61 tests)

**Time:** ~10-15 seconds

**Why:** Catches bugs and formatting issues before they enter git history.

### prepare-commit-msg
**Runs:** Before you edit the commit message  
**Purpose:** Automatically formats commit messages

**What it does:**
- 🔢 Adds next PR number from `.pr-number` file
- ✨ Adds emoji based on commit type
- 📝 Formats according to conventional commits

**Example:**
```bash
# You write:
git commit -m "feat(frontend): add dark mode"

# Hook transforms to:
# ✨ feat(frontend): add dark mode (#230)
```

### commit-msg
**Runs:** After you write the commit message  
**Purpose:** Validates commit message format

**What it validates:**
- ✅ Conventional commit format
- ✅ Mandatory PR number `(#230)`
- ✅ Valid commit type
- ⚠️  Subject length (<72 chars recommended)

**Will reject:**
- ❌ Missing PR number
- ❌ Invalid commit type
- ❌ Incorrect format

### post-commit
**Runs:** After successful commit  
**Purpose:** Updates PR number counter

**What it does:**
- 🔄 Extracts PR number from commit message
- 📈 Updates `.pr-number` file automatically
- ✅ Prepares next number for next commit

**Example:**
```bash
# After committing with (#230)
# .pr-number is updated to 230
# Next commit will use #231
```

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
#    🔢 Add PR number
#    ✅ Validate format
#    📈 Update counter

# Result: ✨ feat: add dark mode (#230)
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
chmod +x .husky/post-commit

# Reinstall husky
yarn husky install
```

### Wrong PR number?
```bash
# Manually update .pr-number
echo "230" > .pr-number

# Or use the script
./scripts/update-pr-number.sh 230
```

### Commit rejected?
Check that your message follows the format:
```
[emoji] type(scope): subject (#PR_NUMBER)

Examples:
✅ ✨ feat(frontend): add dark mode (#230)
✅ 🐛 fix: resolve memory leak (#231)
✅ feat(backend): add caching (#232)
```
