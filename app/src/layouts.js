// Multi-panel layouts for Neon Vice Cover Studio.
//
// A layout is a function of the cover size (w, h) that returns the panel
// rectangles, in draw order, as fractions of the cover. Each panel also
// names which photo slot fills it: slot 0 is the main photo, slots 1..3
// are the extra photos the user picks per panel. The gutter is drawn as
// the cover's own frame colour, so panels read as a poster grid.
export const LAYOUTS = [
  {
    id: 'hero',
    name: 'Hero',
    blurb: 'One photo, full bleed, title across the bottom.',
    panels: 1,
    rects(w, h) {
      return [{ x: 0, y: 0, w, h, slot: 0 }];
    },
  },
  {
    id: 'hero3',
    name: 'Hero + 3',
    blurb: 'A big hero panel with three stacked panels beside it.',
    panels: 4,
    rects(w, h) {
      const g = Math.round(w * 0.008);
      const side = Math.round(w * 0.34);
      const heroW = w - side - g;
      const third = Math.round((h - 2 * g) / 3);
      return [
        { x: 0, y: 0, w: heroW, h, slot: 0 },
        { x: heroW + g, y: 0, w: side, h: third, slot: 1 },
        { x: heroW + g, y: third + g, w: side, h: third, slot: 2 },
        { x: heroW + g, y: 2 * (third + g), w: side, h: h - 2 * (third + g), slot: 3 },
      ];
    },
  },
  {
    id: 'grid',
    name: 'Grid 2 x 2',
    blurb: 'Four equal panels: one photo four ways, or four photos.',
    panels: 4,
    rects(w, h) {
      const g = Math.round(w * 0.008);
      const cw = Math.round((w - g) / 2);
      const ch = Math.round((h - g) / 2);
      return [
        { x: 0, y: 0, w: cw, h: ch, slot: 0 },
        { x: cw + g, y: 0, w: w - cw - g, h: ch, slot: 1 },
        { x: 0, y: ch + g, w: cw, h: h - ch - g, slot: 2 },
        { x: cw + g, y: ch + g, w: w - cw - g, h: h - ch - g, slot: 3 },
      ];
    },
  },
  {
    id: 'duo',
    name: 'Duo Split',
    blurb: 'Two tall panels side by side, a face-off poster.',
    panels: 2,
    rects(w, h) {
      const g = Math.round(w * 0.008);
      const cw = Math.round((w - g) / 2);
      return [
        { x: 0, y: 0, w: cw, h, slot: 0 },
        { x: cw + g, y: 0, w: w - cw - g, h, slot: 1 },
      ];
    },
  },
  {
    id: 'strip',
    name: 'Film Strip',
    blurb: 'Three upright frames in a row, like a contact sheet.',
    panels: 3,
    rects(w, h) {
      const g = Math.round(w * 0.01);
      const cw = Math.round((w - 2 * g) / 3);
      return [
        { x: 0, y: 0, w: cw, h, slot: 0 },
        { x: cw + g, y: 0, w: cw, h, slot: 1 },
        { x: 2 * (cw + g), y: 0, w: w - 2 * (cw + g), h, slot: 2 },
      ];
    },
  },
  {
    id: 'tilt',
    name: 'Tilted Stack',
    blurb: 'A hero shot with two overlapping snapshots on top.',
    panels: 3,
    rects(w, h) {
      const snapW = Math.round(w * 0.30);
      const snapH = Math.round(h * 0.42);
      return [
        { x: 0, y: 0, w, h, slot: 0 },
        { x: Math.round(w * 0.06), y: Math.round(h * 0.08), w: snapW, h: snapH, slot: 1 },
        { x: Math.round(w * 0.62), y: Math.round(h * 0.48), w: snapW, h: snapH, slot: 2 },
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// How many distinct photo slots a layout needs at most.
export function layoutSlotCount(layout) {
  return Math.max(...layout.rects(100, 100).map((p) => p.slot)) + 1;
}
