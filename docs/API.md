# Boxcord REST API Documentation

Complete REST API reference for Boxcord. For WebSocket events, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://your-domain.com/api/v1
```

## Authentication

All endpoints (except `/health`) require JWT authentication via AWS Cognito.

**Authorization Header:**
```
Authorization: Bearer <jwt_token>
```

**Getting a Token:**
1. User logs in via Boxtime (boxtime.boxflow.com)
2. Cognito returns JWT token
3. Frontend stores token and includes in all API requests

## Common Response Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | Success                          |
| 201  | Created                          |
| 204  | Success (No Content)             |
| 400  | Bad Request (validation error)   |
| 401  | Unauthorized (invalid/missing token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                        |
| 409  | Conflict (duplicate resource)    |
| 429  | Rate Limit Exceeded              |
| 500  | Internal Server Error            |

## Rate Limiting

- **Default:** 100 requests per minute per IP
- **DM Creation:** 20 requests per minute
- **File Upload:** 10 requests per minute

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## 📍 Endpoints

### Health Check

#### GET /health

Health check endpoint (no auth required).

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-23T15:30:00.000Z",
  "uptime": 12345
}
```

---

## 👤 Users

### Get Current User

#### GET /users/me

Get authenticated user's profile.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "avatarUrl": "https://...",
    "customStatus": "🚀 Building awesome stuff",
    "customStatusExpiry": "2026-02-24T15:00:00.000Z",
    "role": "USER",
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

### Get User by ID

#### GET /users/:id

Get another user's public profile.

**Parameters:**
- `id` (path, required): User ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Software developer",
    "avatarUrl": "https://...",
    "customStatus": "🚀 Building awesome stuff",
    "role": "USER"
  }
}
```

### Update Profile

#### PATCH /users/me

Update authenticated user's profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "avatarUrl": "https://...",
  "customStatus": "🎉 New status",
  "customStatusExpiry": "2026-02-24T15:00:00.000Z"
}
```

All fields are optional.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio"
  }
}
```

### Search Users

#### GET /users/search

Search users by name or email.

**Query Parameters:**
- `q` (required): Search query (min 2 characters)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://..."
    }
  ]
}
```

### Update User Role (Admin)

#### PATCH /users/:id/role

Update user's role (requires ADMIN or SUPER_ADMIN role).

**Parameters:**
- `id` (path, required): User ID

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Valid Roles:** `USER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "ADMIN"
  }
}
```

### Batch Fetch Users

#### POST /users/batch

Fetch multiple users in a single request. Used by `useUsers(ids)` to batch-fetch uncached users.

**Request Body:**
```json
{
  "userIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid1",
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://..."
    }
  ]
}
```

### Get Online Users

#### GET /users/online

Get list of currently online users.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://...",
      "status": "online"
    }
  ]
}
```

### Update Custom Status

#### PATCH /users/me/status

Update current user's custom status text and emoji.

**Request Body:**
```json
{
  "customStatus": "🚀 Building awesome stuff",
  "customStatusExpiry": "2026-02-24T15:00:00.000Z"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "customStatus": "🚀 Building awesome stuff" }
}
```

### Update DND Mode

#### PATCH /users/me/dnd

Toggle Do Not Disturb mode.

**Request Body:**
```json
{
  "dnd": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "dnd": true }
}
```

---

## 🏢 Workspaces

### List Workspaces

#### GET /workspaces

List all workspaces user is a member of.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Engineering Team",
      "description": "Development workspace",
      "iconUrl": "https://...",
      "ownerId": "uuid",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Workspace

#### POST /workspaces

Create a new workspace.

**Request Body:**
```json
{
  "name": "My Workspace",
  "description": "Optional description",
  "iconUrl": "https://..."
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Workspace",
    "description": "Optional description",
    "iconUrl": "https://...",
    "ownerId": "uuid",
    "createdAt": "2026-02-23T15:00:00.000Z"
  }
}
```

### Get Workspace

#### GET /workspaces/:id

Get workspace details.

**Parameters:**
- `id` (path, required): Workspace ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Workspace",
    "description": "Description",
    "iconUrl": "https://...",
    "ownerId": "uuid",
    "memberCount": 42,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Update Workspace

#### PATCH /workspaces/:id

Update workspace (requires admin/owner).

**Parameters:**
- `id` (path, required): Workspace ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "iconUrl": "https://..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "Updated description"
  }
}
```

