/* ===== Exportación de capturas PNG del visor 3D y tablas/curvas CSV (SI) ===== */
(function () {
  function stripLatex(str) {
    return String(str || '')
      .replace(/\\vec\{([^}]+)\}/g, '$1')
      .replace(/\\hat\{([^}]+)\}/g, '$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\Delta\s*/g, 'Δ')
      .replace(/\\Phi/g, 'Φ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\tau/g, 'τ')
      .replace(/\\alpha/g, 'α')
      .replace(/\\omega/g, 'ω')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\oint_S/g, '∮_S')
      .replace(/\\nabla/g, '∇')
      .replace(/\\cos/g, 'cos')
      .replace(/\\sin/g, 'sin')
      .replace(/\\,/g, ' ')
      .replace(/\$|\\/g, '')
      .replace(/\{|\}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function csvCell(v) {
    const s = String(v === undefined || v === null ? '' : v);
    if (/[",\r\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildCsvString(mod) {
    if (!mod) return '';
    const lines = [];
    const cleanTitle = mod.title.replace(/^\d+\s*·\s*/, '');
    lines.push([csvCell('Magnetism Lab'), csvCell(cleanTitle)].join(','));
    lines.push([csvCell('Fecha'), csvCell(new Date().toISOString())].join(','));
    lines.push('');

    /* Parámetros activos */
    lines.push('Parametro,Valor');
    const S = mod.state || {};
    Object.keys(S).forEach((k) => {
      lines.push([csvCell(k), csvCell(S[k])].join(','));
    });

    /* Mediciones SI activas */
    const readouts = Sim.ui && Sim.ui.getLastReadouts ? Sim.ui.getLastReadouts() : [];
    if (readouts.length > 0) {
      lines.push('');
      lines.push('Medicion,Valor,Unidad');
      readouts.forEach((r) => {
        lines.push([csvCell(stripLatex(r.label)), csvCell(r.num), csvCell(r.unit)].join(','));
      });
    }

    /* Curva 2D muestreada si existe */
    const plot = Sim.plot && Sim.plot.getLastSpec ? Sim.plot.getLastSpec() : null;
    if (plot && plot.series && plot.series.length > 0 && plot.series[0].pts.length > 0) {
      lines.push('');
      const header = [csvCell(plot.xLabel || 'x')];
      plot.series.forEach((s, idx) => {
        header.push(csvCell(s.label || `serie_${idx + 1}`));
      });
      lines.push(header.join(','));

      const base = plot.series[0].pts;
      for (let i = 0; i < base.length; i++) {
        const row = [csvCell(base[i][0])];
        plot.series.forEach((s) => {
          const pt = s.pts[i];
          row.push(csvCell(pt && isFinite(pt[1]) ? pt[1] : ''));
        });
        lines.push(row.join(','));
      }
    } else if (plot && plot.bars && plot.bars.length > 0) {
      lines.push('');
      lines.push(`Balance,Valor (${plot.unit || ''})`);
      plot.bars.forEach((b) => {
        lines.push([csvCell(b.label), csvCell(b.val)].join(','));
      });
    }

    return '\uFEFF' + lines.join('\r\n');
  }

  function exportCsv() {
    const mod = Sim.activeMod;
    if (!mod) return;
    const csv = buildCsvString(mod);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `magnetism-lab-${mod.id}.csv`);
  }

  function exportPng() {
    const mod = Sim.activeMod;
    if (!mod || !Sim.scene || !Sim.scene.webglReady || !renderer) return;
    /* Renderizar inmediatamente antes de capturar evita canvas vacío sin preserveDrawingBuffer */
    renderer.render(scene, cam);
    const dataUrl = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `magnetism-lab-${mod.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  Sim.exporter = { exportCsv, exportPng, buildCsvString };
})();
