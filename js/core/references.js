/* ===== Catálogo bibliográfico científico y renderizado de citas por ecuación ===== */
(function () {
  const CATALOG = {
    YF: {
      id: 'YF',
      short: 'Young & Freedman (2018)',
      full: 'Young, H. D., &amp; Freedman, R. A. (2018). <i>Física universitaria con física moderna</i> (Vol. 2, 14.ª ed.). Pearson Educación.'
    },
    GR: {
      id: 'GR',
      short: 'Griffiths (2017)',
      full: 'Griffiths, D. J. (2017). <i>Introduction to Electrodynamics</i> (4th ed.). Cambridge University Press.'
    },
    SJ: {
      id: 'SJ',
      short: 'Serway & Jewett (2018)',
      full: 'Serway, R. A., &amp; Jewett, J. W. (2018). <i>Física para ciencias e ingeniería</i> (Vol. 2, 10.ª ed.). Cengage Learning.'
    },
    BO: {
      id: 'BO',
      short: 'Boris (1970)',
      full: 'Boris, J. P. (1970). Relativistic plasma simulation—Optimization of a hybrid code. En <i>Proceedings of the Fourth Conference on Numerical Simulation of Plasmas</i> (pp. 3–67). Naval Research Laboratory, Washington, D.C.'
    },
    BL: {
      id: 'BL',
      short: 'Birdsall & Langdon (2004)',
      full: 'Birdsall, C. K., &amp; Langdon, A. B. (2004). <i>Plasma Physics via Computer Simulation</i>. Taylor &amp; Francis.'
    },
    CO: {
      id: 'CO',
      short: 'BIPM (2019) / CODATA (2021)',
      full: 'Bureau International des Poids et Mesures (2019). <i>El Sistema Internacional de Unidades (SI)</i> (9.ª ed.); Tiesinga, E., Mohr, P. J., Newell, D. B., &amp; Taylor, B. N. (2021). CODATA Recommended Values of the Fundamental Physical Constants: 2018. <i>Reviews of Modern Physics</i>, 93(2), 025010.'
    }
  };

  /* Renderiza una ecuación en bloque acompañada de su referencia bibliográfica verificada */
  function eq(tex, citations) {
    const cites = (citations || [])
      .map(([id, loc]) => {
        const entry = CATALOG[id];
        if (!entry) return '';
        const label = loc ? `${entry.short}, ${loc}` : entry.short;
        return `<a href="#ref-${id}" class="cite-link" data-ref="${id}">${label}</a>`;
      })
      .filter(Boolean)
      .join('<span class="cite-sep">·</span>');

    return (
      `<figure class="eq-block">` +
      `<div class="eq-math">$$${tex}$$</div>` +
      (cites ? `<figcaption class="eq-cite">${cites}</figcaption>` : '') +
      `</figure>`
    );
  }

  /* Renderiza una cita breve en línea para notas o algoritmos */
  function inline(id, loc) {
    const entry = CATALOG[id];
    if (!entry) return '';
    const label = loc ? `${entry.short}, ${loc}` : entry.short;
    return `<a href="#ref-${id}" class="cite-inline" data-ref="${id}">(${label})</a>`;
  }

  /* Extrae todas las referencias citadas en #th y #explain-body y construye la bibliografía del tema activo */
  function renderBibliography() {
    const listEl = $('refs-list');
    const secEl = $('sec-refs');
    if (!listEl || !secEl) return;

    const usedIds = [];
    const seen = new Set();
    ['th', 'explain-body'].forEach((containerId) => {
      const container = $(containerId);
      if (!container || typeof container.querySelectorAll !== 'function') return;
      container.querySelectorAll('[data-ref]').forEach((el) => {
        const id = el.getAttribute('data-ref');
        if (id && CATALOG[id] && !seen.has(id)) {
          seen.add(id);
          usedIds.push(id);
        }
      });
    });

    if (usedIds.length === 0) {
      secEl.hidden = true;
      listEl.innerHTML = '';
      return;
    }

    secEl.hidden = false;
    listEl.innerHTML = usedIds
      .map(
        (id) =>
          `<li id="ref-${id}" class="ref-item">` +
          `<span class="ref-key">[${id}]</span> ` +
          `<span class="ref-text">${CATALOG[id].full}</span>` +
          `</li>`
      )
      .join('');
  }

  /* Resaltado discreto al hacer clic en una cita para localizarla en la lista bibliográfica */
  function bindCitationClicks(rootEl) {
    if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;
    rootEl.querySelectorAll('[data-ref]').forEach((link) => {
      link.onclick = (e) => {
        e.preventDefault();
        const id = link.getAttribute('data-ref');
        const target = $('ref-' + id);
        if (!target) return;
        if (typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        target.classList.add('is-highlighted');
        setTimeout(() => target.classList.remove('is-highlighted'), 1200);
      };
    });
  }

  Sim.refs = { CATALOG, eq, inline, renderBibliography, bindCitationClicks };
})();
