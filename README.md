# Boxcord

Discord-liknande chattapplikation för Boxflow, integrerad med Boxtime.

## Tech Stack

- **Backend:** Fastify, Socket.io, Prisma, PostgreSQL
- **Frontend:** React, Vite, TailwindCSS, Zustand
- **Auth:** AWS Cognito (delad med Boxtime)
- **Arkitektur:** Onion Architecture (samma som Boxtime)

## Struktur

```text
boxcord/
├── src/                      # Backend
│   ├── 00-core/              # Delade typer, constants, errors
│   ├── 01-domain/            # Entiteter, domänlogik
│   ├── 02-application/       # Services, use cases
│   ├── 03-infrastructure/    # Databas, externa API:er
│   └── apps/api/             # Fastify API + Socket.io
├── client/                   # React frontend
├── prisma/                   # Databasschema
└── docker-compose.yml        # Lokal PostgreSQL
```

## Kom igång

### 1. Starta databas

```bash
docker compose up -d
```

### 2. Backend

```bash
# Installera beroenden
yarn install

# Generera Prisma client
yarn prisma:generate

# Kör migrationer
yarn prisma:migrate-dev

# Starta utvecklingsserver
yarn dev
```

Backend körs på <http://localhost:3001>

### 3. Frontend

```bash
cd client

# Installera beroenden
yarn install

# Starta utvecklingsserver
yarn dev
```

Frontend körs på <http://localhost:5173>

## Miljövariabler

Kopiera `.env.example` till `.env` och fyll i:

```env
DATABASE_URL="postgresql://boxcord:boxcord@localhost:5433/boxcord"
PORT=3001
JWT_SECRET=din-hemliga-nyckel-här
BOXTIME_API_URL=http://localhost:3000
```

## Boxtime-integration

Chatten använder samma Cognito-pool som Boxtime för autentisering. Användare loggar in med sina befintliga Boxtime-konton.

### Hämta användarinfo från Boxtime

```typescript
import { boxtimeService } from './02-application/services/boxtime.service';

// Hämta nuvarande användare
const user = await boxtimeService.getCurrentUser(token);

// Sök användare för @mentions
const users = await boxtimeService.searchUsers('kalle', token);
```

## WebSocket Events

### Klient → Server

- `channel:join` - Gå med i kanal
- `channel:leave` - Lämna kanal
- `message:send` - Skicka meddelande
- `message:edit` - Redigera meddelande
- `message:delete` - Ta bort meddelande
- `channel:typing` - Skrivindikator

### Server → Klient

- `message:new` - Nytt meddelande
- `message:edit` - Meddelande uppdaterat
- `message:delete` - Meddelande borttaget
- `channel:typing` - Användare skriver
- `user:online` - Användare online
- `user:offline` - Användare offline

## API Endpoints

| Metod | Path                 | Beskrivning           |
| ----- | -------------------- | --------------------- |
| GET   | /api/v1/workspaces   | Lista workspaces      |
| POST  | /api/v1/workspaces   | Skapa workspace       |
| GET   | /api/v1/channels     | Lista kanaler         |
| POST  | /api/v1/channels     | Skapa kanal           |
| GET   | /api/v1/messages     | Hämta meddelanden     |
| POST  | /api/v1/messages     | Skapa meddelande      |
| GET   | /api/v1/users/me     | Nuvarande användare   |
| GET   | /api/v1/users/search | Sök användare         |

## Nästa steg

- [ ] Implementera Cognito callback för produktionsauth
- [ ] Lägga till filuppladdning (S3)
- [x] Implementera @mentions med Boxtime-användare
- [x] Lägga till push-notiser
- [x] Integrera med Boxtime webhooks för automatiska meddelanden
- [x] Lägga till chattbot-stöd
