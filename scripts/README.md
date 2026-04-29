# Scripts

This folder contains utility scripts for development, testing, and workflow automation.

## 🧪 Test Scripts

### generate-dev-tokens.cjs ⭐

**NEW!** Generates mock JWT tokens for all seeded users for local development.

**Usage:**

```bash
node scripts/generate-dev-tokens.cjs
```

**What it does:**

- Generates mock tokens for all 10 seeded users
- Outputs tokens you can use in browser localStorage
- Provides instructions for authentication
- Shows user roles and emails

**Output includes:**
- SUPER_ADMIN token (admin@boxflow.se)
- ADMIN token (erik.johansson@boxflow.se)
- 8 MEMBER tokens with different names and roles

**Use cases:**
- Quick authentication for frontend testing
- Testing different user roles and permissions
- API testing with different users
- No need for real Cognito login in development

### send-dm.cjs

Sends a test DM from Anna (user-2) to Jens.

**Usage:**

```bash
node scripts/send-dm.cjs
```

**What it does:**

- Creates/finds a DM channel between user-2 and Jens
- Sends a test message
- Uses mock token for authentication (dev only)

### send-mention.cjs

Sends an @mention in a channel to test mention notifications.

**Usage:**

```bash
node scripts/send-mention.cjs
```

**What it does:**

- Sends a message with @mention to Jens
- Tests push notifications for mentions
- Uses mock token for authentication (dev only)

## Configuration

Scripts assume that:

- Backend is running on `http://localhost:3001`
- `ALLOW_MOCK_TOKENS=true` in backend `.env`
- Jens's user ID is: `f02cf92c-d0e1-70d4-02de-db967a695a11`

## Mock Tokens

Mock tokens are only used in development environment and have the following format:

```javascript
{
  sub: "user-2",           // User ID
  email: "anna@boxflow.com",
  name: "Anna Andersson",
  workspaces: [{ id: "workspace-id", role: "MEMBER" }]
}
```

**NOTE:** Mock tokens do NOT work in production.
