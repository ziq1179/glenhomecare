# Admin roles

Suggested roles for the Glens Residential Home admin area and how they map to permissions.

---

## Role list

| Role | Purpose | Permissions |
|------|--------|-------------|
| **Super Admin** | Full control; IT or manager | Photos, reviews, users & roles, settings |
| **Editor** | Day-to-day content | Photos, approve/publish reviews, edit draft content |
| **Photo Manager** | Only imagery | Manage website photos (current admin) |
| **Review Moderator** | Only reviews | View submissions, approve/reject for publication |
| **Viewer** | Read-only | View admin dashboard and content, no changes |

---

## Suggested assignments

- **Registered Manager / Owner** → Super Admin (or Editor if someone else handles IT).
- **Office / reception** → Editor (update photos, approve reviews).
- **Marketing or designated staff** → Photo Manager (update photos only).
- **Senior care staff** → Review Moderator (approve family reviews).
- **New staff / observers** → Viewer (see how the site is managed, no edits).

---

## Implementation (current)

The API supports roles via **env-based logins** (no user table yet):

- `ADMIN_PASSWORD` → **super_admin**
- `EDITOR_PASSWORD` → **editor**
- `PHOTO_MANAGER_PASSWORD` → **photo_manager**
- `REVIEW_MODERATOR_PASSWORD` → **review_moderator**
- `VIEWER_PASSWORD` → **viewer**

Each role can log in; the API checks the role for each action (e.g. only `photo_manager` and above can save photos). The admin UI can show or hide sections based on the logged-in role.

To add a **user table** in Neon later (multiple users per role, no shared passwords), the same role names and permissions can be reused.
