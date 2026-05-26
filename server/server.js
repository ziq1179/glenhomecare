/**
 * Glens Residential Home - API server
 * - GET /api/photos (public): returns photo slot URLs for the website
 * - POST /api/login: admin login with role (password matches one of the role env vars)
 * - POST /api/photos (auth, role): update photo slot URLs (stored in Neon)
 * - POST /api/auth/verify: check token (200 + { ok, role }) — used on admin load to avoid console 401 noise
 * - GET /api/me (auth): current user role for admin UI
 *
 * Roles: super_admin, editor, photo_manager, review_moderator, viewer
 * See server/ROLES.md for permissions.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const PROJECT_ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
const UPLOAD_MIME = /^image\/(jpeg|pjpeg|png|gif|webp|svg\+xml|bmp|x-ms-bmp|tiff|x-tiff|avif|heic|heif)$/i;
const UPLOAD_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|tiff?|avif|heic|heif)$/i;
const MAX_UPLOAD_MB = Math.min(100, Math.max(1, parseInt(process.env.MAX_UPLOAD_MB || '25', 10) || 25));
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const CV_UPLOADS_DIR = path.join(PROJECT_ROOT, 'cv-uploads');
const CV_MIME = /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i;
const CV_EXT = /\.(pdf|docx|doc)$/i;
const MAX_CV_MB = 10;
const MAX_CV_BYTES = MAX_CV_MB * 1024 * 1024;

if (!fs.existsSync(CV_UPLOADS_DIR)) {
  fs.mkdirSync(CV_UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tif', '.tiff', '.avif', '.heic', '.heif'].includes(ext) ? ext : '.jpg';
    const qSlot = (req.query && req.query.slot) || '';
    const safeSlot = String(qSlot).replace(/[^a-z0-9_]/gi, '_').slice(0, 32) || 'slot';
    cb(null, `${safeSlot}-${Date.now()}${safeExt}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    if (UPLOAD_MIME.test(mime)) return cb(null, true);
    if (!mime || mime === 'application/octet-stream') {
      if (UPLOAD_EXT.test(file.originalname || '')) return cb(null, true);
    }
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, AVIF, HEIC). If this is a photo, try converting to JPEG or PNG.'));
  }
});

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CV_UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.pdf', '.docx', '.doc'].includes(ext) ? ext : '.pdf';
    cb(null, `cv-${Date.now()}${safeExt}`);
  }
});
const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: MAX_CV_BYTES },
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    if (CV_MIME.test(mime)) return cb(null, true);
    if (!mime || mime === 'application/octet-stream') {
      if (CV_EXT.test(file.originalname || '')) return cb(null, true);
    }
    cb(new Error('Only PDF or Word documents (.pdf, .docx) are accepted.'));
  }
});

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
  'staff_group',
  'services_elderly_care',
  'life_hero_arts',
  'life_hero_lounge',
  'life_gal_01',
  'life_gal_02',
  'life_gal_03',
  'life_gal_04',
  'life_gal_05',
  'life_gal_06',
  'life_gal_07',
  'life_gal_08',
  'life_gal_09',
  'life_gal_10',
  'life_gal_11',
  'life_gal_12',
  'life_gal_13',
  'life_gal_14',
  'life_gal_15',
  'life_gal_16',
  'life_gal_17',
  'life_gal_18',
  'life_gal_19',
  'life_gal_20',
  'life_gal_21',
  'life_gal_22',
  'life_gal_23',
  'life_gal_24',
  'life_gal_25',
  'life_gal_26'
];

const VALID_THEMES = ['original', 'care-uk', 'good-care'];

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
  await sql`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      responded BOOLEAN DEFAULT FALSE,
      response_notes TEXT,
      responded_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS cv_submissions (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL,
      cv_filename TEXT,
      cv_original_name TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
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

function removeUploadFileByUrl(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string' || !publicUrl.startsWith('/uploads/')) return;
  const base = path.basename(publicUrl);
  if (!base || base.includes('..')) return;
  const full = path.join(UPLOADS_DIR, base);
  if (!path.resolve(full).startsWith(path.resolve(UPLOADS_DIR))) return;
  fs.unlink(full, () => {});
}

async function createContactRequest(body) {
  if (!sql) return null;
  const { name, email, phone, message } = body;
  if (!name || !email || !message) return null;
  const [row] = await sql`
    INSERT INTO contact_requests (name, email, phone, message)
    VALUES (${String(name).trim()}, ${String(email).trim()}, ${phone ? String(phone).trim() : null}, ${String(message).trim()})
    RETURNING id, name, email, phone, message, responded, response_notes, created_at
  `;
  return row;
}

async function getContactRequests() {
  if (!sql) return [];
  const rows = await sql`
    SELECT id, name, email, phone, message, responded, response_notes, responded_at, created_at
    FROM contact_requests
    ORDER BY created_at DESC
  `;
  return rows;
}

async function updateContactRequest(id, updates) {
  if (!sql) return null;
  const { responded, response_notes } = updates;
  const setNotes = typeof response_notes !== 'undefined';
  const [row] = await sql`
    UPDATE contact_requests
    SET responded = COALESCE(${responded ?? null}, responded),
        response_notes = CASE WHEN ${setNotes} THEN ${response_notes} ELSE response_notes END,
        responded_at = CASE WHEN ${responded === true} THEN NOW() ELSE responded_at END
    WHERE id = ${id}
    RETURNING id, name, email, phone, message, responded, response_notes, responded_at, created_at
  `;
  return row;
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

// Check if a saved token is still valid (always 200 — avoids red 401 lines in the browser console)
app.post('/api/auth/verify', (req, res) => {
  const raw = req.body?.token;
  if (!raw || typeof raw !== 'string') {
    return res.json({ ok: false });
  }
  const session = tokenStore.get(raw);
  if (!session?.role) {
    return res.json({ ok: false });
  }
  res.json({ ok: true, role: session.role });
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

// Admin: upload image file for a slot — file is served at /uploads/... on the same domain as the site
app.post(
  '/api/photos/upload',
  authMiddleware,
  requireRole('super_admin', 'editor', 'photo_manager'),
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `File too large (maximum ${MAX_UPLOAD_MB} MB). Compress the image or set MAX_UPLOAD_MB in the server environment.`
        });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    });
  },
  async (req, res) => {
    const slot = req.query.slot;
    if (!slot || !PHOTO_SLOTS.includes(slot)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Invalid or missing ?slot=', valid: PHOTO_SLOTS });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file; use form field name "photo"' });
    }
    if (!sql) {
      fs.unlink(req.file.path, () => {});
      return res.status(503).json({ error: 'Database not configured. Set DATABASE_URL to save uploaded image for this slot.' });
    }
    try {
      const map = await getSlots();
      removeUploadFileByUrl(map[slot]);
      const publicUrl = `/uploads/${req.file.filename}`;
      await setSlots({ [slot]: publicUrl });
      const updated = await getSlots();
      res.json({ url: publicUrl, slot, slots: updated });
    } catch (e) {
      console.error(e);
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: 'Failed to save photo' });
    }
  }
);

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

// Public: submit contact / visit request (saved to Neon)
app.post('/api/contact', async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.email || !body.message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }
  try {
    const row = await createContactRequest(body);
    if (!row) {
      return res.status(503).json({ error: 'Contact form is temporarily unavailable. Please try again or call us.' });
    }
    res.status(201).json({ id: row.id, message: 'Thank you. We will be in touch soon.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to submit. Please try again or call us.' });
  }
});

// Admin: list contact/visit requests (any logged-in admin role)
const CONTACT_VIEW_ROLES = ['super_admin', 'editor', 'photo_manager', 'review_moderator', 'viewer'];
app.get('/api/contact-requests', authMiddleware, requireRole(...CONTACT_VIEW_ROLES), async (req, res) => {
  try {
    const list = await getContactRequests();
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// Admin: update request (mark responded / add notes)
app.patch('/api/contact-requests/:id', authMiddleware, requireRole('super_admin', 'editor', 'review_moderator'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { responded, response_notes } = req.body || {};
  try {
    const row = await updateContactRequest(id, { responded, response_notes });
    if (!row) return res.status(404).json({ error: 'Request not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update' });
  }
});

const VALID_ROLES = [
  'Junior Care Assistant',
  'Senior Care Assistant',
  'Domestic (Cleaning)',
  'Cook',
  'Deputy Manager',
  'Manager',
  'Maintenance Person (Handyman)'
];

// Public: submit a CV application
app.post(
  '/api/careers/apply',
  (req, res, next) => {
    cvUpload.single('cv')(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `CV too large (max ${MAX_CV_MB} MB). Please compress and retry.` });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    });
  },
  async (req, res) => {
    const { full_name, address, phone, role } = req.body || {};
    if (!full_name || !address || !phone || !role) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!VALID_ROLES.includes(role)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Please select a valid role.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload your CV (PDF or Word document).' });
    }
    if (!sql) {
      fs.unlink(req.file.path, () => {});
      return res.status(503).json({ error: 'Applications are temporarily unavailable. Please call us directly.' });
    }
    try {
      await sql`
        INSERT INTO cv_submissions (full_name, address, phone, role, cv_filename, cv_original_name)
        VALUES (${full_name.trim()}, ${address.trim()}, ${phone.trim()}, ${role}, ${req.file.filename}, ${req.file.originalname})
      `;
      res.status(201).json({ message: 'Application received. Thank you for your interest in joining our team.' });
    } catch (e) {
      console.error(e);
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: 'Failed to save application. Please try again or call us.' });
    }
  }
);

// Admin: list CV applications
app.get('/api/careers/applications', authMiddleware, requireRole('super_admin', 'editor'), async (req, res) => {
  if (!sql) return res.json([]);
  try {
    const rows = await sql`
      SELECT id, full_name, address, phone, role, cv_filename, cv_original_name, submitted_at
      FROM cv_submissions
      ORDER BY submitted_at DESC
    `;
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load applications' });
  }
});

// Admin: download a CV file by application id
app.get('/api/careers/cv/:id', authMiddleware, requireRole('super_admin', 'editor'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });
  if (!sql) return res.status(503).json({ error: 'Database not configured' });
  try {
    const [row] = await sql`SELECT cv_filename, cv_original_name FROM cv_submissions WHERE id = ${id}`;
    if (!row || !row.cv_filename) return res.status(404).json({ error: 'CV not found' });
    const filepath = path.join(CV_UPLOADS_DIR, row.cv_filename);
    if (!path.resolve(filepath).startsWith(path.resolve(CV_UPLOADS_DIR))) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found on disk' });
    res.download(filepath, row.cv_original_name || row.cv_filename);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Uploaded images (same origin as public site, e.g. https://your-domain.com/uploads/...)
app.use('/uploads', express.static(UPLOADS_DIR));

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