### Delete Workspace

#### DELETE /workspaces/:id

Delete workspace (owner only).

**Parameters:**
- `id` (path, required): Workspace ID

**Response 204:** No content

### List Members

#### GET /workspaces/:id/members

List all workspace members with their roles.

**Parameters:**
- `id` (path, required): Workspace ID

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "avatarUrl": "https://...",
      "joinedAt": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

---

## 📢 Channels

### List Channels

#### GET /channels

List channels in a workspace.

**Query Parameters:**
- `workspaceId` (required): Workspace ID

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "name": "general",
      "description": "General discussion",
      "type": "TEXT",
      "isPrivate": false,
      "categoryId": "uuid",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

**Channel Types:** `TEXT`, `VOICE`

### Create Channel

#### POST /channels

Create a new channel (requires admin).

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "name": "new-channel",
  "description": "Optional description",
  "type": "TEXT",
  "isPrivate": false,
  "categoryId": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "new-channel",
    "type": "TEXT",
    "isPrivate": false
  }
}
```

### Get Channel

#### GET /channels/:id

Get channel details.

**Parameters:**
- `id` (path, required): Channel ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "general",
    "description": "General discussion",
    "type": "TEXT",
    "isPrivate": false
  }
}
```

### Update Channel

#### PATCH /channels/:id

Update channel (requires admin).

**Parameters:**
- `id` (path, required): Channel ID

**Request Body:**
```json
{
  "name": "updated-name",
  "description": "Updated description",
  "isPrivate": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "updated-name",
    "description": "Updated description"
  }
}
```

### Delete Channel

#### DELETE /channels/:id

Delete channel (requires admin).

**Parameters:**
- `id` (path, required): Channel ID

**Response 204:** No content

### Mark as Read

#### POST /channels/:id/read

Mark all messages in channel as read.

**Parameters:**
- `id` (path, required): Channel ID

**Response 204:** No content

---

## 💬 Messages

### Get Messages

#### GET /messages

Fetch paginated messages from a channel.

**Query Parameters:**
- `channelId` (required): Channel ID
- `cursor` (optional): Pagination cursor (message ID)
- `limit` (optional): Number of messages (default: 50, max: 100)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "channelId": "uuid",
        "authorId": "uuid",
        "content": "Hello world!",
        "edited": false,
        "isPinned": false,
        "createdAt": "2026-02-23T15:00:00.000Z",
        "author": {
          "id": "uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "attachments": [],
        "reactions": []
      }
    ],
    "hasMore": true,
    "nextCursor": "uuid"
  }
}
```

### Create Message

#### POST /messages

Send a message to a channel.

**Request Body:**
```json
{
  "channelId": "uuid",
  "content": "Hello world!",
  "attachments": [
    {
      "fileName": "image.png",
      "fileUrl": "https://...",
      "fileType": "image/png",
      "fileSize": 12345
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channelId": "uuid",
    "authorId": "uuid",
    "content": "Hello world!",
    "createdAt": "2026-02-23T15:00:00.000Z"
  }
}
```

### Edit Message

#### PATCH /messages/:id

Edit your own message.

**Parameters:**
- `id` (path, required): Message ID

**Request Body:**
```json
{
  "content": "Updated content"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Updated content",
    "edited": true,
    "updatedAt": "2026-02-23T15:05:00.000Z"
  }
}
```

### Delete Message

#### DELETE /messages/:id

Delete message (own message or admin).

**Parameters:**
- `id` (path, required): Message ID

**Response 204:** No content

### Forward Message

#### POST /messages/:id/forward

Forward message to another channel or DM.

**Parameters:**
- `id` (path, required): Message ID

**Request Body:**
```json
{
  "channelId": "uuid"
}
```

OR for DM:
```json
{
  "dmChannelId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Forwarded message content"
  }
}
```

### Pin Message

#### POST /messages/:id/pin

Pin message to channel (requires admin).

**Parameters:**
- `id` (path, required): Message ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isPinned": true,
    "pinnedAt": "2026-02-23T15:00:00.000Z",
    "pinnedBy": "uuid"
  }
}
```

