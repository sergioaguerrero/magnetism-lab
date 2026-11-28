/* ===== Coordinador principal, navegación de temas, hash URL y bucle de animación ===== */
let activeMod = null;
let paused = true;
let fr = 0;

function setPaused(p) {
  paused = p;
  const pzBtn = $('pz');
  if (pzBtn) {
    pzBtn.textContent = paused ? 'Iniciar' : 'Pausar';
    pzBtn.classList.toggle('on', paused);
  }
}

/* Contador de FPS reales en vivo (sin límite artificial a 60 Hz) */
let fpsFrames = 0;
let fpsLastTime = performance.now();
let lastFrameTime = performance.now();
const fpsEl = $('fps');

const tabButtons = Sim.modules.map((mod) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = mod.title;
  b.onclick = () => setMode(mod.id);
  $('tabs').append(b);
  return { id: mod.id, btn: b };
});

function syncUrlHash(id) {
  const target = '#' + id;
  if (window.location.hash !== target) {
    try {
      history.replaceState(null, '', target);
    } catch (_) {
      window.location.hash = target;
    }
  }
}

function setMode(id, presetName, skipHash) {
  const mod = Sim.modulesById[id];
  if (!mod) return;
  activeMod = mod;
  Sim.activeMod = mod;

  Sim.modules.forEach((m) => {
    if (m.group) m.group.visible = m.id === id;
  });

  tabButtons.forEach((t) => {
    t.btn.classList.toggle('on', t.id === id);
  });

  $('th').innerHTML = mod.theory;
  Sim.ui.renderMath($('th'));
  $('pz').hidden = !mod.canPause;
  setPaused(true);
  if ($('btn-free')) {
    $('btn-free').hidden = !mod.canFollow;
  }

  if (presetName && mod.applyPreset) {
    mod.applyPreset(presetName);
  } else {
    mod.activate();
  }

  if (Sim.explainer) {
    Sim.explainer.update(mod, false);
  }
  if (Sim.inspector) {
    Sim.inspector.clear();
    Sim.inspector.syncLegend(mod);
  }

  if (!skipHash) {
    syncUrlHash(id);
  }

  centerCamera();
}

function centerCamera() {
  if (!activeMod || !Sim.scene || !Sim.scene.webglReady) return;
  if (activeMod.cameraPos) {
    cam.position.set(...activeMod.cameraPos);
  }
  ctl.target.set(0, 0, 0);
  ctl.update();
}

$('rs').onclick = () => {
  setPaused(true);
  if (activeMod && activeMod.reset) {
    activeMod.reset();
    if (Sim.explainer) Sim.explainer.update(activeMod, false);
    if (Sim.inspector) Sim.inspector.markDirty();
  }
};

if ($('btn-defaults')) {
  $('btn-defaults').onclick = () => {
    if (!activeMod) return;
    setPaused(true);
    if (Sim.ui && Sim.ui.resetSlidersOnly) {
      Sim.ui.resetSlidersOnly();
    }
  };
}

$('pz').onclick = () => {
  setPaused(!paused);
  if (paused && activeMod && Sim.explainer) {
    Sim.explainer.update(activeMod, false);
  }
};

Sim.freeCam = false;
if ($('btn-free')) {
  $('btn-free').onclick = () => {
    Sim.freeCam = !Sim.freeCam;
    $('btn-free').classList.toggle('on', Sim.freeCam);
    $('btn-free').textContent = Sim.freeCam ? 'Libre: ON' : 'Modo libre';
  };
}

if ($('btn-cam')) {
  $('btn-cam').onclick = () => {
    if (Sim.inspector) Sim.inspector.clear();
    centerCamera();
  };
}

if ($('vec-hud-close')) {
  $('vec-hud-close').onclick = () => {
    if (Sim.inspector) Sim.inspector.clear();
  };
}

if ($('btn-theme')) {
  $('btn-theme').onclick = () => Sim.scene.toggleTheme();
}

if (Sim.scene && Sim.scene.onThemeChange) {
  Sim.scene.onThemeChange(() => {
    if (activeMod && activeMod.onThemeChange) {
      activeMod.onThemeChange();
    }
    if (Sim.inspector && activeMod) {
      Sim.inspector.syncLegend(activeMod);
      Sim.inspector.markDirty();
    }
  });
}

/* Alternar entre barra lateral izquierda (Temas) y barra lateral derecha (Explicación) */
let explainOpen = false;
function toggleExplain(forceState) {
  explainOpen = typeof forceState === 'boolean' ? forceState : !explainOpen;
  const btnExp = $('btn-explain');

  document.body.classList.toggle('explain-open', explainOpen);
  if (btnExp) btnExp.classList.toggle('on', explainOpen);

  if (explainOpen && Sim.explainer && activeMod) {
    Sim.explainer.update(activeMod, true);
  }
}

if ($('btn-explain')) {
  $('btn-explain').onclick = () => toggleExplain();
}
if ($('btn-close-explain')) {
  $('btn-close-explain').onclick = () => toggleExplain(false);
}

/* Modal de inicio con acceso directo a los 7 temas del laboratorio */
const modalEl = $('welcome-modal');
if ($('btn-home') && modalEl) {
  $('btn-home').onclick = () => {
    modalEl.hidden = false;
    const closeBtn = $('btn-close-modal');
    if (closeBtn) closeBtn.focus();
  };
}
if ($('btn-close-modal') && modalEl) {
  $('btn-close-modal').onclick = () => {
    modalEl.hidden = true;
  };
  modalEl.onclick = (e) => {
    if (e.target === modalEl) modalEl.hidden = true;
  };
}

/* Accesibilidad: cerrar modal o inspector con tecla Escape */
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (modalEl && !modalEl.hidden) {
    modalEl.hidden = true;
    return;
  }
  const hud = $('vec-hud');
  if (hud && !hud.hidden && Sim.inspector) {
    Sim.inspector.clear();
  }
});

document.querySelectorAll('[data-goto]').forEach((card) => {
  card.onclick = () => {
    const targetMod = card.getAttribute('data-goto');
    const preset = card.getAttribute('data-preset');
    setMode(targetMod, preset);
    if (modalEl) modalEl.hidden = true;
  };
});

window.addEventListener('hashchange', () => {
  const hashId = window.location.hash.replace(/^#/, '');
  if (hashId && Sim.modulesById[hashId] && (!activeMod || activeMod.id !== hashId)) {
    setMode(hashId, null, true);
  }
});

function loop(now) {
  requestAnimationFrame(loop);

  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  fpsFrames++;
  if (now - fpsLastTime >= 600) {
    const fps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
    if (fpsEl) fpsEl.textContent = fps + ' FPS';
    fpsFrames = 0;
    fpsLastTime = now;
  }

  const isAnimating = Boolean(activeMod && activeMod.canPause && !paused);
  if (activeMod && activeMod.update) {
    activeMod.update(paused, fr++, dt);
  }
  if (Sim.inspector) {
    Sim.inspector.tick(now, isAnimating);
  }
  ctl.update();
  renderer.render(scene, cam);
}

if (Sim.modules.length > 0) {
  const initialHash = window.location.hash.replace(/^#/, '');
  const initialId = Sim.modulesById[initialHash] ? initialHash : Sim.modules[0].id;
  setMode(initialId);
}
Sim.ui.renderMath(document.body);

if (Sim.scene && Sim.scene.webglReady) {
  requestAnimationFrame(loop);
}
