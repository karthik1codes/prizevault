# Public Directory Structure

## 📁 HTML Files Location

All HTML entry point files have been moved to the `public/` directory:

```
issuer/did/frontend/
├── public/
│   ├── index.html          (Landing page)
│   ├── issuer.html         (Issuer dashboard)
│   ├── holder-wallet.html  (Holder wallet)
│   ├── metamask.html       (MetaMask login)
│   └── recruiter.html      (Recruiter console)
├── src/                    (React components)
├── vite.config.js          (Updated to use public HTML files)
└── package.json
```

## 🔧 Vite Configuration

The `vite.config.js` has been updated to:

1. **Set `publicDir: 'public'`** - Tells Vite where static assets are
2. **Configure build inputs** - Explicitly maps HTML files from public directory as entry points
3. **Maintain MPA mode** - Multi-page application mode is preserved

## 🌐 Accessing Pages

After running `npm run dev`, access pages at:

- **Landing:** `http://localhost:5173/index.html` or `http://localhost:5173/`
- **Issuer:** `http://localhost:5173/issuer.html`
- **Holder Wallet:** `http://localhost:5173/holder-wallet.html`
- **MetaMask Login:** `http://localhost:5173/metamask.html`
- **Recruiter:** `http://localhost:5173/recruiter.html`

## ✅ What Changed

1. ✅ Created `public/` directory
2. ✅ Moved all 5 HTML files to `public/`
3. ✅ Updated `vite.config.js` to reference HTML files from public
4. ✅ Configured build inputs for all HTML pages

## 🚀 Running the Application

```bash
cd issuer/did/frontend
npm run dev
```

The dev server will automatically serve all HTML files from the `public/` directory.

## 📝 Notes

- HTML files in `public/` are served as static entry points
- React components in `src/` are still processed normally
- The `publicDir` setting ensures static assets are accessible
- Build configuration explicitly maps each HTML file as an entry point

