# Hankaal College — Frontend

React + TanStack Start app for **Hankaal College** e-learning platform.

Deploy this folder as its own GitHub repository → **Vercel**.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:8081 (or the port Vite prints).

Set `VITE_API_URL=http://localhost:3001` in `.env`.

## Deploy to Vercel

1. Push **only this `Frontend/` folder** to a new GitHub repo (e.g. `hankaal-frontend`).
2. In [Vercel](https://vercel.com) → **Add New Project** → import the repo.
3. Framework: **Other** (auto-detected from `vercel.json`).
4. Environment variables:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://hankaal-api.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | (optional) Google OAuth client ID |

5. Deploy.

After deploy, copy your Vercel URL (e.g. `https://hankaal.vercel.app`) into the backend `FRONTEND_URL` / `CORS_ORIGIN`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Tech

React 19 · TanStack Router/Start · Tailwind · shadcn/ui
