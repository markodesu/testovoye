# OKLCH Color Picker

A small React + Vite color picker that uses OKLCH (via `culori`).

Features
- Four sliders: Lightness (L), Chroma (C), Hue (H), Alpha (A)
- Live color preview square
- Text inputs for `oklch(...)` and `rgb(...)` — edit and press Enter or blur to update sliders
- URL hash sync: `#L,C,H,A` — sliders update the hash and initial values are read from it
- Out-of-gamut warning if the color is outside sRGB

Author: mariiam

Quick start

1. Install dependencies

```bash
npm install
```

2. Run development server

```bash
npm run dev
# open http://localhost:5173
```

3. Build for production

```bash
npm run build
npm run preview
```

Notes

- The project uses the `culori` library for color parsing and conversions.
- The `window.location.hash` is used to persist and share current color as `#L,C,H,A`.

Repository

https://github.com/markodesu/testovoye

License

MIT — see repository for details.
