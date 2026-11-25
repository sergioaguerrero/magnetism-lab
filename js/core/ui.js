/* ===== Gestor de interfaz: lecturas en vivo y controles dinámicos ===== */
function ro(list) {
  $('ro').innerHTML = list
    .map(([label, val]) => `<div class="kv"><span>${label}</span><span>${val}</span></div>`)
    .join('');
}

function build(cfg, state, onChange) {
  const c = $('ctrls');
  c.innerHTML = '';
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
    } else {
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
    }

    rows.push([o, r, syncVal]);
    c.append(r);
  });

  vis();
}

Sim.ui = { ro, build };
