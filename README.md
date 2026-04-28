# PureWave — Static Site (Version 2)

This is the static-site version of your PureWave landing page, ready to deploy via GitHub + Vercel.

## What's in this folder

```
purewave-static-v2/
├── index.html          ← the landing page
├── vercel.json         ← Vercel config (minimal)
├── .gitignore
├── README.md
└── assets/
    ├── theme.css       ← all styles
    ├── theme.js        ← all interactivity (3D, animations, etc.)
    └── *.png           ← all your product photos
```

## How to deploy

### Option A — GitHub + Vercel (recommended)

1. **Create a new GitHub repo** (e.g. `purewave-site`).
2. **Initialize this folder as a git repo and push it:**
   ```bash
   cd purewave-static-v2
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/purewave-site.git
   git push -u origin main
   ```
3. **Go to [vercel.com](https://vercel.com)** and click **Add New → Project**.
4. **Import your GitHub repo.** Vercel will auto-detect it as a static site.
5. **Click Deploy.** That's it — your live site will be at `your-project.vercel.app` in about 30 seconds.

### Option B — Vercel CLI direct upload

```bash
npm i -g vercel
cd purewave-static-v2
vercel
```

Follow the prompts. First deploy gives you a preview URL; run `vercel --prod` to push to production.

### Option C — Test locally first

```bash
cd purewave-static-v2
python3 -m http.server 8000
```

Then open http://localhost:8000

## What this version includes

1. **3D interactive PureWave disc in the hero** — gold holographic, drag to rotate, auto-spins, follows the cursor. Built with Three.js (loaded from CDN).
2. **Sticky-scroll product story** — disc stays pinned in the centre while three text panels (Engineered / Applied / Invisible) fade in as you scroll past, with **progress dots indicator** at the bottom.
3. **3D card tilt with glare** on problem cards, bundles, "How it works" steps, and review cards.
4. **Magnetic CTAs** — buttons gently follow the cursor.
5. **Custom gold cursor** (desktop only, hidden on touch).
6. **Line-by-line headline reveals** on scroll (more headings than V1).
7. **Animated stat counters** in the reviews section.
8. **Parallax** on the showcase gallery images.

All effects respect `prefers-reduced-motion` and are auto-disabled on touch devices.

## Differences from V1

- V2 has a **progress-dots indicator** at the bottom of the sticky-scroll section (three dots that fill in as you progress).
- V1 has a **hero scroll cue** ("Scroll" indicator with animated line) that V2 doesn't.
- Slightly different copy in the sticky panels.

## Notes

- The "Add to Cart" form action has been changed to a no-op for the static demo (it shows an alert instead of trying to POST to a Shopify endpoint that doesn't exist). When you're ready to wire it up to a real store, change the form back to point at your checkout endpoint.
- Three.js loads from `cdnjs.cloudflare.com` — no build step required.
- Total page weight: ~700KB (mostly the product photos).
