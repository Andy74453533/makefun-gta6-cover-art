// Neon Vice Cover Studio: editor wiring.
//
// Loads the sample photos (or the user's own upload), keeps the cover
// state (layout, grade, title, per-panel crop), repaints the live
// preview on every change, and exports a PNG at the chosen post size.
// In ?shot= mode the same code renders a screenshot scene instead of
// the editor (see shots.js).
import { drawCover, EXPORT_SIZES } from './cover.js';
import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { drawShotStage, parseShot } from './shots.js';

const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard' },
  { id: 'pier', label: 'Pier' },
  { id: 'neon', label: 'Neon Street' },
  { id: 'rooftop', label: 'Rooftop' },
  { id: 'woman', label: 'Convertible' },
];

const state = {
  photos: [],
  layoutId: 'hero3',
  gradeId: 'sunset',
  title: 'NEON VICE',
  subtitle: 'sunset heist',
  exportKey: 'cover',
  activeSlot: 0,
};

const $ = (sel) => document.querySelector(sel);
const preview = $('#preview');
const stage = $('#stage');
const statusEl = $('#status');

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadSample(id) {
  const img = await loadImage(`./samples/${id}.jpg`);
  return { img, name: id, zoom: 1, panX: 0, panY: 0 };
}

function currentPhotos() {
  return state.photos.filter(Boolean);
}

function renderPreview() {
  if (!preview) return;
  preview.width = 1280;
  preview.height = 720;
  drawCover(preview, {
    photos: currentPhotos(),
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    title: state.title,
    subtitle: state.subtitle,
  });
}

function renderExport() {
  const size = EXPORT_SIZES[state.exportKey];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, {
    photos: currentPhotos(),
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    title: state.title,
    subtitle: state.subtitle,
  });
  return canvas;
}

function syncControlStates() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layoutId);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.gradeId);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.exportKey);
  });
  document.querySelectorAll('[data-slot]').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.slot) === state.activeSlot);
  });
  const slot = state.photos[state.activeSlot];
  const zoom = $('#zoom');
  const panX = $('#panx');
  const panY = $('#pany');
  if (zoom) zoom.value = slot ? slot.zoom : 1;
  if (panX) panX.value = slot ? slot.panX : 0;
  if (panY) panY.value = slot ? slot.panY : 0;
  const grade = gradeById(state.gradeId);
  const blurb = $('#grade-blurb');
  if (blurb) blurb.textContent = grade.blurb;
  const layout = layoutById(state.layoutId);
  const layoutBlurb = $('#layout-blurb');
  if (layoutBlurb) layoutBlurb.textContent = `${layout.blurb} (${layout.panels} panel${layout.panels > 1 ? 's' : ''})`;
}

function repaint() {
  renderPreview();
  syncControlStates();
}

function buildButtons() {
  const layoutBox = $('#layouts');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.layout = l.id;
    b.textContent = l.name;
    b.title = l.blurb;
    b.addEventListener('click', () => {
      state.layoutId = l.id;
      repaint();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('#grades');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = g.id;
    b.textContent = g.name;
    b.title = g.blurb;
    b.addEventListener('click', () => {
      state.gradeId = g.id;
      repaint();
    });
    gradeBox.appendChild(b);
  });
  const sizeBox = $('#sizes');
  Object.entries(EXPORT_SIZES).forEach(([key, size]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.size = key;
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.exportKey = key;
      repaint();
    });
    sizeBox.appendChild(b);
  });
  const slotBox = $('#slots');
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.slot = String(i);
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => {
      state.activeSlot = i;
      repaint();
    });
    slotBox.appendChild(b);
  }
  const sampleBox = $('#samples');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample';
    b.dataset.sample = s.id;
    const img = document.createElement('img');
    img.src = `./samples/${s.id}.jpg`;
    img.alt = s.label;
    const span = document.createElement('span');
    span.textContent = s.label;
    b.append(img, span);
    b.addEventListener('click', async () => {
      try {
        state.photos[state.activeSlot] = await loadSample(s.id);
        setStatus(`${s.label} loaded into panel ${state.activeSlot + 1}.`);
        repaint();
      } catch {
        setStatus(`Could not load the ${s.label} sample.`);
      }
    });
    sampleBox.appendChild(b);
  });
}

