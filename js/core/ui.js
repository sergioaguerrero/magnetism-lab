/* ===== Gestor de interfaz: renderizado matemático KaTeX, variantes, sliders y lecturas ===== */
let lastRoKey = '';
let roValSpans = [];
let sliderDefaults = {};
let activeVis = null;
let activeOnChange = null;
let activeState = null;

function renderMath(el) {
  if (!el || typeof window.renderMathInElement !== 'function') return;
  window.renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  });
}

function ro(list) {
  const roEl = $('ro');
  const key = list.map((item) => item[0]).join('||');

  if (key !== lastRoKey || roValSpans.length !== list.length) {
    lastRoKey = key;
    roEl.innerHTML = list
      .map(([label]) => `<div class="kv"><span class="kv-lbl">${label}</span><span class="kv-val"></span></div>`)
      .join('');
    roValSpans = Array.from(roEl.querySelectorAll('.kv-val'));
    renderMath(roEl);
  }

  for (let i = 0; i < list.length; i++) {
    roValSpans[i].textContent = list[i][1];
  }
}

function captureSliderDefaults(cfg, state, baseDefaults) {
  sliderDefaults = {};
  cfg.forEach((o) => {
    if (!o.opts) {
      sliderDefaults[o.k] = baseDefaults && o.k in baseDefaults ? baseDefaults[o.k] : state[o.k];
    }
  });
}

function build(cfg, state, onChange) {
  const vContainer = $('variants');
  const cContainer = $('ctrls');
  if (vContainer) vContainer.innerHTML = '';
  if (cContainer) cContainer.innerHTML = '';

  activeState = state;
  activeOnChange = onChange;

  const baseDefaults = Sim.activeMod && Sim.activeMod.defaultState ? Sim.activeMod.defaultState : null;
  captureSliderDefaults(cfg, state, baseDefaults);
  /* Si el módulo actual tiene un preset activo (ej. Selector de velocidades o Espira),
     conserva los valores predeterminados de los sliders propios de esa variante */
  cfg.forEach((o) => {
    if (!o.opts) {
      sliderDefaults[o.k] = state[o.k];
    }
  });

  const rows = [];

  const vis = () => {
    rows.forEach(([o, r, syncVal]) => {
      r.hidden = !!o.show && !o.show();
      if (syncVal) syncVal();
    });
  };
  activeVis = vis;

  cfg.forEach((o) => {
    const r = document.createElement('label');
    r.className = 'row';
    let syncVal = null;

    if (o.opts) {
      /* Las variantes / selectores de cada tema van en la barra lateral izquierda (#variants) */
      r.classList.add('variant-row');
      r.innerHTML = `<div><span>${o.t}</span></div>`;
      const s = document.createElement('select');
      s.style.width = '100%';
      for (const k in o.opts) {
        s.add(new Option(k, o.opts[k]));
      }
      s.value = state[o.k];
      syncVal = () => {
        s.value = state[o.k];
      };
      s.oninput = () => {
        const prev = state[o.k];
        state[o.k] = s.value;
        /* Si la variante cambia, primero restaura la base de los sliders y aplica los defaults de la nueva variante */
        if (o.onSelect) {
          if (baseDefaults) {
            cfg.forEach((item) => {
              if (!item.opts && item.k in baseDefaults) {
                state[item.k] = baseDefaults[item.k];
              }
            });
          }
          o.onSelect(s.value, prev);
          cfg.forEach((item) => {
            if (!item.opts) {
              sliderDefaults[item.k] = state[item.k];
            }
          });
        }
        vis();
        onChange();
        if (Sim.explainer && Sim.activeMod) Sim.explainer.update(Sim.activeMod);
      };
      r.append(s);
      if (vContainer) vContainer.append(r);
      else if (cContainer) cContainer.append(r);
    } else {
      /* Los parámetros numéricos modificables (sliders) van en la sección inferior (#ctrls) */
      r.classList.add('slider-row');
      r.innerHTML = `<div><span>${o.t}</span><b></b></div><input type="range" min="${o.min}" max="${o.max}" step="${o.step}">`;
      const i = r.querySelector('input');
      const b = r.querySelector('b');
      i.value = state[o.k];
      const sh = () => {
        b.textContent = fm(+i.value) + (o.u ? ' ' + o.u : '');
      };
      sh();
      syncVal = () => {
        i.value = state[o.k];
        sh();
      };
      i.oninput = () => {
        state[o.k] = +i.value;
        sh();
        onChange();
        if (Sim.explainer && Sim.activeMod) Sim.explainer.update(Sim.activeMod);
      };
      if (cContainer) cContainer.append(r);
    }

    rows.push([o, r, syncVal]);
  });

  if (vContainer) renderMath(vContainer);
  if (cContainer) renderMath(cContainer);
  vis();
}

/* Restaura únicamente los sliders numéricos (Parámetros modificables) sin alterar las Variantes del tema */
function resetSlidersOnly() {
  if (!activeState) return;
  for (const k in sliderDefaults) {
    activeState[k] = sliderDefaults[k];
  }
  if (activeVis) activeVis();
  if (activeOnChange) activeOnChange();
  if (Sim.explainer && Sim.activeMod) Sim.explainer.update(Sim.activeMod);
}

Sim.ui = { ro, build, renderMath, resetSlidersOnly };
