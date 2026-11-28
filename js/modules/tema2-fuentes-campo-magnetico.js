/* ===== Tema 2: Fuentes de campo magnético (Biot-Savart, elemento dl y carga en movimiento) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gB = new THREE.Group();
  scene.add(gB);

  const refGrp = new THREE.Group();
  const cond = new THREE.Group();
  const lines = new THREE.Group();
  gB.add(refGrp, cond, lines);

  function rebuildRef() {
    Sim.scene.clearGroup(refGrp);
    refGrp.add(Sim.viz.createGrid({ size: 24, majorStep: 4, minorStep: 2, plane: 'xy' }));
    refGrp.add(Sim.viz.createAxes(12.5, { tickStep: 2, unitLabel: '1 div = 2 cm' }));
  }
  rebuildRef();

  /* Rejilla vectorial sólida pre-asignada en el plano z = 0 */
  const arrows = [];
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const a = Sim.viz.createVector(V(0, 1, 0), V(2 * i, 2 * j, 0), 1.35, 0x888888, {
        radius: 0.036,
        headLength: 0.42,
        headRadius: 0.12
      });
      arrows.push(a);
      gB.add(a);
    }
  }

  const probeMat = new THREE.MeshStandardMaterial({
    color: Sim.scene.getPalette().probe,
    roughness: 0.38,
    metalness: 0.15
  });
  const probe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), probeMat);
  const probeHandle = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 12, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  probe.add(probeHandle);
  const pA = Sim.viz.createVector(V(0, 1, 0), V(), 3.6, Sim.scene.getPalette().mu, {
    radius: 0.078,
    label: 'B(P)'
  });
  gB.add(probe, pA);

  const SB = { geo: 'hilo', I: 5, R: 5, N: 10, L: 15, px: 6, py: 0 };
  const cfgB = [
    {
      k: 'geo',
      t: 'Geometría de la fuente',
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
    { k: 'I', t: 'Corriente $I$', u: 'A', min: 0.1, max: 20, step: 0.1 },
    {
      k: 'R',
      t: 'Radio $R$',
      u: 'cm',
      min: 1,
      max: 10,
      step: 0.5,
      show: () => SB.geo === 'espira' || SB.geo === 'helmholtz' || SB.geo === 'solenoide'
    },
    { k: 'N', t: 'Vueltas $N$', u: '', min: 2, max: 30, step: 1, show: () => SB.geo === 'solenoide' },
    { k: 'L', t: 'Longitud $L$', u: 'cm', min: 4, max: 30, step: 1, show: () => SB.geo === 'solenoide' },
    { k: 'px', t: 'Sonda $x$', u: 'cm', min: -12, max: 12, step: 0.5 },
    { k: 'py', t: 'Sonda $y$', u: 'cm', min: -12, max: 12, step: 0.5 }
  ];

  let SG = { m: [], d: [] };
  let liveB = { bVec: V(), bMag: 0, bAna: null, errRel: null };

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
      out.push([V(0, -0.5, 0), V(0, 0.5, 0)]);
    }
    return out;
  }

  function Bf(p) {
    let x = 0;
    let y = 0;
    let z = 0;
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
      return ((MU0 / (4 * Math.PI)) * (I * 0.01 * sinTh)) / (r * r);
    }
    return Math.abs(p.x) < SB.R * 0.7 && Math.abs(p.y) < SB.L * 0.3
      ? (MU0 * SB.N * I) / (SB.L * 1e-2)
      : null;
  }

  function anaHint() {
    if (SB.geo === 'hilo' || SB.geo === 'elemento_dl' || SB.geo === 'carga_mov') {
      return 'Singularidad (r = 0)';
    }
    if (SB.geo === 'espira' || SB.geo === 'helmholtz') return 'Válido en x = 0';
    return 'Válido en núcleo central';
  }

  function onB() {
    Sim.scene.clearGroup(cond);
    Sim.scene.clearGroup(lines);
    const pal = Sim.scene.getPalette();
    SG = { m: [], d: [] };

    probeMat.color.setHex(pal.mu);
    pA.setColor(pal.mu);

    const wireMat = new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.4, metalness: 0.24 });

    geoPaths().forEach((pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        SG.m.push(pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5));
        SG.d.push(pts[i + 1].clone().sub(pts[i]));
      }

      if (SB.geo === 'hilo') {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 28, 16), wireMat);
        cond.add(cyl);
        cond.add(Sim.viz.createVector(V(0, 1, 0), V(0, 4.5, 0), 2.8, pal.I, { radius: 0.075, label: 'I' }));
      } else if (SB.geo === 'espira' || SB.geo === 'helmholtz') {
        const yOff = pts[0].y;
        const torus = new THREE.Mesh(new THREE.TorusGeometry(SB.R, 0.14, 14, 72), wireMat);
        torus.rotation.x = Math.PI / 2;
        torus.position.y = yOff;
        cond.add(torus);
        cond.add(
          Sim.viz.createVector(V(0, 0, -1), V(SB.R, yOff, 0), 2.2, pal.I, {
            radius: 0.065,
            label: yOff >= 0 ? 'I' : undefined
          })
        );
      } else if (SB.geo === 'solenoide') {
        cond.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: pal.I })
          )
        );
        const k = Math.floor(pts.length * 0.25);
        cond.add(
          Sim.viz.createVector(pts[k + 1].clone().sub(pts[k]).normalize(), pts[k], 2.2, pal.I, {
            radius: 0.065
          })
        );
      }
    });

    const pp = V(SB.px, SB.py, 0);

    if (SB.geo === 'elemento_dl') {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 20), wireMat);
      cond.add(cyl);
      cond.add(Sim.viz.createVector(V(0, 1, 0), V(0, 0, 0), 3.4, pal.I, { radius: 0.08, label: 'I·dl' }));
      cond.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), pp]),
          new THREE.LineBasicMaterial({ color: pal.mu, transparent: true, opacity: 0.65 })
        )
      );
    } else if (SB.geo === 'carga_mov') {
      const qMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.48, 24, 16),
        new THREE.MeshStandardMaterial({ color: pal.F, roughness: 0.4, metalness: 0.12 })
      );
      cond.add(qMesh);
      cond.add(Sim.viz.createVector(V(0, 1, 0), V(0, 0, 0), 3.5, pal.v, { radius: 0.08, label: 'q·v' }));
      cond.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), pp]),
          new THREE.LineBasicMaterial({ color: pal.mu, transparent: true, opacity: 0.65 })
        )
      );
    }

    const bs = arrows.map((a) => Bf(a.position));
    const ms = bs.map((b) => b.length());
    const sr = [...ms].sort((a, b) => a - b);
    const ref = sr[Math.floor(0.95 * sr.length)] || 1;
    const isDark = Sim.scene.isDarkTheme();
    const arrowLightness = isDark ? 0.56 : 0.42;

    arrows.forEach((a, i) => {
      if (ms[i] < 1e-12) {
        a.visible = false;
        return;
      }
      a.visible = true;
      const t = Math.min(1, Math.max(0, (Math.log10(ms[i] / ref + 1e-12) + 2) / 2.3));
      a.setDirection(bs[i].clone().divideScalar(ms[i]));
      /* Escala térmica sobria (azul acero -> ocre -> carmesí) */
      a.setColor(new THREE.Color().setHSL((1 - t) * 0.58, 0.58, arrowLightness));
      a.setLength(1.35, 0.4, 0.11);
    });

    const fieldLineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.72 });
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
          lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), fieldLineMat));
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
    const errRel = a == null || a === 0 ? null : (Math.abs(m - a) / a) * 100;
    liveB = { bVec: b, bMag: m, bAna: a, errRel };

    const rows = [
      ['$|\\vec{B}|$ numérico', fm(m * 1e6), 'μT', { primary: true }],
      ['$|\\vec{B}|$ analítico', a == null ? anaHint() : fm(a * 1e6), a == null ? '' : 'μT', { primary: true }],
      ['Error relativo', errRel == null ? '—' : fm(errRel), errRel == null ? '' : '%'],
      ['Componentes $(B_x, B_y, B_z)$', [b.x, b.y, b.z].map((x) => fm(x * 1e6)).join(', '), 'μT']
    ];
    if (SB.geo === 'carga_mov') {
      rows.push(['Momento $q\\vec{v}$ (+Y)', fm(SB.I * 0.01), 'C·m/s']);
    } else if (SB.geo === 'elemento_dl') {
      rows.push(['Elemento $I\\,\\Delta l$ (+Y)', fm(SB.I * 0.01), 'A·m']);
    }
    ro(rows);
  }

  Sim.registerModule({
    id: 'fuentes-campo',
    title: '2 · Fuentes de campo magnético',
    group: gB,
    canPause: false,
    cameraPos: [14, 10, 28],
    state: SB,
    getLive() {
      return liveB;
    },
    getDragTarget() {
      return {
        object: probeHandle,
        hint: 'Arrastra la sonda en el plano XY',
        getPos: () => V(SB.px, SB.py, 0),
        setPos: (x, y) => {
          SB.px = x;
          SB.py = y;
          onB();
        },
        bounds: { minX: -12, maxX: 12, minY: -12, maxY: 12, step: 0.5 }
      };
    },
    getPlotData() {
      const c = Sim.scene.getPalette().css;
      const isAxial = SB.geo === 'espira' || SB.geo === 'helmholtz' || SB.geo === 'solenoide';
      const numPts = [];
      const anaPts = [];

      if (isAxial) {
        for (let y = -12; y <= 12; y += 0.5) {
          const p = V(0, y, 0);
          const bn = Bf(p).y * 1e6;
          const ba = ana(p);
          numPts.push([y, bn]);
          anaPts.push([y, ba != null ? ba * 1e6 : NaN]);
        }
        const onAxis = Math.abs(SB.px) < 0.05;
        const curY = Bf(V(0, SB.py, 0)).y * 1e6;
        return {
          title: onAxis ? 'Perfil axial B_y(y) en x = 0' : 'Perfil axial B_y(y) en x = 0 (sonda fuera del eje)',
          xLabel: 'y (cm)',
          yUnit: 'μT',
          xMin: -12,
          xMax: 12,
          yMin: 0,
          series: [
            { label: 'Biot-Savart', color: c.B, pts: numPts },
            { label: 'Analítico', color: c.I, pts: anaPts, dashed: true }
          ],
          marker: onAxis ? { x: SB.py, y: curY, color: c.mu } : null
        };
      }

      for (let x = -12; x <= 12; x += 0.4) {
        if (Math.abs(x) < 1.2) {
          numPts.push([+x.toFixed(2), NaN]);
          anaPts.push([+x.toFixed(2), NaN]);
          continue;
        }
        const p = V(x, SB.py, 0);
        const bn = Bf(p).length() * 1e6;
        const ba = ana(p);
        numPts.push([+x.toFixed(2), bn]);
        anaPts.push([+x.toFixed(2), ba != null ? ba * 1e6 : NaN]);
      }
      return {
        title: `Perfil |B(x)| en y = ${SB.py} cm`,
        xLabel: 'x (cm)',
        yUnit: 'μT',
        xMin: -12,
        xMax: 12,
        yMin: 0,
        series: [
          { label: 'Biot-Savart', color: c.B, pts: numPts },
          { label: 'Analítico', color: c.I, pts: anaPts, dashed: true }
        ],
        marker: Math.abs(SB.px) >= 1.2 ? { x: SB.px, y: liveB.bMag * 1e6, color: c.mu } : null
      };
    },
    theory:
      '<p>Cada elemento diferencial de corriente $I\\,d\\vec{l}$ (o una carga en movimiento $q\\vec{v}$) contribuye al campo magnético según la ley de Biot-Savart:</p>' +
      Sim.refs.eq('d\\vec{B} = \\frac{\\mu_0}{4\\pi}\\,\\frac{I\\,d\\vec{l} \\times \\hat{r}}{r^2}, \\qquad \\vec{B}_q = \\frac{\\mu_0}{4\\pi}\\,\\frac{q\\,\\vec{v} \\times \\hat{r}}{r^2}', [
        ['YF', '§28.1–28.2'],
        ['GR', '§5.2.1']
      ]) +
      '<p>Para geometrías con simetría conocida se obtienen soluciones analíticas cerradas:</p>' +
      Sim.refs.eq('B_{\\text{hilo}} = \\frac{\\mu_0 I}{2\\pi d}, \\quad B_{\\text{espira}} = \\frac{\\mu_0 I R^2}{2(R^2+y^2)^{3/2}}, \\quad B_{\\text{sol}} = \\frac{\\mu_0 N I}{L}', [
        ['YF', '§28.3, §28.5, §28.7'],
        ['SJ', '§30.1, §30.4']
      ]),
    activate() {
      build(cfgB, SB, onB);
      onB();
    },
    reset() {
      onB();
    },
    onThemeChange() {
      rebuildRef();
      onB();
    }
  });
})();
