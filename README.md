[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Andy74453533/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Andy74453533/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Vice Cover Studio

An offline browser app that turns any photo into GTA 6-style cover art: the iconic multi-panel poster with a Vice City neon-sunset grade, bold poster lettering, and one-click PNG export in the common post sizes. Built for the [make.fun bounty: Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests, no upload — your photos never leave the machine.

## How it works

1. **Photos** — start from the five built-in samples or add your own. Click a panel, then a photo, to place it.
2. **Layout** — six poster layouts: Four Panel, Hero + Three, Full Bleed, Nine Panel, Tilted Snaps (polaroid prints), and Duo Split.
3. **Grade** — six sunset / neon grades (Vice Sunset, Neon Night, Golden Hour, Noir, Bubblegum, Teal Coast), each a filter plus a gradient-map overlay.
4. **Words** — a bold Anton title (sunset-gradient, poster black, or neon pink), a Pacifico script subtitle, and a star heat meter.
5. **Finish** — film grain, vignette, halftone title block, hot badge ribbon, undo / redo.
6. **Export** — Square 1080 × 1080, Portrait 1080 × 1350, Wide 1920 × 1080, or all three at once.

Drag any panel to crop and position its photo, scroll to zoom, double-click to swap the photo. Progress saves in the browser (localStorage).

## Files

- `app/` — the whole app: `index.html`, `style.css`, `src/` (the cover engine on a 2D canvas: `cover.js`, `layouts.js`, `grades.js`, `main.js`, `shots.js`), `fonts/`, `samples/`
- `main.ts` — the entrypoint the grader runs: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — a tiny static server for local tries
- `shots.json` — the four screenshot scenes
- `screenshots/` — the cover and the editor at work

## Credits

- Fonts: [Anton](https://github.com/googlefonts/AntonFont) and [Pacifico](https://github.com/googlefonts/Pacifico), both under the SIL Open Font License (texts in `app/fonts/`).
- Sample photos: three made for this entry with an image model (`woman.jpg`, `rooftop.jpg`, `neon.jpg`), plus `boulevard.jpg` and `pier.jpg` from the make.fun kit, free to use. No Rockstar Games logo, artwork, or fonts are used anywhere.

## License

MIT — see [LICENSE](LICENSE).
