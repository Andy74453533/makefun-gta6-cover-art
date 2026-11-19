// The cover engine: draws a GTA-style multi-panel poster onto any 2D canvas.
//
// drawCover(canvas, state) paints, in order: the white poster frame, the
// panel area (one photo per panel, each cropped and positioned by its panel
// slot and graded with the chosen sunset / neon grade), the title band with
// its bold Anton title and Pacifico script subtitle, an optional badge
// ribbon, then grain and a vignette. The same function renders the editor
// preview and every export size, so what you see is what the PNG holds.
//
// state:
//   layout, grade, title, subtitle, titleStyle ('gradient' | 'ink' | 'neon'),
//   grain, vignette, halftone, badge, stars (0..5),
//   photos: [Image, ...], panels: [{ photo, zoom, ox, oy }, ...] (9 slots)

import { GRADES } from './grades.js';
import { LAYOUTS, coverGeometry, layoutRects } from './layouts.js';

let noisePattern = null;
let dotPattern = null;

function makeNoisePattern(ctx) {
  if (noisePattern) return noisePattern;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const nctx = c.getContext('2d');
  const img = nctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  noisePattern = ctx.createPattern(c, 'repeat');
  return noisePattern;
}

function makeDotPattern(ctx) {
  if (dotPattern) return dotPattern;
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const dctx = c.getContext('2d');
  dctx.fillStyle = 'rgba(255,46,136,0.13)';
  dctx.beginPath();
  dctx.arc(8, 8, 2.4, 0, Math.PI * 2);
  dctx.fill();
  dotPattern = ctx.createPattern(c, 'repeat');
  return dotPattern;
}

/** Draws one photo cover-fit into rect, panned / zoomed by its panel slot. */
function drawPhotoInRect(ctx, img, rect, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const s = base * panel.zoom;
  const pw = img.naturalWidth * s;
  const ph = img.naturalHeight * s;
  const cx0 = x + w / 2 + panel.ox * w;
  const cy0 = y + h / 2 + panel.oy * h;
  // Clamp the pan so the photo always covers the panel: no backdrop gaps.
  const cx = pw >= w ? Math.max(x + w - pw / 2, Math.min(x + pw / 2, cx0)) : x + w / 2;
  const cy = ph >= h ? Math.max(y + h - ph / 2, Math.min(y + ph / 2, cy0)) : y + h / 2;
  ctx.filter = grade.filter;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.filter = 'none';
  drawGradeOverlays(ctx, rect, grade);
  ctx.restore();
  ctx.strokeStyle = 'rgba(10,6,16,0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawGradeOverlays(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  for (const ov of grade.overlays) {
    let g;
    if (ov.kind === 'linear') {
      g = ctx.createLinearGradient(x + ov.from[0] * w, y + ov.from[1] * h, x + ov.to[0] * w, y + ov.to[1] * h);
    } else {
      const r = ov.r * Math.max(w, h);
      g = ctx.createRadialGradient(x + ov.at[0] * w, y + ov.at[1] * h, 0, x + ov.at[0] * w, y + ov.at[1] * h, r);
    }
    for (const [stop, color] of ov.stops) g.addColorStop(stop, color);
    ctx.save();
    ctx.globalCompositeOperation = ov.blend;
    ctx.globalAlpha = ov.alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

/** A tilted snapshot print: white polaroid border, shadow, then the photo. */
function drawPolaroid(ctx, img, rect, panel, grade) {
  const pad = Math.min(rect.w, rect.h) * 0.045;
  const lip = rect.h * 0.13;
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.rot * Math.PI) / 180);
  ctx.shadowColor = 'rgba(10,6,16,0.45)';
  ctx.shadowBlur = Math.min(rect.w, rect.h) * 0.06;
  ctx.shadowOffsetY = Math.min(rect.w, rect.h) * 0.02;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-rect.w / 2 - pad, -rect.h / 2 - pad, rect.w + pad * 2, rect.h + pad + lip);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
  // Photo drawn unrotated-clip inside the rotated frame: re-apply the rotation
  // around the same centre and clip to the photo rect.
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.rot * Math.PI) / 180);
  ctx.beginPath();
  ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.clip();
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const s = base * panel.zoom;
  const pw = img.naturalWidth * s;
  const ph = img.naturalHeight * s;
  // Clamp the pan (local coords, relative to the rect centre) so the photo
  // always covers the print: no white gaps inside the polaroid.
  let lx = panel.ox * rect.w;
  let ly = panel.oy * rect.h;
  lx = pw >= rect.w ? Math.max(-(pw - rect.w) / 2, Math.min((pw - rect.w) / 2, lx)) : 0;
  ly = ph >= rect.h ? Math.max(-(ph - rect.h) / 2, Math.min((ph - rect.h) / 2, ly)) : 0;
  ctx.filter = grade.filter;
  ctx.drawImage(img, lx - pw / 2, ly - ph / 2, pw, ph);
  ctx.filter = 'none';
  drawGradeOverlays(ctx, { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h }, grade);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  const prefix = weight ? `${weight} ` : '';
  ctx.font = `${prefix}${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${prefix}${size}px ${family}`;
  }
  return size;
}

