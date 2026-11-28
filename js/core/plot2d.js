/* ===== Motor de gráficas 2D científicas (Canvas HiDPI sin dependencias externas) ===== */
(function () {
  let lastSpec = null;

  function getThemeColors() {
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement) : null;
    const read = (v, fb) => (style ? style.getPropertyValue(v).trim() || fb : fb);
    const isDark = Sim.scene && Sim.scene.isDarkTheme ? Sim.scene.isDarkTheme() : false;
    return {
      bg: read('--surface-input', isDark ? '#111211' : '#ffffff'),
      grid: read('--border-hairline', isDark ? '#2b2d2a' : '#dad6cc'),
      axis: read('--border-strong', isDark ? '#40443f' : '#bbb6a8'),
      ink: read('--ink-primary', isDark ? '#e8e6df' : '#181816'),
      muted: read('--ink-muted', isDark ? '#76736b' : '#76736a'),
      accent: read('--accent-primary', isDark ? '#74a9c0' : '#1b4d63'),
      phys: Sim.scene && Sim.scene.getPalette ? Sim.scene.getPalette().css : {
        B: '#1b6e44',
        I: '#b45309',
        v: '#1d5d8a',
        F: '#b42318',
        mu: '#7c3572',
        vxb: '#8a6116'
      }
    };
  }

  function fmtTick(v) {
    if (Math.abs(v) < 1e-12) return '0';
    const a = Math.abs(v);
    if (a >= 1000 || a < 0.01) return v.toExponential(1);
    return String(+v.toPrecision(3));
  }

  function drawLineChart(ctx, w, h, spec, tc) {
    const pad = { l: 48, r: 14, t: 18, b: 28 };
    const pw = Math.max(10, w - pad.l - pad.r);
    const ph = Math.max(10, h - pad.t - pad.b);

    const series = spec.series || [];
    let xMin = spec.xMin;
    let xMax = spec.xMax;
    let yMin = spec.yMin;
    let yMax = spec.yMax;

    series.forEach((s) => {
      s.pts.forEach(([x, y]) => {
        if (!isFinite(x) || !isFinite(y)) return;
        if (xMin === undefined || x < xMin) xMin = x;
        if (xMax === undefined || x > xMax) xMax = x;
        if (yMin === undefined || y < yMin) yMin = y;
        if (yMax === undefined || y > yMax) yMax = y;
      });
    });

    if (xMin === undefined || xMax === undefined || xMin === xMax) {
      xMin = 0;
      xMax = 1;
    }
    if (yMin === undefined || yMax === undefined) {
      yMin = 0;
      yMax = 1;
    }
    if (Math.abs(yMax - yMin) < 1e-12) {
      const d = Math.abs(yMax) * 0.2 || 1;
      yMin -= d;
      yMax += d;
    } else if (spec.yMin === undefined || spec.yMax === undefined) {
      const m = (yMax - yMin) * 0.08;
      if (spec.yMin === undefined) yMin -= m;
      if (spec.yMax === undefined) yMax += m;
    }

    const sx = (x) => pad.l + ((x - xMin) / (xMax - xMin)) * pw;
    const sy = (y) => pad.t + ph - ((y - yMin) / (yMax - yMin)) * ph;

    /* Rejilla técnica 4×3 */
    ctx.lineWidth = 1;
    ctx.strokeStyle = tc.grid;
    const nx = 4;
    const ny = 3;

    ctx.font = '10px "IBM Plex Mono", Consolas, monospace';
    ctx.fillStyle = tc.muted;

    for (let i = 0; i <= nx; i++) {
      const vx = xMin + ((xMax - xMin) * i) / nx;
      const px = Math.round(sx(vx)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, pad.t);
      ctx.lineTo(px, pad.t + ph);
      ctx.stroke();

      ctx.textAlign = i === 0 ? 'left' : i === nx ? 'right' : 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(fmtTick(vx), px, pad.t + ph + 4);
    }

    for (let j = 0; j <= ny; j++) {
      const vy = yMin + ((yMax - yMin) * j) / ny;
      const py = Math.round(sy(vy)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, py);
      ctx.lineTo(pad.l + pw, py);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(fmtTick(vy), pad.l - 6, py);
    }

    /* Eje cero si cae dentro del rango */
    ctx.strokeStyle = tc.axis;
    if (yMin < 0 && yMax > 0) {
      const y0 = Math.round(sy(0)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, y0);
      ctx.lineTo(pad.l + pw, y0);
      ctx.stroke();
    }
    if (xMin < 0 && xMax > 0) {
      const x0 = Math.round(sx(0)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, pad.t);
      ctx.lineTo(x0, pad.t + ph);
      ctx.stroke();
    }

    /* Marco del área de gráfica */
    ctx.strokeStyle = tc.axis;
    ctx.strokeRect(pad.l + 0.5, pad.t + 0.5, pw, ph);

    /* Curvas */
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw, ph);
    ctx.clip();

    series.forEach((s) => {
      if (!s.pts || s.pts.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.color || tc.accent;
      ctx.lineWidth = s.width || 1.75;
      ctx.setLineDash(s.dashed ? [4, 3] : []);
      let started = false;
      for (let i = 0; i < s.pts.length; i++) {
        const [x, y] = s.pts[i];
        if (!isFinite(x) || !isFinite(y)) {
          started = false;
          continue;
        }
        const px = sx(x);
        const py = sy(y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);

    /* Marcador de estado actual */
    if (spec.marker && isFinite(spec.marker.x) && isFinite(spec.marker.y)) {
      const mx = sx(spec.marker.x);
      const my = sy(spec.marker.y);

      ctx.strokeStyle = tc.muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(mx, pad.t);
      ctx.lineTo(mx, pad.t + ph);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = spec.marker.color || tc.accent;
      ctx.strokeStyle = tc.bg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    /* Etiqueta eje X */
    if (spec.xLabel) {
      ctx.fillStyle = tc.muted;
      ctx.font = '10px "IBM Plex Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(spec.xLabel, pad.l + pw, h - 1);
    }

    /* Leyenda superior discreta */
    if (series.length > 0) {
      let lx = pad.l;
      ctx.font = '10px "IBM Plex Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      series.forEach((s) => {
        if (!s.label) return;
        ctx.strokeStyle = s.color || tc.accent;
        ctx.lineWidth = 2;
        ctx.setLineDash(s.dashed ? [3, 2] : []);
        ctx.beginPath();
        ctx.moveTo(lx, 9);
        ctx.lineTo(lx + 14, 9);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = tc.ink;
        ctx.fillText(s.label, lx + 18, 9);
        lx += 24 + ctx.measureText(s.label).width;
      });
    }
  }

  function drawBalanceChart(ctx, w, h, spec, tc) {
    const pad = { l: 74, r: 16, t: 16, b: 22 };
    const pw = Math.max(10, w - pad.l - pad.r);
    const ph = Math.max(10, h - pad.t - pad.b);
    const bars = spec.bars || [];
    const maxAbs = Math.max(
      1e-6,
      ...bars.map((b) => Math.abs(b.val || 0))
    ) * 1.15;

    const sx = (v) => pad.l + ((v + maxAbs) / (2 * maxAbs)) * pw;
    const x0 = Math.round(sx(0)) + 0.5;

    ctx.strokeStyle = tc.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l + 0.5, pad.t + 0.5, pw, ph);

    ctx.strokeStyle = tc.axis;
    ctx.beginPath();
    ctx.moveTo(x0, pad.t);
    ctx.lineTo(x0, pad.t + ph);
    ctx.stroke();

    const rowH = ph / Math.max(1, bars.length);
    const barH = Math.min(18, rowH * 0.52);

    bars.forEach((b, idx) => {
      const cy = pad.t + (idx + 0.5) * rowH;
      const xVal = sx(b.val || 0);
      const bx = Math.min(x0, xVal);
      const bw = Math.max(2, Math.abs(xVal - x0));

      ctx.fillStyle = b.color || tc.accent;
      ctx.fillRect(bx, cy - barH / 2, bw, barH);

      ctx.font = '11px "IBM Plex Sans", sans-serif';
      ctx.fillStyle = tc.ink;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, pad.l - 8, cy);

      ctx.font = '10px "IBM Plex Mono", Consolas, monospace';
      ctx.fillStyle = tc.muted;
      ctx.textAlign = (b.val || 0) >= 0 ? 'left' : 'right';
      const txtX = (b.val || 0) >= 0 ? bx + bw + 5 : bx - 5;
      ctx.fillText(b.text || fmtTick(b.val || 0), Math.max(pad.l + 4, Math.min(pad.l + pw - 4, txtX)), cy);
    });

    ctx.font = '10px "IBM Plex Mono", Consolas, monospace';
    ctx.fillStyle = tc.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('0', x0, pad.t + ph + 4);
    ctx.textAlign = 'left';
    ctx.fillText(`-${fmtTick(maxAbs)}`, pad.l, pad.t + ph + 4);
    ctx.textAlign = 'right';
    ctx.fillText(`+${fmtTick(maxAbs)} ${spec.unit || ''}`, pad.l + pw, pad.t + ph + 4);
  }

  function render(mod) {
    const sec = $('sec-plot');
    const canvas = $('plot-canvas');
    const titleEl = $('plot-title');
    const metaEl = $('plot-meta');
    if (!sec || !canvas) return;

    if (!mod || typeof mod.getPlotData !== 'function') {
      sec.hidden = true;
      lastSpec = null;
      return;
    }

    const spec = mod.getPlotData();
    if (!spec) {
      sec.hidden = true;
      lastSpec = null;
      return;
    }

    sec.hidden = false;
    lastSpec = spec;
    if (titleEl) titleEl.textContent = spec.title || 'Perfil 2D';
    if (metaEl) metaEl.textContent = spec.yUnit || spec.unit || '';

    const ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    if (!ctx) return;

    const cssW = canvas.clientWidth || 344;
    const cssH = canvas.clientHeight || 152;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const tc = getThemeColors();
    ctx.fillStyle = tc.bg;
    ctx.fillRect(0, 0, cssW, cssH);

    if (spec.kind === 'balance') {
      drawBalanceChart(ctx, cssW, cssH, spec, tc);
    } else {
      drawLineChart(ctx, cssW, cssH, spec, tc);
    }
    ctx.restore();
  }

  function getLastSpec() {
    return lastSpec;
  }

  /* Redibujar con nitidez HiDPI al cambiar el ancho del panel o la ventana */
  if (typeof ResizeObserver === 'function') {
    const plotCanvas = $('plot-canvas');
    if (plotCanvas) {
      let plotResizeTimer = null;
      new ResizeObserver(() => {
        if (!Sim.activeMod || !lastSpec) return;
        clearTimeout(plotResizeTimer);
        plotResizeTimer = setTimeout(() => {
          if (Sim.activeMod) render(Sim.activeMod);
        }, 50);
      }).observe(plotCanvas);
    }
  }

  Sim.plot = { render, getLastSpec };
})();
