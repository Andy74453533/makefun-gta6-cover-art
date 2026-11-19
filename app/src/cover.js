// The cover renderer for Neon Vice Cover Studio.
//
// drawCover paints one finished cover onto a canvas: the layout's photo
// panels (each cropped and positioned by its own zoom and pan), the
// chosen colour grade, a grain and vignette finish, and the title block
// in Bebas Neue with a Great Vibes script subtitle. Everything is drawn
// with the plain 2D canvas API, so the app needs no library and no
// network: the fonts are files under app/fonts/.
import { gradeById, paintGrade, paintGrain, paintVignette } from './grades.js';
import { layoutById } from './layouts.js';

export const EXPORT_SIZES = {
  cover: { w: 1920, h: 1080, label: 'Cover 1920 x 1080' },
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Story 1080 x 1350' },
};

// One photo slot: { img, zoom, panX, panY }. zoom 1 fills the panel,
// larger zooms in; panX/panY shift the crop from -1 (left/top) to 1.
function drawPanelPhoto(ctx, img, rect, slot) {
  const { x, y, w, h } = rect;
  const zoom = slot.zoom ?? 1;
  const panX = slot.panX ?? 0;
  const panY = slot.panY ?? 0;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + (panX * (dw - w)) / 2;
  const dy = y + (h - dh) / 2 + (panY * (dh - h)) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function fitFont(ctx, text, fontFamily, maxWidth, startPx) {
  let px = startPx;
  ctx.font = `${px}px ${fontFamily}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${px}px ${fontFamily}`;
  }
  return px;
}

function drawTitleBlock(ctx, w, h, title, subtitle) {
  const bandH = Math.round(h * 0.30);
  const bandY = h - bandH;
  // A dark gradient band so the lettering reads on any photo.
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, 'rgba(10, 4, 24, 0)');
  band.addColorStop(0.45, 'rgba(10, 4, 24, 0.62)');
  band.addColorStop(1, 'rgba(10, 4, 24, 0.88)');
  ctx.save();
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);

  // The setting sun: a striped disc peeking over the band.
  const sunR = Math.round(h * 0.085);
  const sunX = w - Math.round(w * 0.10);
  const sunY = bandY + Math.round(bandH * 0.28);
  const sun = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(0.55, '#ff7e5f');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 4, 24, 0.85)';
  for (let i = 0; i < 3; i++) {
    const sy = sunY + sunR * (0.1 + i * 0.28);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, Math.max(2, sunR * 0.07));
  }

  // Main title: huge Bebas Neue, sunset gradient, dark outline.
  const pad = Math.round(w * 0.045);
  const maxW = w - pad * 2 - sunR * 2;
  ctx.textBaseline = 'alphabetic';
  ctx.save();
  ctx.translate(pad, h - Math.round(h * 0.085));
  ctx.rotate(-0.02);
  const titlePx = fitFont(ctx, title, '"Bebas Neue", sans-serif', maxW, Math.round(h * 0.17));
  const grad = ctx.createLinearGradient(0, -titlePx, 0, 6);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffd166');
  grad.addColorStop(1, '#ff5e62');
  ctx.lineWidth = Math.max(3, titlePx * 0.045);
  ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
  ctx.lineJoin = 'round';
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  // Script subtitle in Great Vibes, hot pink with a soft glow.
  if (subtitle) {
    ctx.save();
    ctx.font = `${Math.round(h * 0.058)}px "Great Vibes", cursive`;
    ctx.fillStyle = '#ff7ad9';
    ctx.shadowColor = 'rgba(255, 0, 128, 0.8)';
    ctx.shadowBlur = Math.round(h * 0.012);
    ctx.fillText(subtitle, pad + Math.round(w * 0.01), h - Math.round(h * 0.028));
    ctx.restore();
  }

  // Badge ribbon, top right: the studio's own mark.
  const badge = 'NEON VICE • EST. 2026';
  ctx.save();
  ctx.font = `bold ${Math.round(h * 0.028)}px "Bebas Neue", sans-serif`;
  const bw = ctx.measureText(badge).width + Math.round(w * 0.03);
  const bh = Math.round(h * 0.052);
  const bx = w - bw - Math.round(w * 0.025);
  const by = Math.round(h * 0.03);
  ctx.fillStyle = 'rgba(10, 4, 24, 0.78)';
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(2, h * 0.003);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, bx + Math.round(w * 0.015), by + bh / 2 + 1);
  ctx.restore();
  ctx.restore();
}

// Paint the whole cover. state: { photos, layoutId, gradeId, title,
// subtitle }. photos is an array of photo slots; a layout panel with
// slot n uses photos[n] when present, else photos[0].
export function drawCover(canvas, state) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  const photos = state.photos?.length ? state.photos : [];

  ctx.save();
  ctx.fillStyle = '#0d0a14';
  ctx.fillRect(0, 0, w, h);

  const rects = layout.rects(w, h);
  const fallback = photos[0];
  for (const rect of rects) {
    const slot = photos[rect.slot] ?? fallback;
    if (!slot?.img) continue;
    // Tilted snapshots get a white polaroid frame.
    if (layout.id === 'tilt' && rect.slot > 0) {
      ctx.save();
      ctx.fillStyle = '#fdfdf8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = Math.round(w * 0.012);
      ctx.shadowOffsetY = Math.round(h * 0.01);
      const frame = Math.round(w * 0.008);
      ctx.fillRect(rect.x - frame, rect.y - frame, rect.w + frame * 2, rect.h + frame * 2);
      ctx.restore();
    }
    drawPanelPhoto(ctx, slot.img, rect, slot);
  }

  paintGrade(ctx, w, h, grade);
  paintVignette(ctx, w, h, grade.vignette);
  paintGrain(ctx, w, h, Math.round((w * h) / 2300));
  drawTitleBlock(ctx, w, h, (state.title || 'NEON VICE').toUpperCase(), state.subtitle || '');
  ctx.restore();
  return canvas;
}
