/* ===== Coordinador principal, navegación superior, panel de pestañas y bucle 3D ===== */
let activeMod = null;
let paused = true;
let fr = 0;
let lastFrameTime = performance.now();

const SHORT_TITLES = {
  'campo-magnetico': 'Campo magnético',
  'fuentes-campo': 'Fuentes de B',
  'fuerza-corrientes': 'Corrientes',
  'torque-lazo': 'Torsión',
  'movimiento-particula': 'Partícula',
  'flujo-magnetico': 'Flujo',
  'ley-gauss': 'Ley de Gauss'
};

function setPaused(p) {
  paused = p;
  const pzBtn = $('pz');
  if (pzBtn) {
    pzBtn.textContent = paused ? 'Iniciar' : 'Pausar';
    pzBtn.classList.toggle('tr-primary', paused);
    pzBtn.classList.toggle('on', !paused);
  }
}

/* Construcción de pestañas horizontales numeradas (01–07) en la barra superior */
const tabButtons = Sim.modules.map((mod, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const shortLabel = SHORT_TITLES[mod.id] || mod.title.replace(/^\d+\s*·\s*/, '');
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'topic-tab';
  b.title = `${num} · ${mod.title.replace(/^\d+\s*·\s*/, '')}`;
  b.innerHTML = `<span class="topic-tab-num">${num}</span><span class="topic-tab-label">${shortLabel}</span>`;
  b.onclick = () => setMode(mod.id);
  const tabsEl = $('tabs');
  if (tabsEl) tabsEl.append(b);
  return { id: mod.id, num, btn: b };
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

  let activeNum = '01';
  tabButtons.forEach((t) => {
    const isMatch = t.id === id;
    t.btn.classList.toggle('on', isMatch);
    t.btn.setAttribute('aria-current', isMatch ? 'page' : 'false');
    if (isMatch) activeNum = t.num;
  });

  const vpIndex = $('vp-index');
  const vpTitle = $('vp-title');
  if (vpIndex) vpIndex.textContent = activeNum;
  if (vpTitle) vpTitle.textContent = mod.title.replace(/^\d+\s*·\s*/, '');

  const thEl = $('th');
  if (thEl) {
    thEl.innerHTML = mod.theory;
    Sim.ui.renderMath(thEl);
    if (Sim.refs) {
      Sim.refs.bindCitationClicks(thEl);
      Sim.refs.renderBibliography();
    }
  }

  const pzBtn = $('pz');
  const rsBtn = $('rs');
  const trSepSim = $('tr-sep-sim');
  if (pzBtn) pzBtn.hidden = !mod.canPause;
  if (rsBtn) rsBtn.hidden = !mod.canPause;
  if (trSepSim) trSepSim.hidden = !mod.canPause;
  setPaused(true);

  const freeBtn = $('btn-free');
  if (freeBtn) {
    freeBtn.hidden = !mod.canFollow;
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
  if (Sim.plot) {
    Sim.plot.render(mod);
  }
  if (Sim.drag) {
    Sim.drag.syncHint(mod);
  }

  if (!skipHash) {
    syncUrlHash(id);
  }

  centerCamera();
}

function markViewButton(view) {
  document.querySelectorAll('.tr-view[data-view]').forEach((btn) => {
    btn.classList.toggle('on', btn.getAttribute('data-view') === view);
  });
}

function centerCamera() {
  if (!activeMod || !Sim.scene || !Sim.scene.webglReady) return;
  if (activeMod.cameraPos) {
    cam.position.set(...activeMod.cameraPos);
  }
  ctl.target.set(0, 0, 0);
  ctl.update();
  markViewButton('3d');
}

function setCameraView(view) {
  if (!activeMod || !Sim.scene || !Sim.scene.webglReady) return;
  if (Sim.inspector) Sim.inspector.clear();
  if (view === '3d') {
    centerCamera();
    return;
  }
  const base = activeMod.cameraPos || [12, 10, 18];
  const dist = Math.hypot(base[0], base[1], base[2]) * 0.92;
  ctl.target.set(0, 0, 0);
  if (view === 'xy') cam.position.set(0, 0, dist);
  else if (view === 'xz') cam.position.set(0, dist, 0.01);
  else if (view === 'yz') cam.position.set(dist, 0, 0);
  ctl.update();
  markViewButton(view);
}

document.querySelectorAll('.tr-view[data-view]').forEach((btn) => {
  btn.onclick = () => setCameraView(btn.getAttribute('data-view'));
});

/* Gestión de pestañas del panel derecho: Instrumentación | Análisis y teoría */
let activeRailTab = 'controls';
function setRailTab(tabName) {
  activeRailTab = tabName;
  const isAnalysis = tabName === 'analysis';
  const btnCtrl = $('tab-controls');
  const btnAna = $('tab-analysis');
  const panelCtrl = $('panel-controls');
  const panelAna = $('panel-analysis');

  if (btnCtrl) {
    btnCtrl.classList.toggle('is-active', !isAnalysis);
    btnCtrl.setAttribute('aria-selected', String(!isAnalysis));
  }
  if (btnAna) {
    btnAna.classList.toggle('is-active', isAnalysis);
    btnAna.setAttribute('aria-selected', String(isAnalysis));
  }
  if (panelCtrl) panelCtrl.hidden = isAnalysis;
  if (panelAna) panelAna.hidden = !isAnalysis;

  document.body.classList.toggle('analysis-open', isAnalysis);

  if (isAnalysis && Sim.explainer && activeMod) {
    Sim.explainer.update(activeMod, true);
  } else if (!isAnalysis && Sim.plot && activeMod) {
    Sim.plot.render(activeMod);
  }
}

if ($('tab-controls')) $('tab-controls').onclick = () => setRailTab('controls');
if ($('tab-analysis')) $('tab-analysis').onclick = () => setRailTab('analysis');

/* Mostrar u ocultar panel lateral derecho (con persistencia en localStorage) */
try {
  if (localStorage.getItem('mlab-rail') === 'collapsed') {
    document.body.classList.add('rail-collapsed');
    if ($('btn-toggle-rail')) $('btn-toggle-rail').setAttribute('aria-expanded', 'false');
  }
} catch (_) {
  /* noop */
}

if ($('btn-toggle-rail')) {
  $('btn-toggle-rail').onclick = () => {
    const collapsed = document.body.classList.toggle('rail-collapsed');
    $('btn-toggle-rail').setAttribute('aria-expanded', String(!collapsed));
    try {
      localStorage.setItem('mlab-rail', collapsed ? 'collapsed' : 'open');
    } catch (_) {
      /* noop */
    }
    if (Sim.scene && Sim.scene.syncSize) Sim.scene.syncSize();
    if (!collapsed && Sim.plot && activeMod) Sim.plot.render(activeMod);
  };
}

/* Controles de transporte y parámetros */
if ($('rs')) {
  $('rs').onclick = () => {
    setPaused(true);
    if (activeMod && activeMod.reset) {
      activeMod.reset();
      if (Sim.plot) Sim.plot.render(activeMod);
      if (Sim.explainer) Sim.explainer.update(activeMod, false);
      if (Sim.inspector) Sim.inspector.markDirty();
    }
  };
}

if ($('btn-defaults')) {
  $('btn-defaults').onclick = () => {
    if (!activeMod) return;
    setPaused(true);
    if (Sim.ui && Sim.ui.resetSlidersOnly) {
      Sim.ui.resetSlidersOnly();
    }
  };
}

if ($('pz')) {
  $('pz').onclick = () => {
    setPaused(!paused);
    if (paused && activeMod && Sim.explainer) {
      Sim.explainer.update(activeMod, false);
    }
  };
}

Sim.freeCam = false;
if ($('btn-free')) {
  $('btn-free').onclick = () => {
    Sim.freeCam = !Sim.freeCam;
    $('btn-free').classList.toggle('on', Sim.freeCam);
    $('btn-free').textContent = Sim.freeCam ? 'Cámara libre: activa' : 'Cámara libre';
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

if ($('btn-export-png')) {
  $('btn-export-png').onclick = () => {
    if (Sim.exporter) Sim.exporter.exportPng();
  };
}

if ($('btn-export-csv')) {
  $('btn-export-csv').onclick = () => {
    if (Sim.exporter) Sim.exporter.exportCsv();
  };
}

const ICON_SUN =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="4"></circle>' +
  '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>';
const ICON_MOON =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

function syncThemeIcon() {
  const btn = $('btn-theme');
  if (!btn || !Sim.scene || !Sim.scene.isDarkTheme) return;
  const dark = Sim.scene.isDarkTheme();
  btn.innerHTML = dark ? ICON_SUN : ICON_MOON;
  btn.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

syncThemeIcon();
if ($('btn-theme')) {
  $('btn-theme').onclick = () => Sim.scene.toggleTheme();
}

if (Sim.scene && Sim.scene.onThemeChange) {
  Sim.scene.onThemeChange(() => {
    syncThemeIcon();
    if (activeMod && activeMod.onThemeChange) {
      activeMod.onThemeChange();
    }
    if (Sim.plot && activeMod) {
      Sim.plot.render(activeMod);
    }
    if (Sim.inspector && activeMod) {
      Sim.inspector.syncLegend(activeMod);
      Sim.inspector.markDirty();
    }
  });
}

/* Popover de ayuda de navegación 3D */
const helpPopover = $('help-popover');
const btnHelp = $('btn-help');
function setHelpOpen(open) {
  if (!helpPopover || !btnHelp) return;
  helpPopover.hidden = !open;
  btnHelp.classList.toggle('is-active', open);
  btnHelp.setAttribute('aria-expanded', String(open));
}

if (btnHelp) {
  btnHelp.onclick = () => setHelpOpen(helpPopover.hidden);
}
if ($('btn-close-help')) {
  $('btn-close-help').onclick = () => setHelpOpen(false);
}

/* Modal de índice de los 7 temas */
const modalEl = $('welcome-modal');
if ($('btn-home') && modalEl) {
  $('btn-home').onclick = () => {
    setHelpOpen(false);
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

document.querySelectorAll('[data-goto]').forEach((card) => {
  card.onclick = () => {
    const targetMod = card.getAttribute('data-goto');
    const preset = card.getAttribute('data-preset');
    setMode(targetMod, preset);
    if (modalEl) modalEl.hidden = true;
  };
});

/* Atajos de teclado discretos y accesibles */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalEl && !modalEl.hidden) {
      modalEl.hidden = true;
      return;
    }
    if (helpPopover && !helpPopover.hidden) {
      setHelpOpen(false);
      return;
    }
    const hud = $('vec-hud');
    if (hud && !hud.hidden && Sim.inspector) {
      Sim.inspector.clear();
    }
    return;
  }

  const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key >= '1' && e.key <= '7') {
    const mod = Sim.modules[Number(e.key) - 1];
    if (mod) setMode(mod.id);
  } else if (e.key === ' ' && activeMod && activeMod.canPause && tag !== 'BUTTON') {
    e.preventDefault();
    setPaused(!paused);
  } else if ((e.key === 'r' || e.key === 'R') && activeMod && activeMod.reset) {
    setPaused(true);
    activeMod.reset();
    if (Sim.plot) Sim.plot.render(activeMod);
    if (Sim.explainer) Sim.explainer.update(activeMod, false);
    if (Sim.inspector) Sim.inspector.markDirty();
  }
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
