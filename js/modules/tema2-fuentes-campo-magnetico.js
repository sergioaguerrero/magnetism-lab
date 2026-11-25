/* ===== Módulo 2 (RF-07 + B-08): Fuentes de campo magnético (Biot-Savart, elemento dl y carga en movimiento) ===== */
(function () {
  const gB = new THREE.Group();
  scene.add(gB);

  gB.add(new THREE.AxesHelper(14));

  const gr = new THREE.GridHelper(24, 12);
  gr.rotation.x = Math.PI / 2;
  gB.add(gr);

  const cond = new THREE.Group();
  const lines = new THREE.Group();
  gB.add(cond, lines);

  const arrows = [];
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const a = new THREE.ArrowHelper(V(0, 1, 0), V(2 * i, 2 * j, 0), 1.5, 0xffffff, 0.6, 0.4);
      arrows.push(a);
      gB.add(a);
    }
  }

  const probe = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe879f9 })
  );
  const pA = new THREE.ArrowHelper(V(0, 1, 0), V(), 4, 0xe879f9, 1, 0.6);
  gB.add(probe, pA);

  const SB = { geo: 'hilo', I: 5, R: 5, N: 10, L: 15, px: 6, py: 0 };
  const cfgB = [
    {
      k: 'geo',
      t: 'Fuente de campo magnético',
      opts: {
        'Hilo recto largo': 'hilo',
        'Espira circular': 'espira',
        'Bobinas de Helmholtz': 'helmholtz',
        'Solenoide': 'solenoide',
        'Elemento diferencial I·dl': 'elemento_dl',
        'Carga en movimiento (q·v)': 'carga_mov'
      },
      onSelect(val) {
        if (val === 'hilo' || val === 'elemento_dl' || val === 'carga_mov') {
          if (Math.abs(SB.px) < 0.5) SB.px = 6;
        } else {
          SB.px = 0;
          SB.py = 0;
        }
      }
    },
    { k: 'I', t: 'Corriente $I$ (o $q\\cdot v$ equiv.)', u: 'A', min: 0.1, max: 20, step: 0.1 },
    {
      k: 'R',
      t: 'Radio $R$',
      u: 'cm',
      min: 1,
      max: 10,
      step: 0.5,
      show: () => SB.geo === 'espira' || SB.geo === 'helmholtz' || SB.geo === 'solenoide'
    },
    { k: 'N', t: 'Número de vueltas $N$', u: '', min: 2, max: 30, step: 1, show: () => SB.geo === 'solenoide' },
    { k: 'L', t: 'Longitud $L$', u: 'cm', min: 4, max: 30, step: 1, show: () => SB.geo === 'solenoide' },
    { k: 'px', t: 'Punto de medida $x$', u: 'cm', min: -12, max: 12, step: 0.5 },
    { k: 'py', t: 'Punto de medida $y$', u: 'cm', min: -12, max: 12, step: 0.5 }
  ];

  let SG = { m: [], d: [] };

  const path = (f, n) => {
    const a = [];
    for (let i = 0; i <= n; i++) a.push(f(i / n));
    return a;
  };

  function geoPaths() {
    const R = SB.R;
    const g = SB.geo;
    const out = [];
    const lp = (y) => path((t) => V(R * Math.cos(2 * Math.PI * t), y, -R * Math.sin(2 * Math.PI * t)), 120);

    if (g === 'hilo') out.push(path((t) => V(0, -120 + 240 * t, 0), 240));
    if (g === 'espira') out.push(lp(0));
    if (g === 'helmholtz') out.push(lp(-R / 2), lp(R / 2));
    if (g === 'solenoide') {
      out.push(
        path((t) => {
          const a = 2 * Math.PI * SB.N * t;
          return V(R * Math.cos(a), -SB.L / 2 + SB.L * t, -R * Math.sin(a));
        }, 36 * SB.N)
      );
    }
    if (g === 'elemento_dl' || g === 'carga_mov') {
      /* Elemento diferencial Δl = 1 cm centrado en el origen a lo largo de +Y (o q·v = I·Δl) */
      out.push([V(0, -0.5, 0), V(0, 0.5, 0)]);
    }
    return out;
  }

  function Bf(p) {
    let x = 0,
      y = 0,
      z = 0;
    for (let i = 0; i < SG.m.length; i++) {
      const m = SG.m[i];
      const d = SG.d[i];
      const rx = p.x - m.x;
      const ry = p.y - m.y;
      const rz = p.z - m.z;
      const r2 = rx * rx + ry * ry + rz * rz;
      if (r2 < 1e-4) return V(0, 0, 0);
      const r2s = r2 + 1e-4;
      const k = 1 / (r2s * Math.sqrt(r2s));
      x += (d.y * rz - d.z * ry) * k;
      y += (d.z * rx - d.x * rz) * k;
      z += (d.x * ry - d.y * rx) * k;
    }
    /* cm→m: factor 1e4; resultado en tesla */
    const c = ((MU0 * SB.I) / (4 * Math.PI)) * 1e4;
    return V(x * c, y * c, z * c);
  }

  function ana(p) {
    const I = SB.I;
    const R = SB.R * 1e-2;
    const g = SB.geo;
    const y = p.y * 1e-2;
    const d = Math.abs(p.x) * 1e-2;
    const ax = Math.abs(p.x) < 0.05;
    const lp = (yy) => (MU0 * I * R * R) / (2 * Math.pow(R * R + yy * yy, 1.5));

    if (g === 'hilo') return d > 0.003 ? (MU0 * I) / (2 * Math.PI * d) : null;
    if (g === 'espira') return ax ? lp(y) : null;
    if (g === 'helmholtz') return ax ? lp(y - R / 2) + lp(y + R / 2) : null;
    if (g === 'elemento_dl' || g === 'carga_mov') {
      const r = Math.hypot(d, y);
      if (r < 0.005) return null;
      const sinTh = d / r;
      const dlMeters = 0.01; // Δl = 1 cm = 0.01 m (o q·v = I · 0.01 C·m/s)
      return ((MU0 / (4 * Math.PI)) * (I * dlMeters * sinTh)) / (r * r);
    }
    return Math.abs(p.x) < SB.R * 0.7 && Math.abs(p.y) < SB.L * 0.3
      ? (MU0 * SB.N * I) / (SB.L * 1e-2)
      : null;
  }

  function anaHint() {
    if (SB.geo === 'hilo' || SB.geo === 'elemento_dl' || SB.geo === 'carga_mov') {
      return '— (sobre la fuente, r = 0)';
    }
    if (SB.geo === 'espira' || SB.geo === 'helmholtz') return '— (válido en el eje x = 0)';
    return '— (válido en región central)';
  }

  function onB() {
    cond.clear();
    lines.clear();
    SG = { m: [], d: [] };

    geoPaths().forEach((pts) => {
      cond.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xf59e0b })
        )
      );
      if (pts.length > 2) {
        const k = Math.floor(pts.length * 0.25);
        cond.add(
          new THREE.ArrowHelper(pts[k + 1].clone().sub(pts[k]).normalize(), pts[k], 2.5, 0xf59e0b, 1, 0.7)
        );
      }
      for (let i = 0; i < pts.length - 1; i++) {
        SG.m.push(pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5));
        SG.d.push(pts[i + 1].clone().sub(pts[i]));
      }
    });

    const pp = V(SB.px, SB.py, 0);

    /* Representación 3D especial para Elemento diferencial I·dl y Carga en movimiento q·v */
    if (SB.geo === 'elemento_dl') {
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 1.8, 20),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.4 })
      );
      cond.add(cyl);
      cond.add(new THREE.ArrowHelper(V(0, 1, 0), V(0, 0, 0), 3.6, 0xf59e0b, 0.9, 0.55));
      /* Vector posición r desde el elemento dl hasta la sonda */
      cond.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), pp]),
          new THREE.LineBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.65 })
        )
      );
    } else if (SB.geo === 'carga_mov') {
      const qMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 24, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.4 })
      );
      cond.add(qMesh);
      /* Vector velocidad v de la carga puntual (azul claro, eje +Y) */
      cond.add(new THREE.ArrowHelper(V(0, 1, 0), V(0, 0, 0), 3.8, 0x38bdf8, 0.9, 0.55));
      /* Vector posición r desde la carga hasta la sonda */
      cond.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), pp]),
          new THREE.LineBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.65 })
        )
      );
    }

    const bs = arrows.map((a) => Bf(a.position));
    const ms = bs.map((b) => b.length());
    const sr = [...ms].sort((a, b) => a - b);
    const ref = sr[Math.floor(0.95 * sr.length)] || 1;

    arrows.forEach((a, i) => {
      if (ms[i] < 1e-12) {
        a.visible = false;
        return;
      }
      a.visible = true;
      const t = Math.min(1, Math.max(0, (Math.log10(ms[i] / ref + 1e-12) + 2) / 2.3));
      a.setDirection(bs[i].clone().divideScalar(ms[i]));
      a.setColor(new THREE.Color().setHSL((1 - t) * 0.67, 1, 0.5));
      a.setLength(1.5, 0.6, 0.4);
    });

    [-9, -6, -3, -1.5, 1.5, 3, 6, 9].forEach((x) =>
      [1, -1].forEach((dir) => {
        const s0 = V(x, 0, 0);
        const pts = [s0.clone()];
        let p = s0.clone();
        for (let k = 0; k < 300; k++) {
          const b1 = Bf(p);
          if (b1.length() < 1e-12) break;
          b1.normalize().multiplyScalar(0.6 * dir);
          const bMid = Bf(p.clone().addScaledVector(b1, 0.5));
          if (bMid.length() < 1e-12) break;
          const b2 = bMid.normalize().multiplyScalar(0.6 * dir);
          p = p.clone().add(b2);
          if (p.length() > 22) break;
          pts.push(p);
          if (k > 10 && p.distanceTo(s0) < 0.5) break;
        }
        if (pts.length > 1) {
          lines.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts),
              new THREE.LineBasicMaterial({ color: 0x22c55e })
            )
          );
        }
      })
    );

    const b = Bf(pp);
    const m = b.length();
    probe.position.copy(pp);
    pA.visible = m > 1e-12;
    if (pA.visible) {
      pA.position.copy(pp);
      pA.setDirection(b.clone().divideScalar(m));
    }

    const a = ana(pp);
    const rows = [
      ['$|\\vec{B}|$ numérico ($\\sum \\Delta\\vec{B}_i$)', fm(m * 1e6) + ' μT'],
      ['Componentes $B_x, B_y, B_z$', [b.x, b.y, b.z].map((x) => fm(x * 1e6)).join(' · ') + ' μT'],
      ['$|\\vec{B}|$ analítico exacto', a == null ? anaHint() : fm(a * 1e6) + ' μT'],
      ['Error relativo', a == null || a === 0 ? '—' : fm((Math.abs(m - a) / a) * 100) + ' %']
    ];
    if (SB.geo === 'carga_mov') {
      rows.unshift(['Fuente $q\\vec{v}$ equiv.', fm(SB.I * 0.01) + ' C·m/s (+Y)']);
    } else if (SB.geo === 'elemento_dl') {
      rows.unshift(['Elemento $I\\,\\Delta l$', fm(SB.I * 0.01) + ' A·m (+Y)']);
    }
    ro(rows);
  }

  Sim.registerModule({
    id: 'B',
    title: '2 · Fuentes de campo magnético',
    group: gB,
    canPause: false,
    cameraPos: [14, 10, 30],
    state: SB,
    theory:
      '<b>Ley de Biot-Savart y fuentes de campo magnético:</b>' +
      '$$d\\vec{B} = \\frac{\\mu_0}{4\\pi}\\,\\frac{I\\,d\\vec{l} \\times \\hat{r}}{r^2}, \\qquad \\vec{B}_q = \\frac{\\mu_0}{4\\pi}\\,\\frac{q\\,\\vec{v} \\times \\hat{r}}{r^2}$$' +
      '$$B_{\\text{hilo}} = \\frac{\\mu_0 I}{2\\pi d}, \\quad B_{\\text{espira}} = \\frac{\\mu_0 I R^2}{2(R^2+y^2)^{3/2}}, \\quad B_{\\text{sol}} = \\frac{\\mu_0 N I}{L}$$' +
      '<ul class="th-list">' +
      '<li><b>Conductor (naranja):</b> Dividido en segmentos diferenciales $d\\vec{l}$ en el sentido de $I$.</li>' +
      '<li><b>Líneas de campo (verdes):</b> Curvas cerradas tangentes al vector $\\vec{B}$ en cada punto.</li>' +
      '<li><b>Sonda de medida (rosa):</b> Evalúa $\\vec{B}(x,y,0)$ y lo compara con la solución analítica.</li>' +
      '</ul>',
    activate() {
      build(cfgB, SB, onB);
      onB();
    },
    reset() {
      onB();
    }
  });
})();
