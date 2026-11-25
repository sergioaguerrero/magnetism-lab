/* ===== Módulo 3 (B-02): Fuerza magnética entre elementos de corriente ===== */
(function () {
  const gC = new THREE.Group();
  scene.add(gC);

  gC.add(new THREE.AxesHelper(10));

  const grid = new THREE.GridHelper(24, 12);
  gC.add(grid);

  const staticGrp = new THREE.Group();
  const carrierGrp = new THREE.Group();
  gC.add(staticGrp, carrierGrp);

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
      t: 'Sentido de las corrientes',
      opts: {
        'Mismo sentido (atracción)': 'mismo',
        'Sentidos opuestos (repulsión)': 'opuesto'
      }
    },
    { k: 'I1', t: 'Corriente conductor 1 ($I_1$)', u: 'A', min: 0.5, max: 20, step: 0.5 },
    { k: 'I2', t: 'Corriente conductor 2 ($I_2$)', u: 'A', min: 0.5, max: 20, step: 0.5 },
    { k: 'd', t: 'Separación entre hilos ($d$)', u: 'cm', min: 2, max: 14, step: 0.5 },
    { k: 'dl', t: 'Longitud del segmento ($\\Delta l$)', u: 'cm', min: 1, max: 8, step: 0.5 },
    { k: 'y0', t: 'Posición vertical segmento ($y_0$)', u: 'cm', min: -6, max: 6, step: 0.5 }
  ];

  const WIRE_LEN = 20; // Longitud visual en cm (-10 a +10)
  const carriers1 = [];
  const carriers2 = [];
  const N_CARRIERS = 9;

  const matC1 = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xd97706 });
  const matC2 = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x0284c7 });
  const sphGeo = new THREE.SphereGeometry(0.24, 12, 10);

  for (let i = 0; i < N_CARRIERS; i++) {
    const m1 = new THREE.Mesh(sphGeo, matC1);
    const m2 = new THREE.Mesh(sphGeo, matC2);
    carrierGrp.add(m1, m2);
    carriers1.push(m1);
    carriers2.push(m2);
  }

  let phase1 = 0;
  let phase2 = 0;

  /* Cálculo numérico de B1(p) por Biot-Savart sobre un hilo 1 largo (-200 cm a +200 cm) */
  function calcB1Numerical(p, x1, I1) {
    const N = 400;
    const YMAX = 200;
    const dy = (2 * YMAX) / N;
    let bx = 0,
      by = 0,
      bz = 0;
    for (let i = 0; i < N; i++) {
      const ym = -YMAX + (i + 0.5) * dy;
      const rx = p.x - x1;
      const ry = p.y - ym;
      const rz = p.z;
      const r2 = rx * rx + ry * ry + rz * rz + 1e-6;
      const k = 1 / (r2 * Math.sqrt(r2));
      /* dl1 = (0, dy, 0) => dl1 × r = (dy*rz, 0, -dy*rx) */
      bx += dy * rz * k;
      bz += -dy * rx * k;
    }
    const c = ((MU0 * I1) / (4 * Math.PI)) * 1e4; // cm -> m (1e4), resultado en Tesla
    return V(bx * c, by * c, bz * c);
  }

  /* Fuerza numérica integrando dF2 = I2 * dl2 × B1(p) sobre el segmento Δl */
  function calcSegmentForceNumerical(x1, x2, I1, I2, s2, y0, dl) {
    const M = 10;
    const step = dl / M;
    const F = V(0, 0, 0);
    for (let j = 0; j < M; j++) {
      const y = y0 - dl / 2 + (j + 0.5) * step;
      const B1 = calcB1Numerical(V(x2, y, 0), x1, I1);
      const dlVec = V(0, s2 * step * 1e-2, 0); // en metros
      const dF = dlVec.cross(B1).multiplyScalar(I2);
      F.add(dF);
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
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
      )
    );
    /* Flechas tangenciales indicando el sentido de B según la regla de la mano derecha */
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((a) => {
      const pos = V(cx + radius * Math.cos(a), y, -radius * Math.sin(a));
      const dir = V(-Math.sin(a), 0, -Math.cos(a)).multiplyScalar(ccwFromTop ? 1 : -1).normalize();
      grp.add(new THREE.ArrowHelper(dir, pos, 1.1, color, 0.45, 0.3));
    });
    return grp;
  }

  function updateCarriers() {
    const x1 = -SC.d / 2;
    const x2 = SC.d / 2;
    const s2 = SC.dir === 'mismo' ? 1 : -1;

    for (let i = 0; i < N_CARRIERS; i++) {
      const f1 = ((i / N_CARRIERS + phase1) % 1 + 1) % 1;
      const f2 = ((i / N_CARRIERS + phase2 * s2) % 1 + 1) % 1;
      carriers1[i].position.set(x1, -WIRE_LEN / 2 + f1 * WIRE_LEN, 0);
      carriers2[i].position.set(x2, -WIRE_LEN / 2 + f2 * WIRE_LEN, 0);
    }
  }

  function onC() {
    staticGrp.clear();

    const d = SC.d;
    const x1 = -d / 2;
    const x2 = d / 2;
    const s2 = SC.dir === 'mismo' ? 1 : -1;
    const y0 = SC.y0;
    const dl = SC.dl;

    /* Conductores 1 y 2 */
    const wireGeo = new THREE.CylinderGeometry(0.16, 0.16, WIRE_LEN, 20);
    const w1 = new THREE.Mesh(
      wireGeo,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 })
    );
    w1.position.set(x1, 0, 0);

    const w2 = new THREE.Mesh(
      wireGeo,
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.2 })
    );
    w2.position.set(x2, 0, 0);
    staticGrp.add(w1, w2);

    /* Segmentos diferenciales Δl resaltados en ambos hilos */
    const segGeo = new THREE.CylinderGeometry(0.28, 0.28, dl, 24);
    const segMat = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      emissive: 0xa21caf,
      emissiveIntensity: 0.45
    });
    const seg1 = new THREE.Mesh(segGeo, segMat);
    seg1.position.set(x1, y0, 0);
    const seg2 = new THREE.Mesh(segGeo, segMat);
    seg2.position.set(x2, y0, 0);
    staticGrp.add(seg1, seg2);

    /* Anillos de campo magnético B1 (centrados en hilo 1, pasando por hilo 2 con radio d) */
    [-5, y0, 5].forEach((yy) => {
      staticGrp.add(buildCircleRing(x1, yy, d, 0x22c55e, true));
    });

    /* Anillo de campo magnético B2 en y0 (centrado en hilo 2, pasando por hilo 1 con radio d) */
    staticGrp.add(buildCircleRing(x2, y0, d, 0x10b981, s2 > 0));

    /* Vectores en el elemento dl₂ (Conductor 2) y dl₁ (Conductor 1) */
    const p1 = V(x1, y0, 0);
    const p2 = V(x2, y0, 0);

    /* Escala visual de flechas según magnitud de fuerza y campo */
    const B1_ana = (MU0 * SC.I1) / (2 * Math.PI * (d * 1e-2));
    const B2_ana = (MU0 * SC.I2) / (2 * Math.PI * (d * 1e-2));
    const F_per_L_ana = (MU0 * SC.I1 * SC.I2) / (2 * Math.PI * (d * 1e-2));

    const bLen1 = Math.min(4.5, Math.max(1.6, 1.4 + Math.log10(B1_ana * 1e6 + 1) * 0.9));
    const bLen2 = Math.min(4.5, Math.max(1.6, 1.4 + Math.log10(B2_ana * 1e6 + 1) * 0.9));
    const fLen = Math.min(
      Math.max(1.5, d * 0.42),
      Math.max(1.6, 1.1 + Math.log10(F_per_L_ana * 1e6 + 1) * 0.95)
    );

    /* Vectores de corriente I₁·dl₁ (naranja) e I₂·dl₂ (azul claro) */
    staticGrp.add(new THREE.ArrowHelper(V(0, 1, 0), p1, Math.max(2.2, dl * 0.65), 0xf59e0b, 0.7, 0.45));
    staticGrp.add(new THREE.ArrowHelper(V(0, s2, 0), p2, Math.max(2.2, dl * 0.65), 0x38bdf8, 0.7, 0.45));

    /* Vectores de campo magnético B₁(en 2) = -z y B₂(en 1) = s2 * (+z) (verdes) */
    staticGrp.add(new THREE.ArrowHelper(V(0, 0, -1), p2, bLen1, 0x22c55e, 0.65, 0.4));
    staticGrp.add(new THREE.ArrowHelper(V(0, 0, s2), p1, bLen2, 0x22c55e, 0.65, 0.4));

    /* Vectores de fuerza magnética dF₁→₂ y dF₂→₁ (rojos, par acción-reacción) */
    const dirF2 = V(-s2, 0, 0); // Si s2=1 (mismo sentido), apunta en -X (hacia conductor 1: atracción)
    const dirF1 = V(s2, 0, 0);  // Apunta en +X (hacia conductor 2: atracción)
    staticGrp.add(new THREE.ArrowHelper(dirF2, p2, fLen, 0xef4444, 0.75, 0.48));
    staticGrp.add(new THREE.ArrowHelper(dirF1, p1, fLen, 0xef4444, 0.75, 0.48));

    /* Cota visual de separación d en la base (y = -9 cm) */
    const cotaPts = [V(x1, -9, 0), V(x2, -9, 0)];
    staticGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(cotaPts),
        new THREE.LineBasicMaterial({ color: 0x9aa5b1 })
      )
    );

    updateCarriers();

    /* Comparación entre cálculo numérico (Biot-Savart + Lorentz) y analítico */
    const B1_num = calcB1Numerical(p2, x1, SC.I1).length();
    const dF_numVec = calcSegmentForceNumerical(x1, x2, SC.I1, SC.I2, s2, y0, dl);
    const dF_num = dF_numVec.length();
    const dF_ana = F_per_L_ana * (dl * 1e-2);
    const errRel = dF_ana > 0 ? (Math.abs(dF_num - dF_ana) / dF_ana) * 100 : 0;

    ro([
      ['Interacción magnética', s2 > 0 ? 'Atracción (⇈)' : 'Repulsión (⇅)'],
      ['Campo $|\\vec{B}_1| = \\tfrac{\\mu_0 I_1}{2\\pi d}$', fm(B1_ana * 1e6) + ' μT'],
      ['Campo $|\\vec{B}_2| = \\tfrac{\\mu_0 I_2}{2\\pi d}$', fm(B2_ana * 1e6) + ' μT'],
      ['Fuerza $\\tfrac{F}{L} = \\tfrac{\\mu_0 I_1 I_2}{2\\pi d}$', fm(F_per_L_ana * 1e6) + ' μN/m'],
      ['Fuerza analítica $\\Delta F$', fm(dF_ana * 1e6) + ' μN'],
      ['Fuerza numérica $\\sum d\\vec{F}$', fm(dF_num * 1e6) + ' μN'],
      ['Error relativo', fm(errRel) + ' %']
    ]);
  }

  Sim.registerModule({
    id: 'C',
    title: '3 · Fuerza entre corrientes',
    group: gC,
    canPause: true,
    cameraPos: [14, 11, 22],
    state: SC,
    theory:
      '<b>Fuerza magnética entre elementos de corriente:</b>' +
      '$$d\\vec{F}_{1\\to 2} = I_2\\,d\\vec{l}_2 \\times \\vec{B}_1, \\qquad B_1 = \\frac{\\mu_0 I_1}{2\\pi d}$$' +
      '$$\\frac{F}{L} = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d}, \\qquad \\Delta F = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d}\\,\\Delta l$$' +
      'Corrientes paralelas ($\\uparrow\\uparrow$) se <b>atraen</b> y corrientes antiparalelas ($\\uparrow\\downarrow$) se <b>repelen</b>, cumpliendo la tercera ley de Newton ($\\vec{F}_{1\\to 2} = -\\vec{F}_{2\\to 1}$).',
    activate() {
      build(cfgC, SC, onC);
      onC();
    },
    reset() {
      phase1 = 0;
      phase2 = 0;
      onC();
    },
    update(paused) {
      if (!paused) {
        phase1 = (phase1 + 0.0012 * SC.I1) % 1;
        phase2 = (phase2 + 0.0012 * SC.I2) % 1;
        updateCarriers();
      }
    }
  });
})();
