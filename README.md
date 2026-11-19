# Neon Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/Andy74453533/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/Andy74453533/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline, single-page web app that turns any photo into GTA 6-style cover art: multi-panel poster layouts, Vice City sunset and neon colour grades, bold Bebas Neue title lettering with a Great Vibes script subtitle, and one-click PNG export in the common post sizes. Entry for [gta6-cover-art-01 on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo**: 5 built-in sample photos, or upload your own from your machine. Photos are read locally and never uploaded anywhere.
- **Multi-panel layouts**: Hero (one full-bleed photo), Hero + 3, Grid 2×2, Duo Split, Film Strip, and Tilted Stack. Fill several panels with one photo or several — click a panel in the preview to pick it, then drag to reposition and use the zoom/pan sliders to crop each panel.
- **Colour grades**: Sunset, Neon Nights, Vice Fade, Gold Rush, Noir, and Clean — gradient overlays, saturation, vignette and film grain painted on the canvas.
- **Caption**: editable title (default `NEON VICE`) and subtitle (default `sunset heist`), drawn as a sunset-gradient title block with a striped sun disc and badge ribbon.
- **Fast export**: one click exports a PNG at 1920×1080 (cover), 1080×1080 (square) or 1080×1350 (story).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network at run time: every script, font and sample photo is a file under `app/`. Fonts are Bebas Neue and Great Vibes, both under the SIL Open Font License (texts in `app/fonts/`).

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-app.ts` library.

## Screenshots

- `1-cover.jpg` — the exported landscape cover
- `2-editor.jpg` — the editor with a photo loaded
- `3-cover-square.jpg` — the exported square cover
- `4-cover-portrait.jpg` — the exported portrait cover

## Originality

Everything here is original work: no Rockstar Games logo, wordmark, official artwork, character or font is used. The sample photos were made with an image model for this entry.

## License

MIT — see [LICENSE](LICENSE).
