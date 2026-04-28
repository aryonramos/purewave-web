# PureWave — v4

Major upgrade focused on phone+disc 3D scenes and EMF visualization.

## What's new in v4

### Three narrative 3D scroll scenes (replaces v3's disc-only scenes)

**Scene 1 — Apply** (the peel-and-press story)
A 3D phone in the center with a disc that flies in from the upper right. As you scroll, the disc trails through 3D space, tilts flat, and lands flush on the back of the phone. A glowing target ring appears on the phone-back during the approach to show where it'll land. Once attached, the disc rides with the phone as the phone rotates.

**Scene 2 — EMF: Chaos to Calm** (dark theme, the dramatic moment)
A 3D phone at the center, surrounded by chaotic radiating wave rings — jagged, distorted, red/orange, scattered. As you scroll past, the disc descends from above onto the phone's back. The waves transform: distortion smooths out, colors shift to calm blue/gold, the field becomes organized. The phone's screen glow shifts from chaotic red to calm blue. A custom shader handles the chaos→calm morph through a uChaos uniform.

**Scene 3 — Shield Field** (alt cream theme)
Phone with disc already applied, surrounded by a breathing dotted-sphere "field" of points. As you scroll, the field intensifies, gently pulses, and the phone slowly rotates. Built with a shader-driven point cloud — no expensive geometry.

### Other improvements
- New 3D primitives: `buildPhone3D` (rounded body, screen, dynamic island, camera bump with two lenses, screen glow plane), `buildEMFWaves` (6 concentric rings with chaos shader), `buildShieldField` (28×28 sphere of points)
- All scenes use scroll-tied progress (sticky-pinned, 200vh tall blocks, disc/phone position computed from scroll progress through the block)
- Scenes auto-disable on very small mobile (<480px) for battery/performance
- Quaternion math for disc-on-phone-back attachment so the disc properly rides the phone when it rotates

### Retained from v3
Smooth scroll, top progress bar, marquee bands, scroll reveals, animated counters, bar-fill stat visualizations, sticky cart, live notifications, countdown, bundle selector.

## Deploying — replace your existing repo

```bash
cd ~/Downloads/purewave-static-v4
git init
git remote add origin https://github.com/aryonramos/purewave-web.git
git fetch
git reset --soft origin/main
git add .
git commit -m "v4 — phone+disc apply scene, EMF chaos to calm, shield field"
git push -f origin main
```

Vercel will auto-redeploy in ~30 seconds.

## Local preview

```bash
cd purewave-static-v4
python3 -m http.server 8000
# open http://localhost:8000
```

## Stack

- Static HTML / CSS / JS — no build step
- Three.js r128 (CDN) for the 3D scenes
- Custom GLSL shaders for the holographic disc, EMF waves, and shield field
- Fraunces + Inter Tight from Google Fonts
- Deploys to Vercel as-is, no config beyond `vercel.json`
