# Push this project to GitHub

The repo is already initialized with an initial commit. Do the following to put it on GitHub.

---

## 1. Create a new repository on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click **+** (top right) → **New repository**.
3. **Repository name:** e.g. `GlensHome` or `glens-residential-home`.
4. **Description:** optional (e.g. "Glens Residential Home website and admin").
5. Choose **Public** (or Private if you prefer).
6. **Do not** add a README, .gitignore, or license (we already have them).
7. Click **Create repository**.

---

## 2. Connect and push from your machine

In a terminal, from the **GlensHome** folder (where this file is), run the commands GitHub shows. They will look like this (use your own GitHub username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

- Replace `YOUR_USERNAME` with your GitHub username.
- Replace `YOUR_REPO_NAME` with the repo name you chose (e.g. `GlensHome`).
- If you use SSH instead of HTTPS, use: `git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git`

After this, the project will be on GitHub. You can then connect it to Render and Neon using the main README and NEON_SETUP.md.
