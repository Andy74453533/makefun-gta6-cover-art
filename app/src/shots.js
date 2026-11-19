// Screenshot scenes for Neon Vice Cover Studio.
//
// The app reads a ?shot= query when it is opened for a screenshot:
//   ?shot=cover           the exported landscape cover, full frame
//   ?shot=editor          the editor UI with a photo loaded
//   ?shot=cover-square    the exported square cover on a stage
//   ?shot=cover-portrait  the exported portrait cover on a stage
// Extra params pick the photo, layout, grade and caption, e.g.
//   ?shot=cover&photo=neon&layout=hero3&grade=sunset&title=NEON%20VICE
// main.js applies the scene, renders, then sets window.__neonReady so
// a headless browser knows the frame is finished.
export const SHOT_MODES = ['cover', 'editor', 'cover-square', 'cover-portrait'];

export function parseShot() {
  const q = new URLSearchParams(window.location.search);
  const mode = q.get('shot');
  if (!mode || !SHOT_MODES.includes(mode)) return null;
  return {
    mode,
    photo: q.get('photo') || 'neon',
    layoutId: q.get('layout') || 'hero3',
    gradeId: q.get('grade') || 'sunset',
    title: q.get('title') || 'NEON VICE',
    subtitle: q.get('subtitle') || 'sunset heist',
  };
}

// Paint a finished cover canvas onto the 1280 x 720 stage the
// screenshots are taken at. The landscape cover fills the frame; the
// square and portrait covers sit centred on a neon stage backdrop so
// the screenshot still shows the exported art at its true aspect.
export function drawShotStage(stage, coverCanvas, mode) {
  const W = 1280;
  const H = 720;
  stage.width = W;
  stage.height = H;
  const ctx = stage.getContext('2d');
  if (mode === 'cover') {
    ctx.drawImage(coverCanvas, 0, 0, W, H);
    return;
  }
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#160a2e');
  bg.addColorStop(0.5, '#2b0f3f');
  bg.addColorStop(1, '#0d0a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 46, 136, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 120 + i * 120);
    ctx.lineTo(W, 60 + i * 120);
    ctx.stroke();
  }
  ctx.restore();
  const ratio = coverCanvas.width / coverCanvas.height;
  // Leave a strip at the bottom for the export-size caption, so it
  // never overlaps the cover's own subtitle.
  let dw = 656 * ratio;
  let dh = 656;
  if (dw > W * 0.9) {
    dw = W * 0.9;
    dh = dw / ratio;
  }
  const dx = (W - dw) / 2;
  const dy = (656 - dh) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(coverCanvas, dx, dy, dw, dh);
  ctx.restore();
  ctx.save();
  ctx.font = '28px "Bebas Neue", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(
    mode === 'cover-square' ? 'SQUARE EXPORT  ·  1080 × 1080' : 'STORY EXPORT  ·  1080 × 1350',
    W / 2,
    700,
  );
  ctx.restore();
}
