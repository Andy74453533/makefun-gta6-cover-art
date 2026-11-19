// Fixed scenes for screenshots: ?shot=cover shows the cover alone, filling
// the viewport; ?shot=editor shows the editor with a sample scene loaded.
// The query picks the layout, grade, words and photo order, so a screenshot
// is reproducible: the same URL always paints the same cover. main.js sets
// window.__shotReady once the scene is painted (fonts loaded).

/** Reads a scene out of the URL query: layout, grade, title, subtitle... */
export function sceneFromQuery(query) {
  return {
    layout: query.get('layout') ?? 'four',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('title') ?? 'NEON VICE',
    subtitle: query.get('subtitle') ?? 'sunset heist',
    titleStyle: query.get('style') ?? 'gradient',
    stars: Number(query.get('stars') ?? 4),
    grain: query.get('grain') !== '0',
    vignette: query.get('vignette') !== '0',
    halftone: query.get('halftone') !== '0',
    badge: query.get('badge') !== '0',
    photos: (query.get('photos') ?? 'woman,rooftop,neon,boulevard,pier').split(','),
  };
}

/** Enters shot mode and hands the scene to the app (see main.js applyScene). */
export function runShot(shot, query, env) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  env.applyScene(sceneFromQuery(query), shot);
}