### Unpin Message

#### DELETE /messages/:id/pin

Unpin message from channel (requires admin).

**Parameters:**
- `id` (path, required): Message ID

**Response 204:** No content

### Search Messages

#### GET /messages/search

Search messages across channels.

**Query Parameters:**
- `q` (required): Search query
- `workspaceId` (optional): Limit to workspace
- `channelId` (optional): Limit to channel

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "channelId": "uuid",
      "content": "Matching message",
      "author": {...},
      "createdAt": "2026-02-23T15:00:00.000Z"
    }
  ]
}
```

---

## 📩 Direct Messages (DMs)

### List DM Channels

#### GET /dm/channels

List all DM conversations for current user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "participants": [
        {
          "userId": "uuid",
          "user": {
            "id": "uuid",
            "email": "user@example.com",
            "firstName": "John",
            "lastName": "Doe"
          }
        }
      ],
      "lastMessage": {
        "id": "uuid",
        "content": "Last message",
        "createdAt": "2026-02-23T15:00:00.000Z"
      },
      "unreadCount": 3,
      "createdAt": "2026-02-20T00:00:00.000Z"
    }
  ]
}
```

### Create/Get DM Channel

#### POST /dm/channels

Get existing DM channel or create new one.

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "participants": [...],
    "createdAt": "2026-02-23T15:00:00.000Z"
  }
}
```

### Get DM Messages

#### GET /dm/channels/:id/messages

Fetch DM messages (paginated).

**Parameters:**
- `id` (path, required): DM Channel ID

**Query Parameters:**
- `cursor` (optional): Pagination cursor
- `limit` (optional): Number of messages (default: 50)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "channelId": "uuid",
        "authorId": "uuid",
        "content": "Hello!",
        "createdAt": "2026-02-23T15:00:00.000Z"
      }
    ],
    "hasMore": false
  }
}
```

### Send DM

#### POST /dm/channels/:id/messages

Send direct message.

**Parameters:**
- `id` (path, required): DM Channel ID

**Request Body:**
```json
{
  "content": "Hello!",
  "attachments": []
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Hello!",
    "createdAt": "2026-02-23T15:00:00.000Z"
  }
}
```

### Edit DM

#### PATCH /dm/messages/:id

Edit your own DM.

**Parameters:**
- `id` (path, required): DM Message ID

**Request Body:**
```json
{
  "content": "Updated message"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Updated message",
    "edited": true
  }
}
```

### Delete DM Channel

#### DELETE /dm/channels/:id

Leave/delete DM conversation.

**Parameters:**
- `id` (path, required): DM Channel ID

**Response 204:** No content

### Mark DM as Read

#### POST /dm/channels/:id/read

Mark all DMs in channel as read.

**Parameters:**
- `id` (path, required): DM Channel ID

**Response 204:** No content

---

## 😊 Reactions

### Add Reaction

#### POST /reactions/messages/:id

Add emoji reaction to message.

**Parameters:**
- `id` (path, required): Message ID

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "messageId": "uuid",
    "userId": "uuid",
    "emoji": "👍"
  }
}
```

### Remove Reaction

#### DELETE /reactions/messages/:id/:emoji

Remove your reaction from message.

**Parameters:**
- `id` (path, required): Message ID
- `emoji` (path, required): Emoji to remove (URL-encoded)

**Response 204:** No content

### Get Reactions

#### GET /reactions/messages/:id

Get all reactions for a message.

**Parameters:**
- `id` (path, required): Message ID

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "emoji": "👍",
      "count": 3,
      "users": [
        {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        }
      ]
    }
  ]
}
```

