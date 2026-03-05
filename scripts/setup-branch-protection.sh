#!/bin/bash
# scripts/setup-branch-protection.sh
# Sets up branch protection rules for main and develop branches
# Requires: gh CLI authenticated with admin access
#
# Usage: ./scripts/setup-branch-protection.sh
set -e

REPO="BoxflowIT/boxcord"

echo "🔒 Setting up branch protection rules for $REPO..."
echo ""

# Check gh CLI is available and authenticated
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is required. Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "❌ Not authenticated. Run: gh auth login"
  exit 1
fi

# ─── main branch ──────────────────────────────────────────────────────
echo "🔐 Configuring 'main' branch protection..."
gh api \
  --method PUT \
  "/repos/$REPO/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Test & Lint",
      "E2E Tests",
      "Security Audit"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false
}
EOF
echo "  ✅ main: Require PR with 1 approval + CI green + no force push"

# ─── develop branch ──────────────────────────────────────────────────
echo ""
echo "🔐 Configuring 'develop' branch protection..."
gh api \
  --method PUT \
  "/repos/$REPO/branches/develop/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Test & Lint",
      "Security Audit"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false
}
EOF
echo "  ✅ develop: Require CI green + no force push (0 approvals for speed)"

echo ""
echo "🎉 Branch protection rules configured!"
echo ""
echo "Summary:"
echo "  main:    PR required | 1 approval | CI must pass | No force push"
echo "  develop: PR required | 0 approvals | CI must pass | No force push"
echo ""
echo "To modify: edit this script or use GitHub Settings → Branches"
