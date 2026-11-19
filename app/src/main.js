// Neon Vice Cover Studio: wires the editor. Pick photos, choose a layout and
// a sunset / neon grade, write the title, drag any panel to crop and position
// its photo, then export the cover as a PNG in the common post sizes.
//
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js):
// ?shot=cover paints the cover alone at the viewport size, ?shot=editor the
// editor with a sample scene. window.__shotReady is set once it is painted.

import { drawCover } from './cover.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS, layoutRects } from './layouts.js';
import { runShot } from './shots.js';

// Sample photos shipped with the app: three made for this entry with an image
// model, two from the make.fun kit (free to use). Uploads join them at runtime.
const SAMPLES = [
  { file: 'woman.jpg', label: 'Convertible' },
  { file: 'rooftop.jpg', label: 'Rooftop' },
  { file: 'neon.jpg', label: 'Neon Street' },
  { file: 'boulevard.jpg', label: 'Boulevard' },
  { file: 'pier.jpg', label: 'Pier' },
];

const EXPORT_SIZES = [
  { id: 'square', label: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 x 1080', w: 1920, h: 1080 },
];

const PREVIEW_SIZES = {
  square: { w: 960, h: 960 },
  portrait: { w: 864, h: 1080 },
  wide: { w: 1280, h: 720 },
};

const STORE_KEY = 'neon-vice-cover-v1';

const canvas = document.getElementById('coverCanvas');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');

// Nine panel slots; a layout uses its first N. Photo indices cycle through
// the samples with a little zoom and offset variety so faces stay in frame.
function defaultPanels() {
  const photos = [0, 1, 2, 3, 4, 0, 1, 2, 3];
  // Faces sit in the upper half of the sample photos, so the slots default to
  // a slightly upward crop (positive oy shows the photo's upper part).
  const zooms = [1.12, 1.08, 1.1, 1.12, 1.08, 1.15, 1.1, 1.15, 1.1];
  const oxs = [0, -0.02, 0.02, 0, 0, 0.02, -0.02, 0, 0.01];
  const oys = [-0.02, 0.16, 0.12, 0.14, 0.14, 0.06, 0.1, 0.08, 0.14];
  return photos.map((photo, i) => ({ photo, zoom: zooms[i], ox: oxs[i], oy: oys[i] }));
}

function defaultState() {
  return {
    layout: 'four',
    grade: 'sunset',
    title: 'NEON VICE',
    subtitle: 'sunset heist',
    titleStyle: 'gradient',
    stars: 4,
    grain: true,
    vignette: true,
    halftone: true,
    badge: true,
    size: 'square',
    panels: defaultPanels(),
  };
}

let state = defaultState();
let photos = []; // HTMLImageElement list: samples first, then uploads
let photoNames = [];
let selectedSlot = 0;
let fontsReady = false;

const undoStack = [];
const redoStack = [];

function snapshot() {
  const { photos: _p, ...rest } = state;
  return JSON.stringify(rest);
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 50) undoStack.shift();
  redoStack.length = 0;
  syncUndoButtons();
}

