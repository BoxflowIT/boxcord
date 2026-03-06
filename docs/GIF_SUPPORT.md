# GIF Support in Boxcord

Boxcord supports GIF images in chats via Giphy integration.

## Architecture

All Giphy API calls are made **directly from the client** (required by Giphy ToS). There is no backend proxy — the API key is a client-side `VITE_` env variable.

## Features

- **GIF picker** with search and trending GIFs (in emoji picker, "GIFs" tab)
- **Auto-rendering** of GIF URLs as images in messages
- Support for multiple GIF platforms (Giphy, Tenor, Imgur)
- **Masonry grid layout** via `@giphy/react-components`
- **"Powered by GIPHY"** attribution (required by ToS)

## Setup

### 1. Get Giphy API Key (FREE)

1. Go to [Giphy Developers](https://developers.giphy.com/)
2. Create an account (free)
3. Click **"Create an App"**
4. Choose **"API"** (not SDK)
5. Copy your **API Key**
6. Apply for **Production** upgrade (free, removes 100 req/hour beta limit)

### 2. Add API Key

Create `client/.env`:

```env
VITE_GIPHY_API_KEY=your_api_key_here
```

> **Note:** `client/.env` is gitignored. Never commit API keys.

### 3. Restart Dev Server

```bash
cd client && npm run dev
```

The **GIFs** tab will appear in the emoji picker when the key is set.

## Rate Limits

| Tier | Limit | Cost |
|------|-------|------|
| **Beta** | 100 req/hour | Free |
| **Production** | Generous (apply via dashboard) | Free |

## Technical Details

### Components

| File | Purpose |
|------|---------|
| `client/src/components/ui/EmojiPicker.tsx` | GIF picker UI with search, Grid, attribution |
| `client/src/config/giphy.ts` | Config (API key, rating, enabled flag) |
| `client/src/utils/gifRenderer.tsx` | Detects and renders GIF URLs in messages |
| `client/src/utils/retry.ts` | `retryGiphy()` with exponential backoff |
| `client/src/components/message/MessageContent.tsx` | Renders GIF-only messages as images |

### Supported Domains

```typescript
const GIF_DOMAINS = [
  'giphy.com',
  'media.giphy.com',
  'i.giphy.com',
  'tenor.com',
  'media.tenor.com',
  'i.imgur.com',
  'media.discordapp.net'
];
```

### NPM Packages

- `@giphy/js-fetch-api` — Direct Giphy API client
- `@giphy/react-components` — Masonry `<Grid>` component
- `@giphy/js-types` — TypeScript types (transitive)

## Troubleshooting

### GIF Tab Not Visible

- Check that `VITE_GIPHY_API_KEY` is set in `client/.env`
- Restart dev server

### "Failed to fetch GIFs"

- Verify API key is valid at [developers.giphy.com/dashboard](https://developers.giphy.com/dashboard)
- Check rate limits (beta: 100/hour)
- Check browser network tab for errors

### GIFs Not Rendering in Messages

- URL must be from a supported domain
- Message must contain **only** a GIF URL (no other text)

## Attribution

Giphy requires "Powered by GIPHY" attribution. This is included automatically in the EmojiPicker GIF tab footer.

---

**Last Updated:** March 2026
