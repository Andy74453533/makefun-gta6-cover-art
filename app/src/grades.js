// Colour grades for Neon Vice Cover Studio.
//
// Each grade describes a look the cover engine paints over the photos:
// a warm wash, a coloured gradient overlay and a vignette strength.
// The engine in cover.js applies them with canvas composite operations,
// so no grade ever touches the original photo files.
export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    blurb: 'Vice City golden hour: warm orange wash, pink sky glow.',
    wash: 'rgba(255, 122, 26, 0.16)',
    top: 'rgba(255, 94, 98, 0.20)',
    bottom: 'rgba(255, 170, 0, 0.22)',
    blend: 'overlay',
    vignette: 0.32,
    saturate: 1.25,
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    blurb: 'Hot pink and electric teal, wet-street night glow.',
    wash: 'rgba(255, 0, 128, 0.14)',
    top: 'rgba(255, 0, 110, 0.24)',
    bottom: 'rgba(0, 229, 255, 0.26)',
    blend: 'overlay',
    vignette: 0.38,
    saturate: 1.35,
  },
  {
    id: 'vice',
    name: 'Vice Fade',
    blurb: 'Pink-to-purple dusk fade with a cool teal shadow.',
    wash: 'rgba(180, 60, 255, 0.12)',
    top: 'rgba(255, 110, 199, 0.22)',
    bottom: 'rgba(20, 160, 200, 0.24)',
    blend: 'soft-light',
    vignette: 0.30,
    saturate: 1.2,
  },
  {
    id: 'gold',
    name: 'Gold Rush',
    blurb: 'Rich amber light, deep shadows, postcard warmth.',
    wash: 'rgba(255, 176, 32, 0.18)',
    top: 'rgba(255, 200, 90, 0.20)',
    bottom: 'rgba(120, 40, 0, 0.26)',
    blend: 'overlay',
    vignette: 0.34,
    saturate: 1.15,
  },
  {
    id: 'noir',
    name: 'Noir',
    blurb: 'Desaturated night: cold steel, one hot highlight.',
    wash: 'rgba(40, 60, 90, 0.20)',
    top: 'rgba(10, 14, 30, 0.30)',
    bottom: 'rgba(255, 80, 120, 0.12)',
    blend: 'overlay',
    vignette: 0.45,
    saturate: 0.55,
  },
  {
    id: 'clean',
    name: 'Clean',
    blurb: 'No grade at all: the photo exactly as shot.',
    wash: 'rgba(0, 0, 0, 0)',
    top: 'rgba(0, 0, 0, 0)',
    bottom: 'rgba(0, 0, 0, 0)',
    blend: 'source-over',
    vignette: 0.12,
    saturate: 1.0,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Paint a grade over a rectangle that already holds the photo panels.
// ctx is the 2d context of the cover canvas, already translated so that
// (0, 0) is the cover's top-left corner.
export function paintGrade(ctx, w, h, grade) {
  if (grade.saturate !== 1) {
    ctx.save();
    ctx.filter = `saturate(${grade.saturate})`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.top);
  sky.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Darken the corners so the title lettering and the panels pop.
export function paintVignette(ctx, w, h, strength) {
  if (strength <= 0) return;
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// A sprinkle of film grain: deterministic, seeded by x/y so two builds
// of the same cover produce the same pixels.
export function paintGrain(ctx, w, h, amount = 900) {
  let seed = 1337;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.save();
  for (let i = 0; i < amount; i++) {
    const x = next() * w;
    const y = next() * h;
    const v = next() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.05)`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  ctx.restore();
}
