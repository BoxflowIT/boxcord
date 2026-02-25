# GitHub Workflows

This directory contains GitHub Actions workflows for automated CI/CD and version management.

## Workflows

### 🧪 CI (`ci.yml`)

**Triggers:** Push or PR to `main` or `develop`

**Purpose:** Ensures code quality through automated testing and linting

**Jobs:**
1. **Test & Lint**
   - ✅ TypeScript compilation check
   - ✅ ESLint validation
   - ✅ Backend tests (61 tests)
   - ✅ Frontend tests (61 tests)
   - ✅ Client build verification

2. **Security Audit**
   - 🔒 `yarn audit` for dependencies
   - ⚠️ Runs but doesn't fail build (continue-on-error)

**Duration:** ~2-3 minutes

---

### 🔖 Auto Version Bump (`version-bump.yml`)

**Triggers:** Push to `main` (usually from merging `develop`)

**Purpose:** Automatically bumps version based on conventional commits

**How it works:**

1. **Analyzes commits** since last git tag
2. **Determines bump type:**
   - `feat:` → Minor bump (1.6.0 → 1.7.0)
   - `fix:` → Patch bump (1.6.0 → 1.6.1)
   - `BREAKING CHANGE:` → Major bump (1.6.0 → 2.0.0)
3. **Updates files:**
   - `package.json`
   - `client/package.json`
   - `.pr-number`
4. **Creates git tag:** `v1.7.0`
5. **Pushes to main** with `[skip ci]` to avoid infinite loop

**Skips when:**
- Commit already contains "bump version"
- Only docs/markdown changes
- Changes only in `.github/` directory

**Example output:**
```
🎉 Version Bump Summary
- Old Version: 1.6.0
- New Version: 1.7.0
- Bump Type: minor
- Git Tag: v1.7.0
```

---

## Permissions

### CI Workflow
```yaml
permissions:
  contents: read  # Read-only access
```

### Version Bump Workflow
```yaml
permissions:
  contents: write  # Needs write to commit and push
```

---

## Secrets & Tokens

All workflows use the default `GITHUB_TOKEN` which is automatically provided by GitHub Actions.

No additional secrets are required.

---

## Preventing Infinite Loops

The version bump workflow includes multiple safeguards:

1. **Skip condition:** `if: "!contains(github.event.head_commit.message, 'bump version')"`
2. **[skip ci] in commit message:** Prevents CI from running again
3. **paths-ignore:** Skips on docs-only changes

---

## Local Testing

You can simulate what the workflow does locally:

### Test CI checks:
```bash
# Run all CI checks locally
yarn pre-push  # Runs TypeScript, lint, tests

# Or individually:
yarn typecheck
yarn lint
yarn test
cd client && yarn test
```

### Test version bump:
```bash
# Manual version bump (simulates what workflow does)
npm version minor -w client
npm version minor
git commit -m "🔖 chore: bump version to 1.7.0"
git tag v1.7.0
```

---

## Monitoring Workflows

### View workflow runs:
```bash
gh run list
gh run view <run-id>
```

### Check workflow logs:
```bash
gh run view <run-id> --log
```

### View latest run status:
```bash
gh run list --workflow=ci.yml --limit 1
gh run list --workflow=version-bump.yml --limit 1
```

---

## Troubleshooting

### Version bump didn't trigger

**Check:**
1. Did merge go to `main`? (Workflow only runs on main)
2. Was commit message skipped? (Contains "bump version")
3. Check workflow logs: `gh run list --workflow=version-bump.yml`

**Manual fix:**
```bash
git checkout main
npm version patch -w client && npm version patch
git commit -m "🔖 chore: manual version bump (#237)"
git push origin main
```

### CI failing

**Common issues:**
- TypeScript errors: Run `yarn typecheck` locally
- Test failures: Run `yarn test` and `cd client && yarn test`
- Lint errors: Run `yarn lint --fix`

**Local pre-push validation:**
```bash
yarn pre-push  # Runs same checks as CI
```

### Workflow permissions error

If you see "Resource not accessible by integration" error:

1. Go to repo Settings → Actions → General
2. Under "Workflow permissions", select **"Read and write permissions"**
3. Check **"Allow GitHub Actions to create and approve pull requests"**

---

## Best Practices

### ✅ DO:
- Use conventional commit formats (`feat:`, `fix:`, etc.)
- Wait for CI to pass before merging
- Keep feature branches short-lived
- Merge `main` back to `develop` after version bump

### ❌ DON'T:
- Push directly to `main` (unless emergency)
- Skip CI checks with `[skip ci]` unless necessary
- Force push to `main` or `develop`
- Commit version bumps manually (let workflow handle it)

---

## Future Enhancements

Potential additions:

- 🚀 Deploy workflow (staging/production)
- 📝 Automated CHANGELOG generation
- 🔔 Slack/Discord notifications on release
- 🏷️ GitHub Release creation with notes
- 📊 Test coverage reporting
- 🔍 CodeQL security scanning

---

**Last Updated:** February 25, 2026  
**Workflow Version:** 1.0.0
