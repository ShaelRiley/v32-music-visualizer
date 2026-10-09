export function bindFullscreenIdle(doc, {idleMs = 2300} = {}) {
  let timer;
  const overlays = () => [...doc.querySelectorAll('body > :not(canvas):not(script)')];
  const priorInert = new Map();

  function reveal() {
    clearTimeout(timer);
    doc.body.classList.remove('immersed');
    for (const [element, value] of priorInert) element.inert = value;
    priorInert.clear();
    if (doc.fullscreenElement && !doc.hidden) timer = setTimeout(hide, idleMs);
  }

  function hide() {
    if (!doc.fullscreenElement || doc.hidden) return;
    doc.body.classList.add('immersed');
    for (const element of overlays()) {
      priorInert.set(element, element.inert);
      element.inert = true;
    }
  }

  const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'input',
    'fullscreenchange', 'visibilitychange'];
  for (const event of events) doc.addEventListener(event, reveal, true);
  reveal();
  return () => {
    clearTimeout(timer);
    for (const event of events) doc.removeEventListener(event, reveal, true);
    doc.body.classList.remove('immersed');
    for (const [element, value] of priorInert) element.inert = value;
  };
}
