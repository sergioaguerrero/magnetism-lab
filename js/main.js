/* ===== Coordinador principal y bucle de animación ===== */
let activeMod = null;
let paused = false;
let fr = 0;

const tabButtons = Sim.modules.map((mod) => {
  const b = document.createElement('button');
  b.textContent = mod.title;
  b.onclick = () => setMode(mod.id);
  $('tabs').append(b);
  return { id: mod.id, btn: b };
});

function setMode(id) {
  const mod = Sim.modulesById[id];
  if (!mod) return;
  activeMod = mod;

  Sim.modules.forEach((m) => {
    m.group.visible = m.id === id;
  });

  tabButtons.forEach((t) => {
    t.btn.classList.toggle('on', t.id === id);
  });

  $('th').textContent = mod.theory;
  $('pz').hidden = !mod.canPause;

  mod.activate();

  if (mod.cameraPos) {
    cam.position.set(...mod.cameraPos);
  }
  ctl.target.set(0, 0, 0);
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

function loop() {
  requestAnimationFrame(loop);
  if (activeMod && activeMod.update) {
    activeMod.update(paused, fr++);
  }
  ctl.update();
  renderer.render(scene, cam);
}

if (Sim.modules.length > 0) {
  setMode(Sim.modules[0].id);
}
loop();