function applySnapshot(json) {
  const saved = JSON.parse(json);
  state = { ...defaultState(), ...saved };
  sizePreviewCanvas();
  syncControls();
  redraw();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  syncUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  document.getElementById('undoBtn').disabled = !undoStack.length;
  document.getElementById('redoBtn').disabled = !redoStack.length;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamplePhotos() {
  photos = [];
  photoNames = [];
  for (const s of SAMPLES) {
    photos.push(await loadImage(`samples/${s.file}`));
    photoNames.push(s.label);
  }
  buildPhotoStrip();
}

/** The preview canvas, at the current size mode's pixel size. */
function sizePreviewCanvas() {
  const size = PREVIEW_SIZES[state.size] ?? PREVIEW_SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
}

function redraw() {
  drawCover(canvas, { ...state, photos });
  if (!shotMode) drawSelection();
}

/** Dashed outline + slot number on the selected panel (editor only). */
function drawSelection() {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const rects = layoutRects(canvas.width, canvas.height, state.layout);
  const slot = rects[selectedSlot];
  if (!slot) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setLineDash([10, 6]);
  ctx.lineWidth = 3 * Math.max(scaleX, scaleY);
  ctx.strokeStyle = '#ff2e88';
  ctx.strokeRect(slot.x + 2, slot.y + 2, slot.w - 4, slot.h - 4);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff2e88';
  const badgeR = 16 * Math.max(scaleX, scaleY);
  ctx.beginPath();
  ctx.arc(slot.x + badgeR + 6, slot.y + badgeR + 6, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(badgeR)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(selectedSlot + 1), slot.x + badgeR + 6, slot.y + badgeR + 7);
  ctx.restore();
}

/** Panel slot under a pointer event on the preview canvas, or -1. */
function slotAtEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const rects = layoutRects(canvas.width, canvas.height, state.layout);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function saveState() {
  if (shotMode) return;
  try {
    localStorage.setItem(STORE_KEY, snapshot());
  } catch {
    // Private mode or full storage: the cover still works, it just forgets.
  }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    state = { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    // A stale or corrupt save: start from the defaults.
  }
}

// ---- photo assignment -----------------------------------------------------

function buildPhotoStrip() {
  const strip = document.getElementById('photoStrip');
  strip.innerHTML = '';
  photos.forEach((img, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = photoNames[i] ?? `Photo ${i + 1}`;
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = photoNames[i] ?? `Photo ${i + 1}`;
    button.append(thumb);
    button.addEventListener('click', () => assignPhotoToPanel(i));
    strip.append(button);
  });
  markActiveThumb();
}

function markActiveThumb() {
  const panel = state.panels[selectedSlot];
  document.querySelectorAll('#photoStrip .thumb').forEach((el, i) => {
    el.classList.toggle('active', !!panel && panel.photo === i);
  });
}

/** Puts photo `i` into the selected panel. */
function assignPhotoToPanel(i) {
  pushHistory();
  state.panels[selectedSlot].photo = i;
  state.panels[selectedSlot].zoom = 1.15;
  state.panels[selectedSlot].ox = 0;
  state.panels[selectedSlot].oy = 0;
  markActiveThumb();
  redraw();
  saveState();
}

/** Cycles the selected panel to the next photo. */
function cyclePanelPhoto() {
  pushHistory();
  const panel = state.panels[selectedSlot];
  panel.photo = (panel.photo + 1) % photos.length;
  panel.zoom = 1.15;
  panel.ox = 0;
  panel.oy = 0;
  markActiveThumb();
  redraw();
  saveState();
}

/** Shuffles every visible panel to a random photo. */
function shufflePanels() {
  pushHistory();
  const layout = LAYOUTS[state.layout];
  for (let i = 0; i < layout.slots; i++) {
    state.panels[i].photo = Math.floor(Math.random() * photos.length);
  }
  markActiveThumb();
  redraw();
  saveState();
  setStatus('Panels shuffled — drag any panel to reposition its photo.');
}

// ---- export ---------------------------------------------------------------

/** Renders the cover at W x H on an offscreen canvas and downloads the PNG. */
async function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, { ...state, photos });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-vice-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  setStatus(`Saved neon-vice-cover-${size.w}x${size.h}.png`);
}

async function exportAllSizes() {
  for (const size of EXPORT_SIZES) {
    await exportCover(size);
    await new Promise((r) => setTimeout(r, 300));
  }
}

// ---- controls -------------------------------------------------------------

function buildControlButtons() {
  const layoutBox = document.getElementById('layoutBtns');
  for (const id of LAYOUT_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.layout = id;
    b.textContent = LAYOUTS[id].label;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = id;
      selectedSlot = 0;
      syncControls();
      redraw();
      saveState();
    });
    layoutBox.append(b);
  }
  const gradeBox = document.getElementById('gradeBtns');
  for (const id of GRADE_IDS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.grade = id;
    b.textContent = GRADES[id].label;
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = id;
      syncControls();
      redraw();
      saveState();
    });
    gradeBox.append(b);
  }
  const sizeBox = document.getElementById('sizeBtns');
  for (const size of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.size = size.id;
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.size = size.id;
      sizePreviewCanvas();
      syncControls();
      redraw();
      saveState();
    });
    sizeBox.append(b);
  }
}

