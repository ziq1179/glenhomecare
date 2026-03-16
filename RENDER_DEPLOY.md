# Deploy Glens Home Care to Render

Follow these steps to run the website as a Web Service on Render (with Neon).

---

## 1. Create the Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if needed, then select the repo **ziq1179/glenhomecare**.
4. Click **Connect**.

---

## 2. Settings (use these exact values)

| Field | Value |
|-------|--------|
| **Name** | `glenhomecare` (or any name you like) |
| **Region** | Oregon (US West) or your preferred region |
| **Branch** | `main` |
| **Root Directory** | Leave **empty** (so the whole repo is available; the start command runs the server from `server/`) |
| **Runtime** | **Node** |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && node server.js` |

Do **not** use `yarn` — the project uses **npm**.

---

## 3. Environment variables

In the same page, open **Environment** (or **Environment Variables**).

Add these (use **Add Environment Variable** for each):

| Key | Value | Notes |
|-----|--------|--------|
| `DATABASE_URL` | Your Neon connection string | From [Neon dashboard](https://console.neon.tech) → your project → Connection string. Example: `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require` |
| `ADMIN_PASSWORD` | Your chosen admin password | The password you’ll use to log in to **Staff login** / admin. |
| `API_SECRET` | A long random string | e.g. generate with `openssl rand -hex 24` or a password generator. |

Optional (for other roles): `EDITOR_PASSWORD`, `PHOTO_MANAGER_PASSWORD`, `VIEWER_PASSWORD`.

---

## 4. Deploy

1. Click **Create Web Service** (or **Save** then **Deploy**).
2. Render will clone the repo, run `cd server && npm install`, then `cd server && node server.js`.
3. Wait for the deploy to finish (build and start logs appear in the dashboard).

---

## 5. Your live URLs

When the service is running, Render shows a URL like:

- **Website:** `https://glenhomecare.onrender.com`
- **Admin (Staff login):** `https://glenhomecare.onrender.com/admin/`

Open the website URL to see the site; use **Staff login** in the footer (or `/admin/`) and sign in with `ADMIN_PASSWORD`.

---

## 6. If something fails

- **Build fails:** Check the build log. Ensure **Build Command** is exactly `cd server && npm install` (no `yarn`).
- **Service won’t start:** Check the start log. Ensure **Start Command** is exactly `cd server && node server.js`.
- **Database error:** Confirm `DATABASE_URL` is the full Neon connection string (starts with `postgresql://`) and that the Neon project is not paused.
- **Admin login doesn’t work:** Confirm `ADMIN_PASSWORD` and `API_SECRET` are set in Environment (no typos, no extra spaces).

---

## Summary

- **Build Command:** `cd server && npm install`  
- **Start Command:** `cd server && node server.js`  
- **Root Directory:** leave blank  
- **Env:** `DATABASE_URL`, `ADMIN_PASSWORD`, `API_SECRET`
