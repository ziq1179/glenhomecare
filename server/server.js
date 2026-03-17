/**
 * Glens Residential Home - API server
 * - GET /api/photos (public): returns photo slot URLs for the website
 * - POST /api/login: admin login with role (password matches one of the role env vars)
 * - POST /api/photos (auth, role): update photo slot URLs (stored in Neon)
 * - GET /api/me (auth): current user role for admin UI
 *
 * Roles: super_admin, editor, photo_manager, review_moderator, viewer
 * See server/ROLES.md for permissions.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const PROJECT_ROOT = path.join(__dirname, '..');

function loadAdminPassword() {
  try {
    const configPath = path.join(__dirname, 'admin-config.json');
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data.adminPassword && typeof data.adminPassword === 'string') {
        return data.adminPassword;
      }
    }
  } catch (e) { /* ignore */ }
  return process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'admin123';
}

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || 'change-me-in-production';

const ADMIN_PASSWORD = loadAdminPassword();

// Role passwords: admin from admin-config.json or .env; others from .env only
const ROLE_PASSWORDS = {
  super_admin: ADMIN_PASSWORD,
  editor: process.env.EDITOR_PASSWORD,
  photo_manager: process.env.PHOTO_MANAGER_PASSWORD,
  review_moderator: process.env.REVIEW_MODERATOR_PASSWORD,
  viewer: process.env.VIEWER_PASSWORD
};

// token -> { role }
const tokenStore = new Map();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let sql = null;
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('@host/')) {
  try {
    sql = neon(process.env.DATABASE_URL);
  } catch (e) {
    console.warn('DATABASE_URL invalid; photo storage disabled:', e.message);
  }
}

const PHOTO_SLOTS = [
  'exterior_entrance',
  'garden_grounds',
  'glens_landscape',
  'bedroom',
  'lounge',
  'dining',
  'meal_plated',
  'activity',
  'nursery_visit',
  'manager_headshot',
  'staff_group'
];

const VALID_THEMES = ['original', 'care-uk'];

async function ensureTable() {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS photo_slots (
      slot_key TEXT PRIMARY KEY,
      url TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function getSettings() {
  if (!sql) return { theme: 'original' };
  try {
    const rows = await sql`SELECT key, value FROM site_settings`;
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    const theme = VALID_THEMES.includes(map.theme) ? map.theme : 'original';
    return { theme };
  } catch (e) {
    return { theme: 'original' };
  }
}

async function setSetting(key, value) {
  if (!sql) return;
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${value || null}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

async function getSlots() {
  if (!sql) return Object.fromEntries(PHOTO_SLOTS.map(k => [k, null]));
  const rows = await sql`SELECT slot_key, url FROM photo_slots`;
  const map = Object.fromEntries(PHOTO_SLOTS.map(k => [k, null]));
  rows.forEach(r => { map[r.slot_key] = r.url; });
  return map;
}

async function setSlots(slots) {
  if (!sql) return;
  for (const [key, url] of Object.entries(slots)) {
    if (!PHOTO_SLOTS.includes(key)) continue;
    await sql`
      INSERT INTO photo_slots (slot_key, url, updated_at)
      VALUES (${key}, ${url || null}, NOW())
      ON CONFLICT (slot_key) DO UPDATE SET url = EXCLUDED.url, updated_at = NOW()
    `;
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = token && tokenStore.get(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  req.auth = session;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden', requiredRole: allowedRoles });
    }
    next();
  };
}

// Public: get current photo URLs
app.get('/api/photos', async (req, res) => {
  try {
    const slots = await getSlots();
    res.json(slots);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

// Admin login: password must match one of the role env vars; returns token + role
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  let role = null;
  for (const [r, pwd] of Object.entries(ROLE_PASSWORDS)) {
    if (pwd && password === pwd) {
      role = r;
      break;
    }
  }
  if (!role) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = API_SECRET + '-' + Math.random().toString(36).slice(2);
  tokenStore.set(token, { role });
  res.json({ token, role });
});

// Current user (role) for admin UI
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ role: req.auth.role });
});

// Admin: update photo slots (requires auth + role that can edit photos)
app.post('/api/photos', authMiddleware, requireRole('super_admin', 'editor', 'photo_manager'), async (req, res) => {
  const slots = req.body?.slots || req.body;
  if (typeof slots !== 'object') {
    return res.status(400).json({ error: 'Expected object of slot keys to URLs' });
  }
  try {
    await setSlots(slots);
    const updated = await getSlots();
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save photos' });
  }
});

// Public: get site settings (e.g. theme for front-end)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Admin: update site settings (theme: original | care-uk)
app.post('/api/settings', authMiddleware, requireRole('super_admin', 'editor'), async (req, res) => {
  const { theme } = req.body || {};
  if (!VALID_THEMES.includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme', valid: VALID_THEMES });
  }
  try {
    await setSetting('theme', theme);
    const settings = await getSettings();
    res.json(settings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Serve admin UI and main site (so /photo-guide.html etc. work when using this server)
app.use('/admin', express.static(path.join(PROJECT_ROOT, 'admin'), { index: 'index.html' }));
app.use(express.static(PROJECT_ROOT));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

(async () => {
  if (sql) {
    try {
      await ensureTable();
    } catch (e) {
      console.warn('Database connection failed; photo storage disabled:', e.message);
      sql = null;
    }
  }
  app.listen(PORT, () => {
    console.log(`Glens API running on port ${PORT}`);
    if (!sql) console.warn('Photo storage disabled. Set a valid DATABASE_URL (Neon) in .env to persist photos.');
  });
})();
