# Test Scripts

Denna mapp innehåller utility-scripts för att testa Boxcord-funktionalitet under utveckling.

## Tillgängliga Scripts

### send-dm.cjs

Skickar ett test-DM från Anna (user-2) till Jens.

**Användning:**

```bash
node scripts/send-dm.cjs
```

**Vad den gör:**

- Skapar/hittar en DM-kanal mellan user-2 och Jens
- Skickar ett testmeddelande
- Använder mock-token för autentisering (endast dev)

### send-mention.cjs

Skickar en @mention i en kanal för att testa mention-notifikationer.

**Användning:**

```bash
node scripts/send-mention.cjs
```

**Vad den gör:**

- Skickar ett meddelande med @mention till Jens
- Testar push-notifikationer för mentions
- Använder mock-token för autentisering (endast dev)

## Konfiguration

Scripts förutsätter att:

- Backend körs på `http://localhost:3001`
- `ALLOW_MOCK_TOKENS=true` i backend `.env`
- Jens's user ID är: `f02cf92c-d0e1-70d4-02de-db967a695a11`

## Mock Tokens

Mock tokens används endast i development-miljö och har följande format:

```javascript
{
  sub: "user-2",           // User ID
  email: "anna@boxflow.com",
  name: "Anna Andersson",
  workspaces: [{ id: "workspace-id", role: "MEMBER" }]
}
```

**OBS:** Mock tokens fungerar INTE i produktion.
