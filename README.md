# Glens Residential Home – Website

A 5-page website for Glens Residential Home (Cushendall, Ballymena), built from the project brief in Document4. Static HTML/CSS/JS, ready to deploy to Render and optionally use Neon for contact form storage.

## Pages

- **Home** – Hero, mission, care types, RQIA trust badge
- **Our Services** – Elderly, dementia, disability care
- **Life at the Glens** – Activities, dining, community
- **Meet the Team** – Siobhan McHugh, staff philosophy, kitchen
- **Contact & FAQ** – Map link, contact form, FAQ accordion, RQIA link
- **Privacy Policy** – GDPR-oriented privacy information

## Design

- **Colours:** Soft sage green, sky blue, warm cream (healing palette)
- **Accessibility:** 18px base font, high contrast, skip link, focus styles
- **Responsive:** Mobile-first; sticky “Call Us” button on small screens
- **CTAs:** “Book a Visit” on every page, “Call Us” in header and sticky on mobile

## Run locally

**Option A – Static only (no admin/Neon):**  
Open `index.html` in a browser, or run a static server (e.g. `python -m http.server 8000` or `npx serve .`).

**Option B – Full app (website + API + Neon):**  
Run the app from the project root so the site and admin are served together and photos are stored in Neon.

1. **Link Neon:** Follow **[NEON_SETUP.md](NEON_SETUP.md)** to create a Neon project and put `DATABASE_URL` in `server/.env`.
2. From the **project root**:
   ```bash
   npm run install:server
   npm start
   ```
3. Open **http://localhost:3001** (website) and **http://localhost:3001/admin** (admin). Photo changes are saved to Neon.

## Deploy to Render (run as app with Neon)

1. Push this repo to GitHub/GitLab.
2. In [Render](https://render.com): **New → Web Service**. Connect the repo.
3. Render can use the repo’s **render.yaml** (Blueprint), or set manually:
   - **Root directory:** leave default (repo root).
   - **Build command:** `cd server && npm install`
   - **Start command:** `cd server && node server.js`
4. **Environment:** Add `DATABASE_URL` (Neon connection string), `ADMIN_PASSWORD`, `API_SECRET`. See [NEON_SETUP.md](NEON_SETUP.md).
5. Deploy. One URL serves the website and API (e.g. `https://glens-home-app.onrender.com` and `https://glens-home-app.onrender.com/admin`).

To host the static site and API on separate Render services instead, deploy the API as above and the static site as a **Static Site**; set `window.GLENS_PHOTOS_API` to the API URL where the static site is built or in a small script.

## Contact form and Neon (optional)

The contact form currently validates and shows a success message only; it does not send data anywhere. To store submissions in **Neon** (Postgres):

1. Create a Neon project and get the connection string.
2. Add a small backend (e.g. Node/Express) with one POST endpoint that inserts into a table and add it as a **Web Service** on Render.
3. Set the Neon connection string in the Render service environment.
4. Point the form’s submit handler to that API (e.g. via `fetch` in `js/main.js`).

## Admin: managing website photos

An **admin user** can manage the photos shown on the site without editing code.

1. **Photo guide** (`photo-guide.html`) – Checklist for staff: what to photograph (exterior, garden, lounge, bedroom, dining, meal, activity, nursery visit, manager headshot, staff group). Use it when taking or choosing images.
2. **API server** (`server/`) – Node + Express app that:
   - Exposes **GET /api/photos** (public) – returns current image URL for each slot.
   - **POST /api/login** – admin login with `ADMIN_PASSWORD`; returns a token.
   - **POST /api/photos** (auth) – save image URLs per slot (stored in Neon).
3. **Admin UI** – Open `/admin/` (when using the API server). Log in, then paste image URLs for each slot. Images can be hosted anywhere (e.g. Imgur, Cloudinary, or your own server); the admin only stores the URL.
4. **Public site** – Each managed image has `data-photo-slot="..."`. The script `js/photos.js` fetches `/api/photos` and replaces `img` sources when the API returns a URL for that slot. If the API is unavailable or a slot is empty, the default (e.g. Unsplash) stays.

**Run the API locally (with Neon):**

```bash
cd server
cp .env.example .env
# Edit .env: set ADMIN_PASSWORD, API_SECRET, DATABASE_URL (Neon connection string)
npm install
npm start
```

Then open `http://localhost:3001` for the main site and `http://localhost:3001/admin/` for the admin. Set `window.GLENS_PHOTOS_API = 'https://your-api.onrender.com'` on the **static site** if the site and API are on different domains (e.g. static site on Render Static, API on Render Web Service).

**Deploy API to Render:** Create a Web Service, root directory `server`, build `npm install`, start `npm start`. Add env vars: `ADMIN_PASSWORD`, `API_SECRET`, `DATABASE_URL`.

## Images

The site uses **Unsplash** placeholders by default. Use the **admin** to set your own image URLs per slot, or replace `src` in the HTML. See **Photo guide** for the full checklist (exterior, garden, lounge, bedroom, dining, meal, activity, nursery visit, manager headshot, staff group).

## Regulation

- **RQIA:** Link to [RQIA](https://www.rqia.org.uk) is on Home and Contact.
- **Privacy:** GDPR-oriented Privacy Policy at `privacy.html`, linked from footer and contact form.
