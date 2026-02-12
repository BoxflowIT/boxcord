# Boxcord Deployment Guide - Railway

## Förutsättningar
- GitHub-konto
- Railway-konto (gratis: railway.app)

## Steg 1: Pusha till GitHub

```bash
cd /home/jensann/boxcord
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Steg 2: Skapa Railway-projekt

1. Gå till **[railway.app](https://railway.app)** och logga in med GitHub
2. Klicka **"New Project"**
3. Välj **"Deploy from GitHub repo"**
4. Välj `boxcord`-repot

## Steg 3: Lägg till PostgreSQL

1. I Railway-dashboard, klicka **"+ New"**
2. Välj **"Database" → "PostgreSQL"**
3. Railway skapar automatiskt `DATABASE_URL`-variabeln

## Steg 4: Konfigurera miljövariabler

Gå till **Variables** i din service och lägg till:

| Variabel | Värde |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `slumpmässig-lång-sträng-minst-32-tecken` |
| `PORT` | `3001` |

**Obs!** `DATABASE_URL` sätts automatiskt av Railway.

## Steg 5: Konfigurera build och start

I **Settings** för din service:
- **Build Command**: `yarn install && yarn build`
- **Start Command**: `yarn prisma:migrate-deploy && yarn start`

## Steg 6: Deploya

Railway bygger och deployar automatiskt vid push till GitHub.

### Första gången
Kör migrationen manuellt:
1. Gå till **Settings → Deploy → Railway CLI** 
2. Eller använd Railway CLI lokalt:

```bash
npm install -g @railway/cli
railway login
railway link
railway run yarn prisma:migrate-deploy
railway run yarn tsx prisma/seed.ts
```

## Steg 7: Testa

Din app finns på Railway-URL:en, t.ex.:
`https://boxcord-production.up.railway.app`

---

## Miljövariabler som behövs

```
DATABASE_URL=         # Sätts automatiskt av Railway PostgreSQL
NODE_ENV=production
PORT=3001
JWT_SECRET=din-hemliga-nyckel-här
CORS_ORIGIN=https://din-app.up.railway.app  # Valfritt
```

## Felsökning

### Se loggar
```bash
railway logs
```

### Kör kommandon mot produktion
```bash
railway run yarn prisma:studio
```

### Kontrollera health
```bash
curl https://din-app.up.railway.app/health
```

---

## Utvecklingsworkflow

1. Utveckla lokalt (`yarn dev`)
2. Testa (`yarn test`)
3. Pusha till GitHub (`git push`)
4. Railway deployar automatiskt

## Kostnad

Railway gratis-tier inkluderar:
- 500 timmar/månad (räcker för en app)
- 1 GB RAM
- PostgreSQL-databas

För produktion, uppgradera till Hobby ($5/mån) för:
- Obegränsad körtid
- Mer RAM/CPU
- Custom domains