---

## 🔖 Bookmarks

### List Bookmarks

#### GET /bookmarks

Get all bookmarked messages for current user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "messageId": "uuid",
      "message": {
        "id": "uuid",
        "content": "Bookmarked message",
        "author": {...}
      },
      "createdAt": "2026-02-23T15:00:00.000Z"
    }
  ]
}
```

### Add Bookmark

#### POST /bookmarks

Bookmark a message.

**Request Body:**
```json
{
  "messageId": "uuid"
}
```

OR for DM:
```json
{
  "dmMessageId": "uuid"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "messageId": "uuid",
    "createdAt": "2026-02-23T15:00:00.000Z"
  }
}
```

### Remove Bookmark

#### DELETE /bookmarks/:id

Remove bookmark.

**Parameters:**
- `id` (path, required): Bookmark ID

**Response 204:** No content

### Check Bookmark Status

#### GET /bookmarks/check

Check if message is bookmarked.

> **Note:** The client no longer calls this endpoint. Bookmark status is derived from the `GET /bookmarks` list via `useIsBookmarked()` hook. The endpoint still exists for backward compatibility.

**Query Parameters:****
- `messageId` (optional): Channel message ID
- `dmMessageId` (optional): DM message ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "isBookmarked": true,
    "bookmarkId": "uuid"
  }
}
```

### Get Bookmark Count

#### GET /bookmarks/count

Get total bookmark count for user.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "count": 42
  }
}
```

### Update Bookmark Note

#### PATCH /bookmarks/:id/note

Update the note/annotation on a bookmark.

**Parameters:**
- `id` (path, required): Bookmark ID

**Request Body:**
```json
{
  "note": "Important reference for Q2 planning"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "note": "Important reference for Q2 planning"
  }
}
```

---

## 🎫 Invites

### List Invites

#### GET /invites

List all active invites for workspaces user can manage.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "code": "abc123",
      "workspaceId": "uuid",
      "workspace": {
        "name": "My Workspace"
      },
      "createdBy": "uuid",
      "expiresAt": "2026-03-01T00:00:00.000Z",
      "maxUses": 10,
      "useCount": 3,
      "createdAt": "2026-02-20T00:00:00.000Z"
    }
  ]
}
```

### Create Invite

#### POST /invites

Create workspace invite link (requires admin).

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "maxUses": 10,
  "expiresAt": "2026-03-01T00:00:00.000Z"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "code": "abc123xyz",
    "workspaceId": "uuid",
    "expiresAt": "2026-03-01T00:00:00.000Z",
    "inviteUrl": "https://boxcord.com/invite/abc123xyz"
  }
}
```

### Revoke Invite

#### DELETE /invites/:code

Revoke invite link (requires admin).

**Parameters:**
- `code` (path, required): Invite code

**Response 204:** No content

### Preview Invite

#### GET /invites/:code/preview

Get invite details before accepting (no auth required).

**Parameters:**
- `code` (path, required): Invite code

**Response 200:**
```json
{
  "success": true,
  "data": {
    "code": "abc123",
    "workspace": {
      "name": "Engineering Team",
      "description": "Our dev workspace",
      "iconUrl": "https://...",
      "memberCount": 42
    },
    "inviter": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "expiresAt": "2026-03-01T00:00:00.000Z",
    "isValid": true
  }
}
```

### Accept Invite

#### POST /invites/:code/accept

Accept invite and join workspace.

**Parameters:**
- `code` (path, required): Invite code

**Response 200:**
```json
{
  "success": true,
  "data": {
    "workspaceId": "uuid",
    "workspace": {
      "id": "uuid",
      "name": "Engineering Team"
    }
  }
}
```

---

## 🛡️ Moderation

### Kick User

#### POST /workspaces/:id/kick

Kick user from workspace (requires admin).

**Parameters:**
- `id` (path, required): Workspace ID

**Request Body:**
```json
{
  "userId": "uuid",
  "reason": "Optional reason"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "action": "kicked"
  }
}
```

### Ban User

#### POST /workspaces/:id/ban

Ban user from workspace (requires admin).

**Parameters:**
- `id` (path, required): Workspace ID

**Request Body:**
```json
{
  "userId": "uuid",
  "reason": "Spam violations",
  "duration": 86400
}
```

`duration` is in seconds (optional, permanent if omitted).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "action": "banned",
    "expiresAt": "2026-02-24T15:00:00.000Z"
  }
}
```

