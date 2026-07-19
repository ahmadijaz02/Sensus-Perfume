# Sensus Perfume — Vercel Deployment Guide

## Architecture Overview

```
Vercel Project (Single Deployment)
├── Frontend  → Vite + React build → served as static files from /dist
└── Backend   → Express via serverless-http → api/index.js function
```

All `/api/*` requests are routed to `api/index.js` (serverless function).  
All other requests serve the React SPA via `index.html`.

---

## Prerequisites

- [Vercel account](https://vercel.com)
- [Vercel CLI](https://vercel.com/docs/cli) (optional but recommended): `npm i -g vercel`
- MongoDB Atlas cluster (free tier works fine)

---

## Step 1 — Push Code to GitHub

```bash
git add .
git commit -m "chore: vercel deployment setup"
git push origin main
```

> ⚠️ Make sure `.env` is in `.gitignore` — **never commit secrets**.

---

## Step 2 — Create Vercel Project

### Option A — Vercel Dashboard (recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect the project settings from `vercel.json`
4. **Do NOT** change the build settings — they're configured in `vercel.json`
5. Click **Deploy** (it will fail the first time — that's expected, environment variables are missing)

### Option B — Vercel CLI
```bash
vercel
```

---

## Step 3 — Set Environment Variables

In the Vercel dashboard → Your Project → **Settings** → **Environment Variables**, add:

| Variable | Value | Environment |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview |
| `JWT_SECRET` | (strong random string) | Production, Preview |
| `NODE_ENV` | `production` | Production |
| `SMTP_HOST` | `mail.sensusperfume.com` | Production, Preview |
| `SMTP_PORT` | `465` | Production, Preview |
| `SMTP_SECURE` | `true` | Production, Preview |
| `SMTP_USER` | `no-reply@sensusperfume.com` | Production, Preview |
| `SMTP_PASS` | `(your SMTP password)` | Production, Preview |
| `FROM_EMAIL` | `Sensus Perfumes <no-reply@sensusperfume.com>` | Production, Preview |
| `ORDER_NOTIFY_EMAIL` | `sensusperfume@gmail.com` | Production, Preview |
| `VITE_META_PIXEL_ID` | `1418748769717721` | Production, Preview |

> ⚠️ `VITE_API_URL` should **NOT** be set in production. Leave it empty/absent so the app uses relative `/api` paths on the same domain.

After adding all variables, click **Redeploy**.

---

## Step 4 — MongoDB Setup

### Allow Vercel IP Addresses
Vercel serverless functions run from dynamic IPs. You must allow all IPs in MongoDB Atlas:

1. Go to **MongoDB Atlas** → Your Cluster → **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Click **Confirm**

> For better security, see [Vercel's guide on static IPs](https://vercel.com/guides/how-to-allowlist-deployment-ip-address) (requires Pro plan).

### Database Name
The app uses the database named `sensus-perfumes`. This is hardcoded in `api/lib/db.js`.

---

## Step 5 — Domain Configuration

### Add Custom Domain
1. Vercel dashboard → Your Project → **Settings** → **Domains**
2. Add `sensusperfume.com` and `www.sensusperfume.com`
3. Follow Vercel's DNS instructions (add CNAME/A records at your registrar)

### SSL
Vercel automatically provisions SSL certificates via Let's Encrypt.

---

## Local Development

### Terminal 1 — API Server
```bash
node server.local.js
# Starts Express API on http://localhost:5000
```

### Terminal 2 — Frontend Dev Server
```bash
npm run dev
# Starts Vite on http://localhost:8080
# /api requests are proxied to localhost:5000
```

Or use **Vercel CLI** for a full local simulation:
```bash
vercel dev
```

---

## Limitations & Notes

| Feature | Status | Notes |
|---|---|---|
| In-memory cache | ❌ Removed | Serverless functions are stateless — Map() cache was never effective in production anyway |
| WebSockets | ❌ Not supported | Not used in this project |
| Cron jobs | ❌ Not supported | Not used in this project |
| Local file storage | ❌ Ephemeral | Not used — product images are stored as URLs in MongoDB |
| Cold starts | ⚠️ ~500ms | First request after inactivity; subsequent warm requests are fast |
| Function timeout | 30 seconds | Configured in `vercel.json` — sufficient for all routes including email sending |
| Connection pooling | ✅ Works | MongoDB connection is cached at module level, reused across warm invocations |

---

## Verification Checklist

After deployment, test each of these URLs:

- [ ] `https://your-domain.vercel.app/api/health` → `{ status: 'ok' }`
- [ ] `https://your-domain.vercel.app/` → Homepage loads
- [ ] `https://your-domain.vercel.app/shop` → Shop page loads
- [ ] Register / Login flow
- [ ] Add to cart (requires login)
- [ ] Checkout → Creates order + sends confirmation email
- [ ] Admin panel at `/admin`
- [ ] Product CRUD from admin panel
- [ ] Order management from admin panel

---

## Troubleshooting

### 500 Error on API calls
- Check Vercel **Function Logs** (dashboard → Deployments → your deploy → Functions)
- Verify all environment variables are set correctly
- Check MongoDB Atlas Network Access allows `0.0.0.0/0`

### CORS Errors
- The API and frontend are served from the same domain on Vercel, so CORS is not needed
- If you see CORS errors, check that `VITE_API_URL` is NOT set in production

### Email Not Sending
- Verify `SMTP_PASS` is correct
- Check Vercel function logs for SMTP errors
- Note: Some SMTP providers block connections from cloud providers — if issues persist, consider using a transactional email service like SendGrid, Resend, or Mailgun
