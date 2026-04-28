# PureWave — v3

Major redesign focused on:
- Multiple 3D scroll-driven moments (Oryzo-style sticky pins)
- Cleaner mobile layout, no overlapping elements
- Smoother typography and section rhythm

## What's new in v3

### Three sticky-pinned 3D feature blocks
Each scrolls past while the disc rotates / scales / shifts. The keyframes are different per block — feature 0 turns face-on to side, feature 1 does a peel-and-press tilt, feature 2 spins twice while zooming.

### Marquee bands
Italic "Made for devices. Built for life." between sections, plus a gold one near the bottom.

### Top scroll-progress bar
Thin gold line across the top, fills as you scroll.

### Bug fixes
- Removed `data-tilt` from the hero floating badges (was breaking their absolute positioning)
- Sticky 3D panels mobile layout fully rebuilt — no more `top: 50%` getting stuck on
- Live notification toast no longer overlaps the sticky cart on mobile (auto-shifts up when both visible)
- Announcement bar marquee now seamless on mobile
- Bundle cards no longer fight their hover transforms

## Deploying — replace your existing repo

You already have `aryonramos/purewave-web` on GitHub and Vercel is hooked up to it. To replace v2 with v3, the simplest path is:

```bash
cd ~/Downloads/purewave-static-v3
git init
git remote add origin https://github.com/aryonramos/purewave-web.git
git fetch
git reset --soft origin/main
git add .
git commit -m "v3 redesign — multiple 3D scroll moments, mobile fixes"
git push -f origin main
```

Vercel will auto-redeploy in ~30 seconds. Same URL.

## Local preview

```bash
cd purewave-static-v3
python3 -m http.server 8000
# open http://localhost:8000
```

## Stack

- Static HTML / CSS / JS — no build step
- Three.js r128 (CDN) for the 3D disc
- Fraunces + Inter Tight from Google Fonts
- Deploys to Vercel as-is, no config beyond `vercel.json`