### Unban User

#### POST /workspaces/:id/unban

Unban user from workspace (requires admin).

**Parameters:**
- `id` (path, required): Workspace ID

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "action": "unbanned"
  }
}
```

### Get Audit Logs

#### GET /workspaces/:id/audit-logs

Get moderation audit logs (requires admin).

**Parameters:**
- `id` (path, required): Workspace ID

**Query Parameters:**
- `limit` (optional): Number of entries (default: 50)
- `cursor` (optional): Pagination cursor

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "workspaceId": "uuid",
      "action": "USER_BANNED",
      "actorId": "uuid",
      "targetId": "uuid",
      "reason": "Spam violations",
      "createdAt": "2026-02-23T15:00:00.000Z"
    }
  ]
}
```

---

## 🔍 Search

### Global Search

#### GET /search

Search messages across all channels and DMs.

**Query Parameters:**
- `q` (required): Search query
- `channelId` (optional): Limit to specific channel
- `workspaceId` (optional): Limit to specific workspace

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Search result message",
      "channelId": "uuid",
      "author": { "id": "uuid", "firstName": "John" },
      "createdAt": "2026-02-23T15:00:00.000Z"
    }
  ]
}
```

---

## 🎉 GIFs (Giphy)

### Search GIFs

#### GET /giphy/search

Search GIFs via Giphy API.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 10, max: 50)
- `offset` (optional): Pagination offset

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Happy Cat",
      "url": "https://giphy.com/gifs/abc123",
      "images": {
        "fixed_height": {
          "url": "https://media.giphy.com/...",
          "width": 400,
          "height": 200
        }
      }
    }
  ]
}
```

### Get Trending GIFs

#### GET /giphy/trending

Get current trending GIFs.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 50)

**Response 200:**
```json
{
  "success": true,
  "data": [...]
}
```

### Get Random GIF

#### GET /giphy/random

Get a random GIF.

**Query Parameters:**
- `tag` (optional): Limit to specific tag

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "xyz789",
    "title": "Random Cat",
    "url": "https://giphy.com/gifs/xyz789"
  }
}
```

### Get GIF by ID

#### GET /giphy/:id

Get specific GIF details.

**Parameters:**
- `id` (path, required): Giphy GIF ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "Specific GIF",
    "url": "https://giphy.com/gifs/abc123"
  }
}
```

### Search Stickers

#### GET /giphy/stickers/search

Search GIF stickers.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional, default: 25): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response 200:** Same format as Search GIFs.

### Get Trending Stickers

#### GET /giphy/stickers/trending

Get trending GIF stickers.

**Query Parameters:**
- `limit` (optional, default: 25): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response 200:** Same format as Get Trending GIFs.

---

## 📤 File Uploads

### Upload File

#### POST /upload

Upload file (images, documents, etc.).

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required): File to upload
- `channelId` (optional): Associate with channel
- `dmChannelId` (optional): Associate with DM