function drawTitleBand(ctx, W, H, geom, state) {
  const { frame, band, area } = geom;
  const bandTop = area.y + area.h;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(frame, bandTop, W - frame * 2, band);
  if (state.halftone) {
    ctx.fillStyle = makeDotPattern(ctx);
    ctx.fillRect(frame, bandTop, W - frame * 2, band);
  }
  // Sunset rule separating the panels from the band.
  const rule = ctx.createLinearGradient(frame, 0, W - frame, 0);
  rule.addColorStop(0, '#ff7a18');
  rule.addColorStop(0.5, '#ff2e88');
  rule.addColorStop(1, '#7b2ff7');
  ctx.fillStyle = rule;
  ctx.fillRect(frame, bandTop, W - frame * 2, Math.max(3, band * 0.03));

  const title = (state.title || 'NEON VICE').trim().toUpperCase() || 'NEON VICE';
  const titleSize = fitFont(ctx, title, W * 0.86, Math.round(band * 0.52), 'Anton, sans-serif');
  const titleY = bandTop + band * 0.48;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (state.titleStyle === 'gradient') {
    const g = ctx.createLinearGradient(0, titleY - titleSize, 0, titleY + titleSize * 0.15);
    g.addColorStop(0, '#ff7a18');
    g.addColorStop(0.5, '#ff2e88');
    g.addColorStop(1, '#7b2ff7');
    ctx.fillStyle = g;
  } else if (state.titleStyle === 'neon') {
    ctx.fillStyle = '#ff2e88';
  } else {
    ctx.fillStyle = '#16101d';
  }
  ctx.shadowColor = 'rgba(20,8,24,0.18)';
  ctx.shadowBlur = titleSize * 0.06;
  ctx.shadowOffsetY = titleSize * 0.02;
  ctx.fillText(title, W / 2, titleY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const subtitle = (state.subtitle || '').trim();
  if (subtitle) {
    const subSize = Math.round(band * 0.21);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = '#ff2e88';
    ctx.shadowColor = 'rgba(255,46,136,0.55)';
    ctx.shadowBlur = subSize * 0.35;
    ctx.fillText(subtitle, W / 2, bandTop + band * 0.78);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  const stars = '★'.repeat(state.stars) + '☆'.repeat(Math.max(0, 5 - state.stars));
  const microSize = Math.max(10, Math.round(band * 0.085));
  ctx.font = `${microSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#6d6474';
  ctx.fillText(`${stars}   ·   NEON COAST   ·   EST. 2026`, W / 2, bandTop + band - Math.max(8, band * 0.1));
}

function drawBadge(ctx, W, geom, state) {
  if (!state.badge) return;
  const label = `★ ${state.stars}.5  HOT`;
  const size = Math.max(11, Math.round(Math.min(W, 1080) * 0.016));
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const padX = size * 0.9;
  const pillW = ctx.measureText(label).width + padX * 2;
  const pillH = size * 2.1;
  const x = W - geom.frame - pillW - Math.max(8, geom.frame * 0.4);
  const y = geom.frame + Math.max(8, geom.frame * 0.4);
  ctx.save();
  ctx.shadowColor = 'rgba(10,6,16,0.35)';
  ctx.shadowBlur = size * 0.5;
  ctx.shadowOffsetY = size * 0.12;
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + pillW / 2, y + pillH / 2 + 1);
}

/** Renders the whole cover onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.four;
  const geom = coverGeometry(W, H);
  const { frame, area } = geom;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Panel-area backdrop: deep dusk gradient (shows through the gutters and
  // behind the tilted snapshots).
  const bg = ctx.createLinearGradient(area.x, area.y, area.x + area.w, area.y + area.h);
  bg.addColorStop(0, '#2b103f');
  bg.addColorStop(0.55, '#7a1e5e');
  bg.addColorStop(1, '#ff7a18');
  ctx.fillStyle = bg;
  ctx.fillRect(area.x, area.y, area.w, area.h);

  const rects = layoutRects(W, H, state.layout);
  const gutter = Math.max(3, Math.round(Math.min(W, H) * 0.008));
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[panel.photo % Math.max(1, state.photos.length)];
    if (!img) return;
    const inset = layout.polaroid
      ? rect
      : { x: rect.x + gutter / 2, y: rect.y + gutter / 2, w: rect.w - gutter, h: rect.h - gutter, rot: 0 };
    if (layout.polaroid) drawPolaroid(ctx, img, inset, panel, grade);
    else drawPhotoInRect(ctx, img, inset, panel, grade);
  });

  drawTitleBand(ctx, W, H, geom, state);
  drawBadge(ctx, W, geom, state);

  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = makeNoisePattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.45,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    v.addColorStop(0, 'rgba(20,8,24,0)');
    v.addColorStop(1, 'rgba(20,8,24,0.30)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  // Thin keyline around the poster.
  ctx.strokeStyle = 'rgba(10,6,16,0.35)';
  ctx.lineWidth = Math.max(1, frame * 0.12);
  ctx.strokeRect(frame / 2, frame / 2, W - frame, H - frame);
}
