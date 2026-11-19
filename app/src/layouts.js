// Cover layouts: where each panel sits, as fractions of the panel area.
//
// The panel area is the cover minus its white outer frame and minus the title
// band at the bottom. A layout returns one rectangle per slot (x, y, w, h in
// 0..1 of the panel area); `tilt` additionally gives each slot a rotation in
// degrees and a polaroid-style white border. Slot count is the number of
// panels the layout fills; the engine keeps nine panel slots and a layout
// simply uses its first N.
//
//   four  — the classic 2 x 2 grid
//   hero  — one tall hero panel left, three stacked right
//   full  — a single full-bleed photo
//   nine  — the 3 x 3 poster grid
//   tilt  — three tilted snapshot prints over a sunset backdrop
//   duo   — two tall halves

export const LAYOUTS = {
  four: {
    label: 'Four Panel',
    slots: 4,
    rects: () => [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  hero: {
    label: 'Hero + Three',
    slots: 4,
    // The three right-hand panels are short and wide: a portrait photo's face
    // cannot be panned into one, so the last slot reuses the second photo
    // (a landscape) instead of the fourth, with a closer crop.
    order: [0, 1, 2, 1],
    sceneTweaks: { 3: { zoom: 1.25, ox: 0.05 } },
    rects: () => [
      { x: 0, y: 0, w: 0.56, h: 1 },
      { x: 0.56, y: 0, w: 0.44, h: 0.34 },
      { x: 0.56, y: 0.34, w: 0.44, h: 0.33 },
      { x: 0.56, y: 0.67, w: 0.44, h: 0.33 },
    ],
  },
  full: {
    label: 'Full Bleed',
    slots: 1,
    rects: () => [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  nine: {
    label: 'Nine Panel',
    slots: 9,
    rects: () => {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3 });
        }
      }
      return out;
    },
  },
  tilt: {
    label: 'Tilted Snaps',
    slots: 3,
    polaroid: true,
    rects: () => [
      { x: 0.02, y: 0.04, w: 0.32, h: 0.72, rot: -5 },
      { x: 0.34, y: 0.13, w: 0.32, h: 0.72, rot: 2 },
      { x: 0.66, y: 0.03, w: 0.32, h: 0.72, rot: 5 },
    ],
  },
  duo: {
    label: 'Duo Split',
    slots: 2,
    rects: () => [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
};

export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Panel-area geometry for a cover of W x H: frame, title band, panel area. */
export function coverGeometry(W, H) {
  const frame = Math.max(8, Math.round(Math.min(W, H) * 0.022));
  const wide = W / H > 1.3;
  const band = Math.round(H * (wide ? 0.21 : 0.17));
  const area = { x: frame, y: frame, w: W - frame * 2, h: H - band - frame };
  return { frame, band, area, wide };
}

/** Pixel rectangles for a layout's slots, given the cover size. */
export function layoutRects(W, H, layoutId) {
  const { area } = coverGeometry(W, H);
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.four;
  return layout.rects().map((r) => ({
    x: area.x + r.x * area.w,
    y: area.y + r.y * area.h,
    w: r.w * area.w,
    h: r.h * area.h,
    rot: r.rot ?? 0,
  }));
}