**Max File Size:** 10MB

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fileName": "image.png",
    "fileUrl": "https://.../uploads/abc123-image.png",
    "fileType": "image/png",
    "fileSize": 12345
  }
}
```

### Get Uploaded File

#### GET /uploads/:filename

Retrieve uploaded file.

**Parameters:**
- `filename` (path, required): File name

**Response 200:** File binary data with appropriate Content-Type header

### Upload Message File

#### POST /files/messages/:id

Upload file attached to a channel message.

**Parameters:**
- `id` (path, required): Message ID

**Content-Type:** `multipart/form-data`

**Response 200:** Same format as Upload File.

### Upload DM File

#### POST /files/dm/:id

Upload file attached to a DM message.

**Parameters:**
- `id` (path, required): DM Message ID

**Content-Type:** `multipart/form-data`

**Response 200:** Same format as Upload File.

### Generic File Upload

#### POST /files

Upload a generic file (used by thread replies).

**Content-Type:** `multipart/form-data`

**Response 200:** Same format as Upload File.

---

## 🎥 Voice

### Get Voice Channel Users

#### GET /voice/channels/:id/users

Get users currently in a voice channel.

**Parameters:**
- `id` (path, required): Channel ID

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "avatarUrl": "https://...",
      "isMuted": false,
      "isDeafened": false
    }
  ]
}
```

### Get Workspace Voice Users

#### GET /voice/workspaces/:id/voice-users

Get all users in voice channels across a workspace (batch).

**Parameters:**
- `id` (path, required): Workspace ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "channelId1": [{ "id": "uuid", "firstName": "John" }],
    "channelId2": [{ "id": "uuid2", "firstName": "Jane" }]
  }
}
```

---

## 🔐 Permissions

### Get Channel Permissions

#### GET /permissions

Get all role permissions for a channel.

**Query Parameters:**
- `channelId` (required): Channel ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ADMIN": { "sendMessages": true, "manageChannel": true },
    "STAFF": { "sendMessages": true, "manageChannel": false },
    "USER": { "sendMessages": true, "manageChannel": false }
  }
}
```

### Get Current User Permissions

#### GET /permissions/me

Get current user's effective permissions for a channel.

**Query Parameters:**
- `channelId` (required): Channel ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sendMessages": true,
    "manageChannel": false,
    "manageMessages": true
  }
}
```

### Check Permission

#### GET /permissions/check

Check if current user has a specific permission.

**Query Parameters:**
- `channelId` (required): Channel ID
- `permission` (required): Permission name

**Response 200:**
```json
{
  "success": true,
  "data": { "allowed": true }
}
```

### Set Permissions

#### POST /permissions

Set permissions for a role in a channel (requires ADMIN).

**Request Body:**
```json
{
  "channelId": "uuid",
  "role": "USER",
  "permissions": {
    "sendMessages": true,
    "manageChannel": false
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "updated": true }
}
```

### Reset Permissions

#### DELETE /permissions

Reset permissions for a channel to defaults.

**Query Parameters:**
- `channelId` (required): Channel ID

**Response 204:** No content

---

## 🔗 Embeds

### Parse Embeds

#### POST /embeds/parse

Extract and parse OpenGraph/oEmbed data from URLs in content. Called by `MessageEmbed` component with 500ms debounce.

**Request Body:**
```json
{
  "content": "Check this out https://example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "url": "https://example.com",
      "type": "link",
      "title": "Example",
      "description": "An example website",
      "image": "https://example.com/og-image.png",
      "siteName": "Example"
    }
  ]
}
```

---

## 🔔 Push Notifications

### Subscribe to Push

#### POST /push/subscribe

Subscribe to push notifications.

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "base64-key",
      "auth": "base64-auth"
    }
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "subscribed": true
  }
}
```

### Unsubscribe from Push

#### POST /push/unsubscribe

Unsubscribe from push notifications.

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "unsubscribed": true
  }
}
```

---

## 🧵 Threads

### List Channel Threads

#### GET /threads

List all threads in a channel.

**Query Parameters:**
- `channelId` (required): Channel ID
- `cursor` (optional): Thread ID for pagination
- `limit` (optional): Results per page (1-100)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "uuid",
        "messageId": "uuid",
        "channelId": "uuid",
        "title": "Discussion about feature X",
        "replyCount": 5,
        "participantCount": 3,
        "lastReplyAt": "2026-02-26T12:00:00.000Z",
        "lastReplyBy": "uuid",
        "isLocked": false,
        "isFollowing": true,
        "unreadCount": 2,
        "createdAt": "2026-02-25T10:00:00.000Z",
        "message": {
          "id": "uuid",
          "content": "Original message content",
          "authorId": "uuid",
          "author": {
            "id": "uuid",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
          }
        }
      }
    ],
    "nextCursor": "uuid"
  }
}
```