function wireInputs() {
  const title = $('#title');
  const subtitle = $('#subtitle');
  title.addEventListener('input', () => {
    state.title = title.value || 'NEON VICE';
    repaint();
  });
  subtitle.addEventListener('input', () => {
    state.subtitle = subtitle.value;
    repaint();
  });
  $('#zoom').addEventListener('input', (e) => {
    const slot = state.photos[state.activeSlot];
    if (slot) {
      slot.zoom = Number(e.target.value);
      repaint();
    }
  });
  $('#panx').addEventListener('input', (e) => {
    const slot = state.photos[state.activeSlot];
    if (slot) {
      slot.panX = Number(e.target.value);
      repaint();
    }
  });
  $('#pany').addEventListener('input', (e) => {
    const slot = state.photos[state.activeSlot];
    if (slot) {
      slot.panY = Number(e.target.value);
      repaint();
    }
  });
  $('#upload').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.photos[state.activeSlot] = { img, name: file.name, zoom: 1, panX: 0, panY: 0 };
      setStatus(`${file.name} loaded into panel ${state.activeSlot + 1}.`);
      repaint();
    } catch {
      setStatus('That file could not be read as a photo.');
    }
  });
  $('#export').addEventListener('click', () => {
    const canvas = renderExport();
    const size = EXPORT_SIZES[state.exportKey];
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed: the browser could not write the PNG.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-vice-${state.exportKey}-${size.w}x${size.h}.png`;
      a.click();
      setStatus(`Exported ${size.label} PNG — check your downloads.`);
    }, 'image/png');
  });
  // Drag on the preview to reposition the photo in the panel under
  // the pointer; the panel becomes the active one.
  let dragging = false;
  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * preview.width;
    const py = ((e.clientY - rect.top) / rect.height) * preview.height;
    const layout = layoutById(state.layoutId);
    const hit = layout.rects(preview.width, preview.height)
      .findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
    if (hit >= 0) {
      state.activeSlot = layout.rects(preview.width, preview.height)[hit].slot;
      dragging = true;
      preview.setPointerCapture(e.pointerId);
      repaint();
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const slot = state.photos[state.activeSlot];
    if (!slot) return;
    slot.panX = Math.max(-1, Math.min(1, slot.panX + e.movementX / 120));
    slot.panY = Math.max(-1, Math.min(1, slot.panY + e.movementY / 120));
    repaint();
  });
  preview.addEventListener('pointerup', () => {
    dragging = false;
  });
}

async function applyShot(shot) {
  document.body.classList.add('shot');
  const first = await loadSample(shot.photo);
  state.photos = [first];
  // Fill the extra panels with the other samples so multi-panel
  // layouts show real photos, not repeats of the first.
  const rest = SAMPLES.filter((s) => s.id !== shot.photo);
  for (let i = 0; i < 3; i++) {
    state.photos.push(await loadSample(rest[i % rest.length].id));
  }
  state.layoutId = shot.layoutId;
  state.gradeId = shot.gradeId;
  state.title = shot.title;
  state.subtitle = shot.subtitle;
  await document.fonts.ready;
  if (shot.mode === 'editor') {
    document.body.classList.remove('shot');
    repaint();
  } else {
    const key = shot.mode === 'cover-square' ? 'square' : shot.mode === 'cover-portrait' ? 'portrait' : 'cover';
    state.exportKey = key;
    const coverCanvas = renderExport();
    stage.hidden = false;
    preview.hidden = true;
    drawShotStage(stage, coverCanvas, shot.mode);
  }
  window.__neonReady = true;
}

async function boot() {
  buildButtons();
  wireInputs();
  const shot = parseShot();
  try {
    if (shot) {
      await applyShot(shot);
      return;
    }
    // Default session: neon street in the hero panel, boulevard and
    // pier filling the side panels.
    state.photos = [
      await loadSample('neon'),
      await loadSample('boulevard'),
      await loadSample('pier'),
      await loadSample('woman'),
    ];
    await document.fonts.ready;
    repaint();
    setStatus('Pick a photo, a layout and a grade — then export your cover.');
    window.__neonReady = true;
  } catch (err) {
    setStatus('Something failed while loading the samples. Reload to try again.');
    console.error(err);
  }
}

boot();
