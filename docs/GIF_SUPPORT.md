# GIF Support i Boxcord

Boxcord stödjer GIF-bilder i chattar via Giphy integration! 🎉

## Funktioner

- **GIF-väljare** med sök och trending GIFs
- **Auto-rendering** av GIF-URLs som bilder i meddelanden
- Stöd för flera GIF-plattformar (Giphy, Tenor, Imgur)
- **Responsiv design** med grid-layout
- **Lätt att använda** - klicka på GIF-knappen bredvid emoji-väljaren

## Installation & Konfiguration

### 1. Skaffa Giphy API-nyckel (GRATIS)

1. Gå till [Giphy Developers](https://developers.giphy.com/)
2. Skapa ett konto (gratis)
3. Klicka på **"Create an App"**
4. Välj **"API"** (inte SDK)
5. Fyll i app-information:
   - **App Name:** Boxcord (eller valfritt namn)
   - **App Description:** Chat application with GIF support
6. Acceptera villkoren och klicka **"Create App"**
7. Kopiera din **API Key**

### 2. Lägg till API-nyckeln i projektet

**I client-mappen:**

Skapa en `.env.local` fil (eller uppdatera befintlig):

```env
VITE_GIPHY_API_KEY=your_actual_api_key_here
```

**Viktigt:** Använd `.env.local` och INTE `.env` för att undvika att commita nyckeln till Git!

### 3. Starta om utvecklingsservern

```bash
cd client
npm run dev
```

## Användning

### I Chatten

1. Öppna valfri kanal eller DM
2. Klicka på **GIF-knappen** (bredvid emoji-väljaren)
3. Sök efter GIFs eller bläddra bland trending
4. Klicka på en GIF för att skicka den direkt

### Skicka GIFs manuellt

Du kan också klistra in GIF-URLs direkt i chatten:
- Giphy-länkar (giphy.com, media.giphy.com)
- Tenor-länkar (tenor.com)
- Imgur GIFs (i.imgur.com med .gif-ändelse)
- Vilken giltig GIF-URL som helst

URLs som är **endast** en GIF-länk kommer automatiskt renderas som bilder!

## Rate Limits

Giphy's gratis API har följande begränsningar:
- **42 requests per timme**
- **1000 requests per dag**

För production med fler användare, överväg att:
1. Uppgradera till Giphy's betald plan
2. Implementera caching på serversidan
3. Begränsa sökfrekvens per användare

## Tekniska detaljer

### Komponenter

- **`GifPicker.tsx`** - GIF-väljare med sök och grid
- **`gifRenderer.tsx`** - Detekterar och renderar GIF-URLs
- **`MessageContent.tsx`** - Uppdaterad för att visa GIFs

### Stödda domäner

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

### Konfiguration

Se `client/src/config/giphy.ts` för Giphy-inställningar:

```typescript
export const GIPHY_CONFIG = {
  apiKey: GIPHY_API_KEY,
  rating: 'g', // Innehållsklassificering: g, pg, pg-13, r
  limit: 10, // Antal GIFs per sida
  enabled: GIPHY_API_KEY !== 'your_giphy_api_key_here'
};
```

## Felsökning

### GIF-knappen syns inte

- Kontrollera att `VITE_GIPHY_API_KEY` är korrekt satt i `.env.local`
- Starta om utvecklingsservern: `npm run dev`

### "Failed to fetch GIFs"

- Verifiera att API-nyckeln är giltig
- Kontrollera rate limits (42/timme, 1000/dag)
- Kolla nätverksfliken i DevTools för felmeddelanden

### GIFs renderas inte

- Kontrollera att URL:en är från en stödd domän
- Se till att URL:en är korrekt formaterad (börjar med http:// eller https://)
- Kontrollera konsolen för eventuella CORS-fel

## Exempel

### Skicka en GIF via väljaren

1. Klicka på GIF-knappen
2. Sök "happy cat"
3. Klicka på valfri GIF
4. GIF:en skickas direkt!

### Skicka en GIF via URL

Klistra in URL:en direkt:
```
https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif
```

URL:en kommer automatiskt renderas som en bild! 🎉

## Alternativ till Giphy

Om du inte vill använda Giphy kan du:
1. Klistra in GIF-URLs från Tenor, Imgur, eller andra tjänster
2. Implementera en annan GIF-provider
3. Ladda upp egna GIFs som bilagor

## Licens & Attribution

Giphy kräver attribution enligt deras villkor. GifPicker komponenten inkluderar automatiskt "Powered by GIPHY" i footern.

---

**Njut av GIFs i Boxcord!** 🎊✨