### Create Thread

#### POST /threads

Create a new thread from a channel message.

**Rate Limit:** 20 requests per minute

**Request Body:**
```json
{
  "messageId": "uuid",
  "title": "Thread title (required)"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "messageId": "uuid",
    "channelId": "uuid",
    "title": "Thread title (required)",
    "replyCount": 0,
    "participantCount": 1,
    "isLocked": false,
    "createdAt": "2026-02-26T12:00:00.000Z"
  }
}
```

### Get Thread

#### GET /threads/:id

Get thread details by ID.

**Parameters:**
- `id` (path, required): Thread ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "messageId": "uuid",
    "channelId": "uuid",
    "title": "Thread title",
    "replyCount": 5,
    "participantCount": 3,
    "lastReplyAt": "2026-02-26T12:00:00.000Z",
    "isLocked": false,
    "isFollowing": true,
    "unreadCount": 0
  }
}
```

### Get Thread by Message ID

#### GET /threads/by-message/:messageId

Get thread associated with a specific message.

**Parameters:**
- `messageId` (path, required): Root message ID

**Response 200:** Same as Get Thread

### Update Thread

#### PATCH /threads/:id

Update thread metadata (title, lock, archive, resolve status).

**Parameters:**
- `id` (path, required): Thread ID

**Request Body:**
```json
{
  "title": "Updated title",
  "isLocked": true,
  "isArchived": false,
  "isResolved": false
}
```

All fields are optional.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Updated title",
    "isLocked": true,
    "isArchived": false,
    "isResolved": false
  }
}
```

### Delete Thread

#### DELETE /threads/:id

Delete a thread and all its replies (requires ownership or admin role).

**Parameters:**
- `id` (path, required): Thread ID

**Response 204:** No content

### Get Thread Replies

#### GET /threads/:id/replies

Get paginated replies for a thread.

**Parameters:**
- `id` (path, required): Thread ID

**Query Parameters:**
- `cursor` (optional): Reply ID for pagination
- `limit` (optional): Results per page (1-100)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "replies": [
      {
        "id": "uuid",
        "content": "Reply content",
        "authorId": "uuid",
        "parentId": "uuid",
        "edited": false,
        "createdAt": "2026-02-26T12:00:00.000Z",
        "author": {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Doe",
          "email": "jane@example.com"
        },
        "attachments": [],
        "reactions": [
          {
            "emoji": "👍",
            "count": 2,
            "users": ["uuid1", "uuid2"]
          }
        ]
      }
    ],
    "nextCursor": "uuid"
  }
}
```

### Add Thread Reply

#### POST /threads/:id/replies

Add a reply to a thread.

**Rate Limit:** 30 requests per minute

**Parameters:**
- `id` (path, required): Thread ID

**Request Body:**
```json
{
  "content": "Reply text (max 4000 chars)",
  "attachments": [
    {
      "fileName": "image.png",
      "fileUrl": "https://...",
      "fileType": "image/png",
      "fileSize": 12345
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Reply text",
    "authorId": "uuid",
    "parentId": "uuid",
    "createdAt": "2026-02-26T12:00:00.000Z",
    "author": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }
}
```

### Edit Thread Reply

#### PATCH /threads/:id/replies/:replyId

Edit a thread reply (author only).

**Parameters:**
- `id` (path, required): Thread ID
- `replyId` (path, required): Reply message ID

**Request Body:**
```json
{
  "content": "Updated reply content"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "Updated reply content",
    "edited": true
  }
}
```

### Delete Thread Reply

#### DELETE /threads/:id/replies/:replyId

Delete a thread reply (author only).

**Parameters:**
- `id` (path, required): Thread ID
- `replyId` (path, required): Reply message ID

**Response 200:**
```json
{
  "success": true
}
```

### Add Reaction to Thread Reply

#### POST /threads/:id/replies/:replyId/reactions

Add emoji reaction to a thread reply.

**Parameters:**
- `id` (path, required): Thread ID
- `replyId` (path, required): Reply message ID

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "messageId": "uuid",
    "userId": "uuid",
    "emoji": "👍"
  }
}
```

