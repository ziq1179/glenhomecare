# Link the app to Neon (database)

Follow these steps so the website runs as a single app with Neon storing admin photos (and optional future data).

---

## 1. Create a Neon project

1. Go to **[neon.tech](https://neon.tech)** and sign in (or create an account).
2. Click **New Project**.
3. Choose a name (e.g. `glens-home`), region, and Postgres version. Create the project.

---

## 2. Get the connection string

1. In the Neon dashboard, open your project.
2. On the **Dashboard** tab, find **Connection string**.
3. Select **Node.js** (or copy the URI).
4. Copy the full string. It looks like:
   ```text
   postgresql://username:password@ep-xxxxx-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   You may need to click **Reset password** and copy the new string if the password is hidden.

---

## 3. Configure the app locally

1. In the project, go to the **server** folder and copy the example env file:
   ```bash
   cd server
   cp .env.example .env
   ```
2. Open **server/.env** and set:
   - **DATABASE_URL** – paste the Neon connection string from step 2.
   - **ADMIN_PASSWORD** – choose a secure password for the main admin.
   - **API_SECRET** – any long random string (e.g. `openssl rand -hex 24`).
3. Save the file.

---

## 4. Run the website as an app

From the **project root** (GlensHome):

```bash
npm run install:server
npm start
```

Or from the server folder:

```bash
cd server
npm install
npm start
```

Then open:

- **Website:** [http://localhost:3001](http://localhost:3001)
- **Admin:** [http://localhost:3001/admin](http://localhost:3001/admin)

The app will create the `photo_slots` table in Neon on first run. Admin photo changes are stored in Neon and persist across restarts.

---

## 5. Deploy to Render with Neon

1. **Render:** Create a **Web Service**. Connect your repo.
2. **Settings:**
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. **Environment:** Add variables:
   - `DATABASE_URL` = your Neon connection string
   - `ADMIN_PASSWORD` = your admin password
   - `API_SECRET` = your secret
4. Deploy. The service will serve both the website and the API from one URL (e.g. `https://glens-home.onrender.com`). Set **Root directory** to `server` so that the start command runs in `server/` and the app still serves the parent folder (site + admin) as static files.

If you prefer to host the static site and API separately (e.g. static site on Render Static, API on Render Web Service), set `DATABASE_URL` (and other env vars) on the API service and point the static site’s `window.GLENS_PHOTOS_API` to the API URL.