function syncControls() {
  document.querySelectorAll('#layoutBtns .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeBtns .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeBtns .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('titleStyleSelect').value = state.titleStyle;
  document.getElementById('starsSelect').value = String(state.stars);
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  document.getElementById('halftoneToggle').checked = state.halftone;
  document.getElementById('badgeToggle').checked = state.badge;
  markActiveThumb();
}

function wireControls() {
  document.getElementById('photoUpload').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      photos.push(img);
      photoNames.push(file.name.replace(/\.[^.]+$/, ''));
    }
    buildPhotoStrip();
    assignPhotoToPanel(photos.length - 1);
    setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} added — click a panel, then a photo, to place it.`);
    e.target.value = '';
  });
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    redraw();
    saveState();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    redraw();
    saveState();
  });
  document.getElementById('titleStyleSelect').addEventListener('change', (e) => {
    pushHistory();
    state.titleStyle = e.target.value;
    redraw();
    saveState();
  });
  document.getElementById('starsSelect').addEventListener('change', (e) => {
    pushHistory();
    state.stars = Number(e.target.value);
    redraw();
    saveState();
  });
  for (const [id, key] of [['grainToggle', 'grain'], ['vignetteToggle', 'vignette'], ['halftoneToggle', 'halftone'], ['badgeToggle', 'badge']]) {
    document.getElementById(id).addEventListener('change', (e) => {
      pushHistory();
      state[key] = e.target.checked;
      redraw();
      saveState();
    });
  }
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('shuffleBtn').addEventListener('click', shufflePanels);
  document.getElementById('cycleBtn').addEventListener('click', cyclePanelPhoto);
  document.getElementById('resetBtn').addEventListener('click', () => {
    pushHistory();
    state = defaultState();
    sizePreviewCanvas();
    syncControls();
    redraw();
    saveState();
    setStatus('Back to the default cover.');
  });
  document.getElementById('exportSquare').addEventListener('click', () => exportCover(EXPORT_SIZES[0]));
  document.getElementById('exportPortrait').addEventListener('click', () => exportCover(EXPORT_SIZES[1]));
  document.getElementById('exportWide').addEventListener('click', () => exportCover(EXPORT_SIZES[2]));
  document.getElementById('exportAll').addEventListener('click', exportAllSizes);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });

  // Drag a panel to crop and position its photo; wheel zooms; double-click
  // cycles the photo. Pointer coordinates map onto the canvas pixels.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const slot = slotAtEvent(e);
    if (slot < 0) return;
    selectedSlot = slot;
    markActiveThumb();
    redraw();
    const panel = state.panels[slot];
    drag = { slot, startX: e.clientX, startY: e.clientY, ox: panel.ox, oy: panel.oy, moved: false, before: snapshot() };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const rects = layoutRects(canvas.width, canvas.height, state.layout);
    const r = rects[drag.slot];
    if (!r) return;
    const dx = ((e.clientX - drag.startX) / rect.width) * canvas.width;
    const dy = ((e.clientY - drag.startY) / rect.height) * canvas.height;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    const panel = state.panels[drag.slot];
    panel.ox = Math.max(-0.5, Math.min(0.5, drag.ox + dx / r.w));
    panel.oy = Math.max(-0.5, Math.min(0.5, drag.oy + dy / r.h));
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag?.moved) {
      // Undo returns to the state from before the drag started.
      undoStack.push(drag.before);
      if (undoStack.length > 50) undoStack.shift();
      redoStack.length = 0;
      syncUndoButtons();
      saveState();
    }
    drag = null;
  });
  let wheelHistoryAt = 0;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selectedSlot];
    if (!panel) return;
    // One undo step per wheel gesture, not one per tick.
    if (Date.now() - wheelHistoryAt > 800) {
      pushHistory();
      wheelHistoryAt = Date.now();
    }
    panel.zoom = Math.max(0.8, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    redraw();
    saveState();
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => {
    if (slotAtEvent(e) >= 0) cyclePanelPhoto();
  });
}

// ---- fonts ----------------------------------------------------------------

async function loadFonts() {
  try {
    const anton = new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)');
    const pacifico = new FontFace('Pacifico', 'url(./fonts/Pacifico-Regular.ttf)');
    const [a, p] = await Promise.all([anton.load(), pacifico.load()]);
    document.fonts.add(a);
    document.fonts.add(p);
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('100px Pacifico')]);
  } catch {
    // The vendored fonts failed: the cover still draws with fallback fonts.
  }
  fontsReady = true;
}

// ---- shot scenes ----------------------------------------------------------

/** Applies a ?shot= scene: layout, grade, words and a photo order. */
async function applyScene(scene, shot) {
  state.layout = LAYOUTS[scene.layout] ? scene.layout : 'four';
  state.grade = GRADES[scene.grade] ? scene.grade : 'sunset';
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  state.titleStyle = scene.titleStyle;
  state.stars = scene.stars;
  state.grain = scene.grain;
  state.vignette = scene.vignette;
  state.halftone = scene.halftone;
  state.badge = scene.badge;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.four;
  const order = scene.photos.map((name) => {
    const i = SAMPLES.findIndex((s) => s.file.startsWith(name));
    return i < 0 ? 0 : i;
  });
  state.panels = defaultPanels().map((panel, i) => {
    const pick = layout.order?.[i] ?? i;
    return {
      ...panel,
      photo: order[pick % order.length],
      ...(layout.sceneTweaks?.[i] ?? {}),
    };
  });
  if (shot === 'cover') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  if (!fontsReady) await loadFonts();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

// ---- boot -----------------------------------------------------------------

async function boot() {
  if (!shotMode) loadSavedState();
  buildControlButtons();
  wireControls();
  syncControls();
  sizePreviewCanvas();
  await loadSamplePhotos();
  const fonts = loadFonts().then(() => redraw());
  redraw();
  if (shotMode) {
    runShot(shotMode, params, { applyScene });
  } else {
    await fonts;
    setStatus('Pick a photo, a layout and a grade — drag any panel to crop it, then export.');
  }
}

boot();
