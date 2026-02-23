# GIF Support in Boxcord

Boxcord supports GIF images in chats via Giphy integration! 🎉

## Features

- **GIF picker** with search and trending GIFs
- **Auto-rendering** of GIF URLs as images in messages
- Support for multiple GIF platforms (Giphy, Tenor, Imgur)
- **Responsive design** with grid layout
- **Easy to use** - click the GIF button next to the emoji picker

## Installation & Configuration

### 1. Get Giphy API Key (FREE)

1. Go to [Giphy Developers](https://developers.giphy.com/)
2. Create an account (free)
3. Click **"Create an App"**
4. Choose **"API"** (not SDK)
5. Fill in app information:
   - **App Name:** Boxcord (or any name)
   - **App Description:** Chat application with GIF support
6. Accept the terms and click **"Create App"**
7. Copy your **API Key**

### 2. Add API Key to Project

**In the client folder:**

Create a `.env.local` file (or update existing):

```env
VITE_GIPHY_API_KEY=your_actual_api_key_here
```

**Important:** Use `.env.local` and NOT `.env` to avoid committing the key to Git!

### 3. Restart Development Server

```bash
cd client
npm run dev
```

## Usage

### In Chat

1. Open any channel or DM
2. Click the **GIF button** (next to emoji picker)
3. Search for GIFs or browse trending
4. Click a GIF to send it directly

### Send GIFs Manually

You can also paste GIF URLs directly in chat:
- Giphy links (giphy.com, media.giphy.com)
- Tenor links (tenor.com)
- Imgur GIFs (i.imgur.com with .gif extension)
- Any valid GIF URL

URLs that are **only** a GIF link will automatically render as images!

## Rate Limits

Giphy's free API has the following limitations:
- **42 requests per hour**
- **1000 requests per day**

For production with more users, consider:
1. Upgrading to Giphy's paid plan
2. Implementing server-side caching
3. Limiting search frequency per user

## Technical Details

### Components

- **`GifPicker.tsx`** - GIF picker with search and grid
- **`gifRenderer.tsx`** - Detects and renders GIF URLs
- **`MessageContent.tsx`** - Updated to display GIFs

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

### Configuration

See `client/src/config/giphy.ts` for Giphy settings:

```typescript
export const GIPHY_CONFIG = {
  apiKey: GIPHY_API_KEY,
  rating: 'g', // Content rating: g, pg, pg-13, r
  limit: 10, // Number of GIFs per page
  enabled: GIPHY_API_KEY !== 'your_giphy_api_key_here'
};
```

## Troubleshooting

### GIF Button Not Visible

- Check that `VITE_GIPHY_API_KEY` is correctly set in `.env.local`
- Restart development server: `npm run dev`

### "Failed to fetch GIFs"

- Verify that API key is valid
- Check rate limits (42/hour, 1000/day)
- Check network tab in DevTools for error messages

### GIFs Not Rendering

- Check that URL is from a supported domain
- Ensure URL is correctly formatted (starts with http:// or https://)
- Check console for any CORS errors

## Examples

### Send a GIF via Picker

1. Click the GIF button
2. Search "happy cat"
3. Click any GIF
4. GIF is sent directly!

### Send a GIF via URL

Paste the URL directly:
```
https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif
```

The URL will automatically render as an image! 🎉

## Alternatives to Giphy

If you don't want to use Giphy, you can:
1. Paste GIF URLs from Tenor, Imgur, or other services
2. Implement another GIF provider
3. Upload your own GIFs as attachments

## License & Attribution

Giphy requires attribution per their terms. The GifPicker component automatically includes "Powered by GIPHY" in the footer.

---

**Enjoy GIFs in Boxcord!** 🎊✨
