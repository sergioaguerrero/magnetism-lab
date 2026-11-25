/* ===== Coordinador principal, navegación de temas y bucle de animación ===== */
let activeMod = null;
let paused = false;
let fr = 0;

/* Contador de FPS en vivo (RNF-05) */
let fpsFrames = 0;
let fpsLastTime = performance.now();
const fpsEl = $('fps');

const tabButtons = Sim.modules.map((mod) => {
  const b = document.createElement('button');
  b.textContent = mod.title;
  b.onclick = () => setMode(mod.id);
  $('tabs').append(b);
  return { id: mod.id, btn: b };
});

function setMode(id, presetName) {
  const mod = Sim.modulesById[id];
  if (!mod) return;
  activeMod = mod;
  Sim.activeMod = mod;

  Sim.modules.forEach((m) => {
    m.group.visible = m.id === id;
  });

  tabButtons.forEach((t) => {
    t.btn.classList.toggle('on', t.id === id);
  });

  $('th').innerHTML = mod.theory;
  Sim.ui.renderMath($('th'));
  $('pz').hidden = !mod.canPause;

  if (presetName && mod.applyPreset) {
    mod.applyPreset(presetName);
  } else {
    mod.activate();
  }

  if (Sim.explainer) {
    Sim.explainer.update(mod);
  }

  centerCamera();
}

function centerCamera() {
  if (!activeMod) return;
  if (activeMod.cameraPos) {
    cam.position.set(...activeMod.cameraPos);
  }
  ctl.target.set(0, 0, 0);
  ctl.update();
}

$('rs').onclick = () => {
  if (activeMod && activeMod.reset) {
    activeMod.reset();
  }
};

$('pz').onclick = () => {
  paused = !paused;
  $('pz').textContent = paused ? 'Continuar' : 'Pausar';
};

if ($('btn-cam')) {
  $('btn-cam').onclick = centerCamera;
}

if ($('btn-theme')) {
  $('btn-theme').onclick = () => Sim.scene.toggleTheme();
}

/* Alternar entre barra lateral izquierda (Temas) y barra lateral derecha (Explicación detallada) con animación */
let explainOpen = false;
function toggleExplain(forceState) {
  explainOpen = typeof forceState === 'boolean' ? forceState : !explainOpen;
  const btnExp = $('btn-explain');

  if (explainOpen && Sim.explainer && activeMod) {
    Sim.explainer.update(activeMod);
  }

  document.body.classList.toggle('explain-open', explainOpen);
  if (btnExp) btnExp.classList.toggle('on', explainOpen);
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

function loop(now) {
  requestAnimationFrame(loop);

  fpsFrames++;
  if (now - fpsLastTime >= 600) {
    const fps = Math.min(60, Math.round((fpsFrames * 1000) / (now - fpsLastTime)));
    if (fpsEl) fpsEl.textContent = fps + ' FPS';
    fpsFrames = 0;
    fpsLastTime = now;
  }

  if (activeMod && activeMod.update) {
    activeMod.update(paused, fr++);
  }
  ctl.update();
  renderer.render(scene, cam);
}

if (Sim.modules.length > 0) {
  setMode(Sim.modules[0].id);
}
Sim.ui.renderMath(document.body);
requestAnimationFrame(loop);