### Remove Reaction from Thread Reply

#### DELETE /threads/:id/replies/:replyId/reactions/:emoji

Remove emoji reaction from a thread reply.

**Parameters:**
- `id` (path, required): Thread ID
- `replyId` (path, required): Reply message ID
- `emoji` (path, required): Emoji to remove

**Response 200:**
```json
{
  "success": true
}
```

### Follow/Unfollow Thread

#### POST /threads/:id/follow

Toggle thread follow status.

**Parameters:**
- `id` (path, required): Thread ID

**Request Body:**
```json
{
  "shouldFollow": true
}
```

**Response 200:**
```json
{
  "success": true
}
```

### Mark Thread as Read

#### POST /threads/:id/read

Mark all thread replies as read.

**Parameters:**
- `id` (path, required): Thread ID

**Response 200:**
```json
{
  "success": true
}
```

### Search Threads

#### GET /threads/search

Search threads by title and content.

**Query Parameters:**
- `q` (required): Search query string
- `channelId` (optional): Limit search to a specific channel

**Response 200:**
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "uuid",
        "title": "Matching thread",
        "replyCount": 5,
        "isArchived": false,
        "isResolved": false,
        "message": {
          "content": "Original message",
          "author": { "firstName": "John", "lastName": "Doe" }
        }
      }
    ]
  }
}
```

### Get Thread Analytics

#### GET /threads/:id/analytics

Get analytics for a specific thread.

**Parameters:**
- `id` (path, required): Thread ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "replyCount": 15,
    "participantCount": 5,
    "activeDuration": "3 days",
    "lastActivity": "2026-02-27T12:00:00.000Z"
  }
}
```

### Get Channel Thread Analytics

#### GET /threads/analytics/channel/:channelId

Get aggregated thread analytics for a channel.

**Parameters:**
- `channelId` (path, required): Channel ID

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalThreads": 25,
    "activeThreads": 18,
    "archivedThreads": 5,
    "resolvedThreads": 7,
    "totalReplies": 340,
    "avgRepliesPerThread": 13.6
  }
}
```

---

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## 🔌 WebSocket Events

For real-time communication, see [ARCHITECTURE.md](ARCHITECTURE.md#websocket-events) for complete WebSocket event documentation.

**WebSocket Connection:**
```
ws://localhost:3001/socket.io
```

Authentication via query parameter or headers:
```
?token=<jwt_token>
```

### Thread WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `thread:created` | Server → Client | New thread created in channel |
| `thread:reply` | Server → Client | New reply added to thread |
| `thread:reply:edited` | Server → Client | Thread reply was edited |
| `thread:reply:deleted` | Server → Client | Thread reply was deleted |
| `thread:reply:reaction` | Server → Client | Reaction added/removed on thread reply |
| `thread:updated` | Server → Client | Thread metadata changed (title, lock, archive, resolve) |
| `thread:deleted` | Server → Client | Thread was deleted |

---

## 📚 Additional Resources

- [Architecture Overview](ARCHITECTURE.md) - Understanding Boxcord's design
- [Features List](FEATURES.md) - All features and capabilities
- [Testing Guide](TESTING.md) - API testing with Playwright/K6
- [Production Deployment](PRODUCTION.md) - Environment setup

---

**Last Updated:** 2026-02-27  
**API Version:** v1  
**Base URL:** `/api/v1`
