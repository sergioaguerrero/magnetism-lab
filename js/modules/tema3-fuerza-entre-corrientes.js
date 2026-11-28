/* ===== Tema 3: Fuerza magnética entre elementos de corriente ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gC = new THREE.Group();
  scene.add(gC);

  const refGrp = new THREE.Group();
  const staticGrp = new THREE.Group();
  const carrierGrp = new THREE.Group();
  gC.add(refGrp, staticGrp, carrierGrp);

  function rebuildRef() {
    Sim.scene.clearGroup(refGrp);
    refGrp.add(Sim.viz.createGrid({ size: 22, majorStep: 4, minorStep: 2, plane: 'xz' }));
    refGrp.add(Sim.viz.createAxes(10, { tickStep: 2, unitLabel: '1 div = 2 cm' }));
  }
  rebuildRef();

  const SC = {
    dir: 'mismo',
    I1: 8,
    I2: 8,
    d: 6,
    dl: 3,
    y0: 0
  };

  const cfgC = [
    {
      k: 'dir',
      t: 'Sentido relativo',
      opts: {
        'Paralelas (atracción)': 'mismo',
        'Antiparalelas (repulsión)': 'opuesto'
      }
    },
    { k: 'I1', t: 'Corriente $I_1$', u: 'A', min: 0.5, max: 20, step: 0.5 },
    { k: 'I2', t: 'Corriente $I_2$', u: 'A', min: 0.5, max: 20, step: 0.5 },
    { k: 'd', t: 'Separación $d$', u: 'cm', min: 2, max: 14, step: 0.5 },
    { k: 'dl', t: 'Segmento $\\Delta l$', u: 'cm', min: 1, max: 8, step: 0.5 },
    { k: 'y0', t: 'Altura $y_0$', u: 'cm', min: -6, max: 6, step: 0.5 }
  ];

  const WIRE_LEN = 20;
  const carriers1 = [];
  const carriers2 = [];
  const N_CARRIERS = 9;

  const matC1 = new THREE.MeshStandardMaterial({ color: 0xe6c792, roughness: 0.35, metalness: 0.15 });
  const matC2 = new THREE.MeshStandardMaterial({ color: 0xb7d5e8, roughness: 0.35, metalness: 0.15 });
  const sphGeo = new THREE.SphereGeometry(0.22, 12, 10);

  for (let i = 0; i < N_CARRIERS; i++) {
    const m1 = new THREE.Mesh(sphGeo, matC1);
    const m2 = new THREE.Mesh(sphGeo, matC2);
    carrierGrp.add(m1, m2);
    carriers1.push(m1);
    carriers2.push(m2);
  }

  let phase1 = 0;
  let phase2 = 0;

  function calcB1Numerical(p, x1, I1) {
    const N = 400;
    const YMAX = 200;
    const dy = (2 * YMAX) / N;
    let bx = 0;
    let bz = 0;
    for (let i = 0; i < N; i++) {
      const ym = -YMAX + (i + 0.5) * dy;
      const rx = p.x - x1;
      const ry = p.y - ym;
      const rz = p.z;
      const r2 = rx * rx + ry * ry + rz * rz + 1e-6;
      const k = 1 / (r2 * Math.sqrt(r2));
      bx += dy * rz * k;
      bz += -dy * rx * k;
    }
    const c = ((MU0 * I1) / (4 * Math.PI)) * 1e4;
    return V(bx * c, 0, bz * c);
  }

  function calcSegmentForceNumerical(x1, x2, I1, I2, s2, y0, dl) {
    const M = 10;
    const step = dl / M;
    const F = V(0, 0, 0);
    for (let j = 0; j < M; j++) {
      const y = y0 - dl / 2 + (j + 0.5) * step;
      const B1 = calcB1Numerical(V(x2, y, 0), x1, I1);
      const dlVec = V(0, s2 * step * 1e-2, 0);
      F.add(dlVec.cross(B1).multiplyScalar(I2));
    }
    return F;
  }

  function buildCircleRing(cx, y, radius, color, ccwFromTop) {
    const grp = new THREE.Group();
    const pts = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const a = (2 * Math.PI * i) / N;
      pts.push(V(cx + radius * Math.cos(a), y, -radius * Math.sin(a)));
    }
    grp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.48 })
      )
    );
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((a) => {
      const pos = V(cx + radius * Math.cos(a), y, -radius * Math.sin(a));
      const dir = V(-Math.sin(a), 0, -Math.cos(a))
        .multiplyScalar(ccwFromTop ? 1 : -1)
        .normalize();
      grp.add(Sim.viz.createVector(dir, pos, 0.95, color, { radius: 0.032, headLength: 0.35, headRadius: 0.11 }));
    });
    return grp;
  }

  function updateCarriers() {
    const x1 = -SC.d / 2;
    const x2 = SC.d / 2;
    const s2 = SC.dir === 'mismo' ? 1 : -1;

    for (let i = 0; i < N_CARRIERS; i++) {
      const f1 = (((i / N_CARRIERS + phase1) % 1) + 1) % 1;
      const f2 = (((i / N_CARRIERS + phase2 * s2) % 1) + 1) % 1;
      carriers1[i].position.set(x1, -WIRE_LEN / 2 + f1 * WIRE_LEN, 0);
      carriers2[i].position.set(x2, -WIRE_LEN / 2 + f2 * WIRE_LEN, 0);
    }
  }

  function onC() {
    Sim.scene.clearGroup(staticGrp);
    const pal = Sim.scene.getPalette();

    const d = SC.d;
    const x1 = -d / 2;
    const x2 = d / 2;
    const s2 = SC.dir === 'mismo' ? 1 : -1;
    const y0 = SC.y0;
    const dl = SC.dl;

    const wireGeo = new THREE.CylinderGeometry(0.15, 0.15, WIRE_LEN, 20);
    const w1 = new THREE.Mesh(
      wireGeo,
      new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.42, metalness: 0.22 })
    );
    w1.position.set(x1, 0, 0);

    const w2 = new THREE.Mesh(
      wireGeo,
      new THREE.MeshStandardMaterial({ color: pal.v, roughness: 0.42, metalness: 0.22 })
    );
    w2.position.set(x2, 0, 0);
    staticGrp.add(w1, w2);

    const segGeo = new THREE.CylinderGeometry(0.25, 0.25, dl, 24);
    const segMat = new THREE.MeshStandardMaterial({
      color: pal.mu,
      roughness: 0.42,
      metalness: 0.16
    });
    const seg1 = new THREE.Mesh(segGeo, segMat);
    seg1.position.set(x1, y0, 0);
    const seg2 = new THREE.Mesh(segGeo, segMat);
    seg2.position.set(x2, y0, 0);
    staticGrp.add(seg1, seg2);

    [-5, y0, 5].forEach((yy) => {
      staticGrp.add(buildCircleRing(x1, yy, d, pal.B, true));
    });
    staticGrp.add(buildCircleRing(x2, y0, d, pal.BAlt, s2 > 0));

    const p1 = V(x1, y0, 0);
    const p2 = V(x2, y0, 0);

    const B1_ana = (MU0 * SC.I1) / (2 * Math.PI * (d * 1e-2));
    const B2_ana = (MU0 * SC.I2) / (2 * Math.PI * (d * 1e-2));
    const F_per_L_ana = (MU0 * SC.I1 * SC.I2) / (2 * Math.PI * (d * 1e-2));

    const bLen1 = Math.min(4.2, Math.max(1.6, 1.3 + Math.log10(B1_ana * 1e6 + 1) * 0.85));
    const bLen2 = Math.min(4.2, Math.max(1.6, 1.3 + Math.log10(B2_ana * 1e6 + 1) * 0.85));
    const fLen = Math.min(
      Math.max(1.5, d * 0.42),
      Math.max(1.6, 1.1 + Math.log10(F_per_L_ana * 1e6 + 1) * 0.9)
    );

    staticGrp.add(Sim.viz.createVector(V(0, 1, 0), p1, Math.max(2.2, dl * 0.65), pal.I, { radius: 0.072, label: 'I₁' }));
    staticGrp.add(Sim.viz.createVector(V(0, s2, 0), p2, Math.max(2.2, dl * 0.65), pal.v, { radius: 0.072, label: 'I₂' }));

    staticGrp.add(Sim.viz.createVector(V(0, 0, -1), p2, bLen1, pal.B, { radius: 0.068, label: 'B₁' }));
    staticGrp.add(Sim.viz.createVector(V(0, 0, s2), p1, bLen2, pal.B, { radius: 0.068, label: 'B₂' }));

    staticGrp.add(Sim.viz.createVector(V(-s2, 0, 0), p2, fLen, pal.F, { radius: 0.084, label: 'F₁→₂' }));
    staticGrp.add(Sim.viz.createVector(V(s2, 0, 0), p1, fLen, pal.F, { radius: 0.084, label: 'F₂→₁' }));

    staticGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([V(x1, -9, 0), V(x2, -9, 0)]),
        new THREE.LineBasicMaterial({ color: pal.axisLine })
      )
    );
    const dLbl = Sim.viz.createLabel(`d = ${d} cm`, { color: pal.labelInk, worldHeight: 0.55 });
    if (dLbl) {
      dLbl.position.set(0, -9.65, 0);
      staticGrp.add(dLbl);
    }

    updateCarriers();

    const dF_numVec = calcSegmentForceNumerical(x1, x2, SC.I1, SC.I2, s2, y0, dl);
    const dF_num = dF_numVec.length();
    const dF_ana = F_per_L_ana * (dl * 1e-2);
    const errRel = dF_ana > 0 ? (Math.abs(dF_num - dF_ana) / dF_ana) * 100 : 0;

    ro([
      ['Fuerza por longitud $F/L$', fm(F_per_L_ana * 1e6), 'μN/m', { primary: true }],
      ['Fuerza en segmento $\\Delta F$', fm(dF_ana * 1e6), 'μN', { primary: true }],
      ['Interacción', s2 > 0 ? 'Atracción (paralelas)' : 'Repulsión (antiparalelas)'],
      ['Campo $|\\vec{B}_1|$ en hilo 2', fm(B1_ana * 1e6), 'μT'],
      ['Campo $|\\vec{B}_2|$ en hilo 1', fm(B2_ana * 1e6), 'μT'],
      ['Integración numérica $\\Delta F$', fm(dF_num * 1e6), 'μN'],
      ['Error relativo', fm(errRel), '%']
    ]);
  }

  Sim.registerModule({
    id: 'fuerza-corrientes',
    title: '3 · Fuerza entre elementos de corriente',
    group: gC,
    canPause: true,
    cameraPos: [13, 10, 21],
    state: SC,
    getPlotData() {
      const c = Sim.scene.getPalette().css;
      const pts = [];
      for (let d = 2; d <= 14; d += 0.3) {
        const fL = ((MU0 * SC.I1 * SC.I2) / (2 * Math.PI * (d * 1e-2))) * 1e6;
        pts.push([+d.toFixed(2), fL]);
      }
      const curFL = ((MU0 * SC.I1 * SC.I2) / (2 * Math.PI * (SC.d * 1e-2))) * 1e6;
      return {
        title: 'Fuerza por longitud F/L(d)',
        xLabel: 'd (cm)',
        yUnit: 'μN/m',
        xMin: 2,
        xMax: 14,
        yMin: 0,
        series: [{ label: 'F/L ∝ 1/d', color: c.F, pts }],
        marker: { x: SC.d, y: curFL, color: c.F }
      };
    },
    theory:
      '<p>Cada conductor se halla inmerso en el campo magnético producido por el otro, experimentando la fuerza de Laplace:</p>' +
      '$$d\\vec{F}_{1\\to 2} = I_2\\,d\\vec{l}_2 \\times \\vec{B}_1, \\qquad \\frac{F}{L} = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d}$$' +
      '<p>Las corrientes paralelas se atraen y las antiparalelas se repelen, cumpliendo en todo momento la tercera ley de Newton ($\\vec{F}_{1\\to 2} = -\\vec{F}_{2\\to 1}$).</p>',
    activate() {
      build(cfgC, SC, onC);
      onC();
    },
    reset() {
      phase1 = 0;
      phase2 = 0;
      onC();
    },
    onThemeChange() {
      rebuildRef();
      onC();
    },
    update(paused, _fr, dt) {
      if (!paused) {
        const step = Math.min(dt || 1 / 60, 0.05);
        phase1 = (phase1 + 0.072 * SC.I1 * step) % 1;
        phase2 = (phase2 + 0.072 * SC.I2 * step) % 1;
        updateCarriers();
      }
    }
  });
})();
