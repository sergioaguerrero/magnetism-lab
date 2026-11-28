/* ===== Gestor de interfaz: controles numéricos editables, variantes, instrumentos SI y KaTeX ===== */
let lastRoKey = '';
let roNodes = [];
let lastParsedReadouts = [];
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

/* Separa magnitud numérica y unidad SI cuando se recibe una cadena simple */
function parseReading(item) {
  if (item.length >= 3 && typeof item[2] === 'string') {
    return { num: String(item[1]), unit: item[2], primary: Boolean(item[3] && item[3].primary) };
  }
  const raw = String(item[1]).trim();
  const match = raw.match(/^([+\-−]?\d+(?:\.\d+)?(?:e[+\-]?\d+)?)\s*(μN\/m|N·m|A·m²|C·m\/s|A·m|kg\/C|V\/m|cm²|m²|m\/s|μWb|mWb|Wb|μT|mT|μN|mN|μC|eV|Hz|cm|°|%|T|N|J|m|s|A)$/i);
  if (match) {
    return { num: match[1], unit: match[2], primary: Boolean(item[2] && item[2].primary) };
  }
  return { num: raw, unit: '', primary: Boolean(item[2] && item[2].primary) };
}

function ro(list) {
  const roEl = $('ro');
  if (!roEl) return;

  const parsed = list.map((item) => ({
    label: item[0],
    ...parseReading(item)
  }));
  lastParsedReadouts = parsed;

  /* Si ningún elemento se marcó como primario explícitamente, destacamos el primero o los dos primeros numéricos */
  const hasExplicitPrimary = parsed.some((p) => p.primary);
  if (!hasExplicitPrimary && parsed.length > 0) {
    parsed[0].primary = true;
    if (parsed.length > 3) parsed[1].primary = true;
  }

  const key = parsed.map((p) => `${p.primary ? 'P' : 'S'}:${p.label}`).join('||');

  if (key !== lastRoKey || roNodes.length !== parsed.length) {
    lastRoKey = key;

    const primaryItems = [];
    const tableItems = [];
    parsed.forEach((p, idx) => {
      if (p.primary) primaryItems.push({ ...p, idx });
      else tableItems.push({ ...p, idx });
    });

    const primaryHtml =
      primaryItems.length > 0
        ? `<div class="telemetry-primary">${primaryItems
            .map(
              (p) =>
                `<div class="metric-featured" data-idx="${p.idx}">` +
                `<span class="metric-lbl">${p.label}</span>` +
                `<span class="metric-reading"><span class="metric-num"></span><span class="metric-unit"></span></span>` +
                `</div>`
            )
            .join('')}</div>`
        : '';

    const tableHtml =
      tableItems.length > 0
        ? `<div class="telemetry-table">${tableItems
            .map(
              (p) =>
                `<div class="metric-row" data-idx="${p.idx}">` +
                `<span class="metric-lbl">${p.label}</span>` +
                `<span class="metric-reading"><span class="metric-num"></span><span class="metric-unit"></span></span>` +
                `</div>`
            )
            .join('')}</div>`
        : '';

    roEl.innerHTML = primaryHtml + tableHtml;

    roNodes = new Array(parsed.length);
    roEl.querySelectorAll('[data-idx]').forEach((node) => {
      const idx = Number(node.getAttribute('data-idx'));
      roNodes[idx] = {
        num: node.querySelector('.metric-num'),
        unit: node.querySelector('.metric-unit')
      };
    });
    renderMath(roEl);
  }

  for (let i = 0; i < parsed.length; i++) {
    const slot = roNodes[i];
    if (!slot) continue;
    if (slot.num && slot.num.textContent !== parsed[i].num) {
      slot.num.textContent = parsed[i].num;
    }
    if (slot.unit) {
      slot.unit.textContent = parsed[i].unit;
      slot.unit.hidden = !parsed[i].unit;
    }
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
  if (Sim.plot && Sim.activeMod) {
    Sim.plot.render(Sim.activeMod);
  }
  if (Sim.drag && Sim.activeMod) {
    Sim.drag.syncHint(Sim.activeMod);
  }
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
  const secVariants = $('sec-variants');
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
    let visibleVariants = 0;
    rows.forEach(([o, r, syncVal]) => {
      const isHidden = !!o.show && !o.show();
      r.hidden = isHidden;
      if (o.opts && !isHidden) visibleVariants++;
      if (syncVal) syncVal();
    });
    if (secVariants) {
      secVariants.hidden = visibleVariants === 0;
    }
  };
  activeVis = vis;

  cfg.forEach((o) => {
    let r;
    let syncVal = null;

    if (o.opts) {
      r = document.createElement('label');
      r.className = 'variant-row';
      r.innerHTML = `<span class="ctrl-label">${o.t}</span>`;
      const s = document.createElement('select');
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
      r = document.createElement('div');
      r.className = 'slider-row';
      const unitHtml = o.u ? `<span class="slider-unit">${o.u}</span>` : '';
      r.innerHTML =
        `<div class="slider-head">` +
        `<span class="slider-label">${o.t}</span>` +
        `<span class="slider-readout">` +
        `<input type="number" class="num-input" min="${o.min}" max="${o.max}" step="${o.step}" aria-label="${o.t.replace(/\$[^$]*\$/g, '')}">` +
        `${unitHtml}` +
        `</span>` +
        `</div>` +
        `<input type="range" min="${o.min}" max="${o.max}" step="${o.step}">`;

      const rangeInput = r.querySelector('input[type="range"]');
      const numInput = r.querySelector('input[type="number"]');
      rangeInput.value = state[o.k];
      numInput.value = state[o.k];

      const applyNumericValue = (rawVal, fromNumberBox) => {
        let val = Number(rawVal);
        if (!isFinite(val)) return;
        val = Math.max(o.min, Math.min(o.max, val));
        state[o.k] = val;
        rangeInput.value = val;
        if (!fromNumberBox || document.activeElement !== numInput) {
          numInput.value = val;
        }
        onChange(o.k);
        notifyDependents();
      };

      syncVal = () => {
        if (+rangeInput.value !== +state[o.k]) {
          rangeInput.value = state[o.k];
        }
        if (document.activeElement !== numInput && +numInput.value !== +state[o.k]) {
          numInput.value = state[o.k];
        }
      };

      rangeInput.oninput = () => applyNumericValue(rangeInput.value, false);
      numInput.oninput = () => {
        if (numInput.value === '' || numInput.value === '-') return;
        applyNumericValue(numInput.value, true);
      };
      numInput.onchange = () => {
        const clamped = Math.max(o.min, Math.min(o.max, Number(numInput.value) || o.min));
        numInput.value = clamped;
        applyNumericValue(clamped, false);
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

function getLastReadouts() {
  return lastParsedReadouts;
}

Sim.ui = { ro, build, renderMath, resetSlidersOnly, syncControls, getLastReadouts };
