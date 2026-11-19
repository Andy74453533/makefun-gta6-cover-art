// Sunset / neon colour grades for the cover engine.
//
// A grade is a canvas `filter` string applied when a photo is drawn, plus a
// list of overlays painted over the photo (clipped to its panel): each overlay
// is a linear or radial gradient with a blend mode and an alpha. The filter
// does the heavy lifting (saturation, warmth, contrast); the overlays add the
// Vice City glow: hot orange at the bottom, magenta and teal at the edges.

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.7) contrast(1.08) sepia(0.28) hue-rotate(-12deg) brightness(1.03)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], blend: 'soft-light', alpha: 0.85,
        stops: [[0, 'rgba(255,150,60,0.10)'], [0.55, 'rgba(255,90,60,0.05)'], [1, 'rgba(214,40,130,0.42)']] },
      { kind: 'radial', at: [0.5, 1.05], r: 0.9, blend: 'screen', alpha: 0.5,
        stops: [[0, 'rgba(255,120,60,0.30)'], [1, 'rgba(255,120,60,0)']] },
    ],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.9) contrast(1.16) hue-rotate(6deg) brightness(0.98)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], blend: 'overlay', alpha: 0.8,
        stops: [[0, 'rgba(255,0,128,0.26)'], [0.5, 'rgba(120,40,180,0.10)'], [1, 'rgba(0,220,200,0.24)']] },
      { kind: 'radial', at: [0.85, 0.1], r: 0.7, blend: 'screen', alpha: 0.45,
        stops: [[0, 'rgba(255,60,170,0.28)'], [1, 'rgba(255,60,170,0)']] },
    ],
  },
  gold: {
    label: 'Golden Hour',
    filter: 'sepia(0.5) saturate(1.9) contrast(1.06) brightness(1.06)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], blend: 'soft-light', alpha: 0.9,
        stops: [[0, 'rgba(255,200,90,0.22)'], [1, 'rgba(180,90,0,0.22)']] },
      { kind: 'radial', at: [0.5, 0.9], r: 0.8, blend: 'screen', alpha: 0.4,
        stops: [[0, 'rgba(255,190,90,0.26)'], [1, 'rgba(255,190,90,0)']] },
    ],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.28) brightness(1.06)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], blend: 'overlay', alpha: 0.6,
        stops: [[0, 'rgba(255,255,255,0.10)'], [1, 'rgba(0,0,0,0.22)']] },
    ],
  },
  bubble: {
    label: 'Bubblegum',
    filter: 'saturate(1.6) sepia(0.18) hue-rotate(-28deg) contrast(1.05) brightness(1.04)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], blend: 'soft-light', alpha: 0.9,
        stops: [[0, 'rgba(255,110,180,0.24)'], [1, 'rgba(255,60,140,0.30)']] },
      { kind: 'radial', at: [0.2, 0.05], r: 0.7, blend: 'screen', alpha: 0.4,
        stops: [[0, 'rgba(255,150,210,0.26)'], [1, 'rgba(255,150,210,0)']] },
    ],
  },
  teal: {
    label: 'Teal Coast',
    filter: 'saturate(1.45) contrast(1.1) hue-rotate(24deg) brightness(1.02)',
    overlays: [
      { kind: 'linear', from: [0, 0], to: [0, 1], blend: 'soft-light', alpha: 0.9,
        stops: [[0, 'rgba(0,180,180,0.20)'], [0.55, 'rgba(0,140,160,0.06)'], [1, 'rgba(255,150,80,0.14)']] },
      { kind: 'radial', at: [0.5, 1.05], r: 0.85, blend: 'screen', alpha: 0.4,
        stops: [[0, 'rgba(0,220,200,0.22)'], [1, 'rgba(0,220,200,0)']] },
    ],
  },
};

export const GRADE_IDS = Object.keys(GRADES);
