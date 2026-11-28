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
  if (!roEl) return;
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

function notifyDependents() {
  if (Sim.explainer && Sim.activeMod) {
    Sim.explainer.scheduleUpdate(Sim.activeMod);
  }
  if (Sim.inspector && Sim.activeMod) {
    Sim.inspector.syncLegend(Sim.activeMod);
    Sim.inspector.markDirty();
  }
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
      r.classList.add('variant-row');
      r.innerHTML = `<div><span>${o.t}</span></div>`;
      const s = document.createElement('select');
      s.style.width = '100%';
      for (const k in o.opts) {
        s.add(new Option(k, o.opts[k]));
      }
      s.value = state[o.k];
      syncVal = () => {
        if (s.value !== String(state[o.k])) {
          s.value = state[o.k];
        }
      };
      s.oninput = () => {
        const prev = state[o.k];
        state[o.k] = s.value;
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
        onChange(o.k);
        notifyDependents();
      };
      r.append(s);
      if (vContainer) vContainer.append(r);
      else if (cContainer) cContainer.append(r);
    } else {
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
        if (+i.value !== +state[o.k]) {
          i.value = state[o.k];
          sh();
        }
      };
      i.oninput = () => {
        state[o.k] = +i.value;
        sh();
        onChange(o.k);
        notifyDependents();
      };
      if (cContainer) cContainer.append(r);
    }

    rows.push([o, r, syncVal]);
  });

  if (vContainer) renderMath(vContainer);
  if (cContainer) renderMath(cContainer);
  vis();
}

function syncControls() {
  if (activeVis) activeVis();
}

function resetSlidersOnly() {
  if (!activeState) return;
  for (const k in sliderDefaults) {
    activeState[k] = sliderDefaults[k];
  }
  if (activeVis) activeVis();
  if (activeOnChange) activeOnChange('__reset__');
  notifyDependents();
}

Sim.ui = { ro, build, renderMath, resetSlidersOnly, syncControls };
