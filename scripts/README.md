# Test Scripts

This folder contains utility scripts for testing Boxcord functionality during development.

## Available Scripts

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
