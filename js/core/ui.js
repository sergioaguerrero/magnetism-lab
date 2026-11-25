/* ===== Gestor de interfaz: renderizado matemático KaTeX, variantes, sliders y lecturas ===== */
let lastRoKey = '';
let roValSpans = [];

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

function build(cfg, state, onChange) {
  const vContainer = $('variants');
  const cContainer = $('ctrls');
  if (vContainer) vContainer.innerHTML = '';
  if (cContainer) cContainer.innerHTML = '';

  const rows = [];

  const vis = () => {
    rows.forEach(([o, r, syncVal]) => {
      r.hidden = !!o.show && !o.show();
      if (syncVal) syncVal();
    });
  };

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
        if (o.onSelect) o.onSelect(s.value, prev);
        vis();
        onChange();
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
      };
      if (cContainer) cContainer.append(r);
    }

    rows.push([o, r, syncVal]);
  });

  if (vContainer) renderMath(vContainer);
  if (cContainer) renderMath(cContainer);
  vis();
}

Sim.ui = { ro, build, renderMath };
