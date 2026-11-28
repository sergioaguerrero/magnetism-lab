/* ===== Tema 6: Flujo magnético a través de una superficie (Φ = B·A·cos θ) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gE = new THREE.Group();
  scene.add(gE);

  gE.add(new THREE.AxesHelper(10));

  const surfGrp = new THREE.Group();
  const linesGrp = new THREE.Group();
  const vecGrp = new THREE.Group();
  const projGrp = new THREE.Group();
  gE.add(surfGrp, linesGrp, vecGrp, projGrp);

  const SE = {
    shape: 'disco',
    mode: 'manual',
    th: 35,
    B: 80,
    L: 10,
    w: 1.0
  };

  let curTh = (SE.th * Math.PI) / 180;

  const cfgE = [
    {
      k: 'shape',
      t: 'Geometría de la superficie',
      opts: {
        'Disco circular (diámetro L)': 'disco',
        'Superficie cuadrada (L × L)': 'rect'
      }
    },
    {
      k: 'mode',
      t: 'Modo de orientación',
      opts: {
        'Manual (ajustar ángulo θ)': 'manual',
        'Rotación continua (Φ = B·A·cos ωt)': 'rotacion'
      }
    },
    { k: 'th', t: 'Ángulo $\\theta$ (entre $\\hat{n}$ y $\\vec{B}$)', u: '°', min: -180, max: 180, step: 1 },
    { k: 'B', t: 'Campo magnético $B$ ($+X$)', u: 'mT', min: 10, max: 200, step: 5 },
    { k: 'L', t: 'Dimensión superficie $L$', u: 'cm', min: 4, max: 14, step: 0.5 },
    {
      k: 'w',
      t: 'Velocidad angular $\\omega$',
      u: 'rad/s',
      min: 0.2,
      max: 3,
      step: 0.1,
      show: () => SE.mode === 'rotacion'
    }
  ];

  /* Objetos persistentes reutilizados durante la rotación continua (cero fugas de memoria WebGL) */
  const initPal = Sim.scene.getPalette();
  const hitSphereGeo = new THREE.SphereGeometry(0.22, 12, 10);
  hitSphereGeo._shared = true;
  const hitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: initPal.fluxPos, emissiveIntensity: 0.6 });
  hitMat._shared = true;

  const nArrow = new THREE.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 5.8, initPal.mu, 0.95, 0.55);
  const bArrow = new THREE.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 5.8, initPal.B, 0.95, 0.55);

  const ARC_STEPS = 28;
  const arcPositions = new Float32Array((ARC_STEPS + 1) * 3);
  const arcGeo = new THREE.BufferGeometry();
  arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
  const arcMat = new THREE.LineBasicMaterial({ color: initPal.arc });
  const arcLine = new THREE.Line(arcGeo, arcMat);
  vecGrp.add(nArrow, bArrow, arcLine);

  const PROJ_MAX = 49;
  const projPositions = new Float32Array(PROJ_MAX * 3);
  const projGeo = new THREE.BufferGeometry();
  projGeo.setAttribute('position', new THREE.BufferAttribute(projPositions, 3));
  const projMat = new THREE.LineBasicMaterial({ color: initPal.fluxPos, transparent: true, opacity: 0.75 });
  const projLine = new THREE.Line(projGeo, projMat);
  projGrp.add(projLine);

  /* Estado cacheado de la superficie y la rejilla de líneas */
  let surfFrame = null;
  let surfMat = null;
  let wireMat = null;
  let cachedSurfKey = '';

  let pool = [];
  let cachedGridN = -1;

  function ensureSurface() {
    const pal = Sim.scene.getPalette();
    const key = `${SE.shape}:${SE.L}:${Sim.scene.isDarkTheme() ? 'd' : 'l'}`;
    if (key === cachedSurfKey && surfFrame) return;
    cachedSurfKey = key;

    Sim.scene.clearGroup(surfGrp);
    const h = SE.L / 2;
    surfFrame = new THREE.Group();

    surfMat = new THREE.MeshStandardMaterial({
      color: pal.fluxPos,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const rimMat = new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.35, metalness: 0.2 });
    wireMat = null;

    if (SE.shape === 'disco') {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(h, 48), surfMat);
      disc.rotation.y = Math.PI / 2;
      surfFrame.add(disc);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(h, 0.14, 14, 64), rimMat);
      ring.rotation.y = Math.PI / 2;
      surfFrame.add(ring);
    } else {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(SE.L, SE.L, 4, 4), surfMat);
      plane.rotation.y = Math.PI / 2;
      surfFrame.add(plane);

      wireMat = new THREE.MeshBasicMaterial({ color: pal.fluxPos, wireframe: true, transparent: true, opacity: 0.45 });
      const wireGrid = new THREE.Mesh(new THREE.PlaneGeometry(SE.L, SE.L, 4, 4), wireMat);
      wireGrid.rotation.y = Math.PI / 2;
      surfFrame.add(wireGrid);

      const corners = [V(0, -h, h), V(0, h, h), V(0, h, -h), V(0, -h, -h), V(0, -h, h)];
      surfFrame.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(corners),
          new THREE.LineBasicMaterial({ color: pal.I })
        )
      );
    }

    [
      [-h * 0.45, -h * 0.45],
      [h * 0.45, -h * 0.45],
      [-h * 0.45, h * 0.45],
      [h * 0.45, h * 0.45]
    ].forEach(([u, v]) => {
      surfFrame.add(new THREE.ArrowHelper(V(1, 0, 0), V(0, v, u), 1.6, pal.mu, 0.45, 0.3));
    });

    surfGrp.add(surfFrame);
  }

  function ensureLinePool(nGrid) {
    if (nGrid === cachedGridN && pool.length > 0) return;
    cachedGridN = nGrid;

    Sim.scene.clearGroup(linesGrp);
    pool = [];
    const span = 6.5;
    const pal = Sim.scene.getPalette();

    for (let iy = -nGrid; iy <= nGrid; iy++) {
      for (let iz = -nGrid; iz <= nGrid; iz++) {
        const y = (iy / nGrid) * span;
        const z = (iz / nGrid) * span;

        const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.2 });
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-10, y, z), V(10, y, z)]), lineMat);
        const arrow = new THREE.ArrowHelper(V(1, 0, 0), V(8.2, y, z), 1.6, pal.B, 0.35, 0.22);
        const dot = new THREE.Mesh(hitSphereGeo, hitMat);
        dot.visible = false;

        linesGrp.add(line, arrow, dot);
        pool.push({ y, z, lineMat, arrow, dot });
      }
    }
  }

  /* Integración numérica real (suma de Riemann 2D 64×64) para ambas geometrías (disco y cuadrado) */
  function calcNumericalFlux(th) {
    const M = 64;
    const h = (SE.L * 1e-2) / 2;
    const step = (2 * h) / M;
    const dA = step * step;
    const nVec = V(Math.cos(th), 0, Math.sin(th));
    const Bvec = V(SE.B * 1e-3, 0, 0);
    const Bdn = Bvec.dot(nVec);
    let cells = 0;

    for (let i = 0; i < M; i++) {
      const u = -h + (i + 0.5) * step;
      for (let j = 0; j < M; j++) {
        const v = -h + (j + 0.5) * step;
        if (SE.shape === 'disco' && u * u + v * v > h * h) continue;
        cells++;
      }
    }
    return Bdn * cells * dA;
  }

  function updateScene(updateRo) {
    const pal = Sim.scene.getPalette();
    ensureSurface();

    const nGrid = Math.max(2, Math.min(5, Math.round(1 + SE.B / 45)));
    ensureLinePool(nGrid);

    const h = SE.L / 2;
    const cTh = Math.cos(curTh);
    const sTh = Math.sin(curTh);

    let fluxColor = pal.fluxZero;
    if (cTh > 0.02) fluxColor = pal.fluxPos;
    else if (cTh < -0.02) fluxColor = pal.fluxNeg;

    /* 1. Superficie orientable */
    surfFrame.rotation.y = -curTh;
    surfMat.color.setHex(fluxColor);
    surfMat.opacity = 0.28 + 0.22 * Math.abs(cTh);
    if (wireMat) wireMat.color.setHex(fluxColor);

    /* 2. Vectores centrales y arco θ */
    nArrow.setDirection(V(cTh, 0, sTh));
    nArrow.setColor(pal.mu);
    bArrow.setColor(pal.B);

    arcMat.color.setHex(pal.arc);
    if (Math.abs(curTh) > 0.03) {
      arcLine.visible = true;
      for (let i = 0; i <= ARC_STEPS; i++) {
        const a = (curTh * i) / ARC_STEPS;
        arcPositions[i * 3] = 2.8 * Math.cos(a);
        arcPositions[i * 3 + 1] = 0;
        arcPositions[i * 3 + 2] = 2.8 * Math.sin(a);
      }
      arcGeo.attributes.position.needsUpdate = true;
    } else {
      arcLine.visible = false;
    }

    /* 3. Proyección del área efectiva A_⊥ en x = -10 */
    const projX = -10;
    projMat.color.setHex(fluxColor);
    if (SE.shape === 'disco') {
      const Np = 48;
      for (let i = 0; i <= Np; i++) {
        const a = (2 * Math.PI * i) / Np;
        projPositions[i * 3] = projX;
        projPositions[i * 3 + 1] = h * Math.sin(a);
        projPositions[i * 3 + 2] = h * Math.cos(a) * cTh;
      }
      projGeo.setDrawRange(0, Np + 1);
    } else {
      const hz = h * cTh;
      const rectPts = [
        [projX, -h, hz],
        [projX, h, hz],
        [projX, h, -hz],
        [projX, -h, -hz],
        [projX, -h, hz]
      ];
      for (let i = 0; i < rectPts.length; i++) {
        projPositions[i * 3] = rectPts[i][0];
        projPositions[i * 3 + 1] = rectPts[i][1];
        projPositions[i * 3 + 2] = rectPts[i][2];
      }
      projGeo.setDrawRange(0, 5);
    }
    projGeo.attributes.position.needsUpdate = true;

    /* 4. Actualización in-place del haz de líneas e impactos */
    hitMat.emissive.setHex(fluxColor);
    const totalLines = pool.length;
    let piercingLines = 0;

    for (let idx = 0; idx < pool.length; idx++) {
      const item = pool[idx];
      let pierces = false;
      let xInt = 0;

      if (Math.abs(cTh) > 1e-3) {
        const u = item.z / cTh;
        const v = item.y;
        pierces =
          SE.shape === 'disco'
            ? u * u + v * v <= h * h
            : Math.abs(u) <= h && Math.abs(v) <= h;
        if (pierces) {
          xInt = -u * sTh;
          piercingLines++;
        }
      }

      const lineColor = pierces ? fluxColor : pal.B;
      item.lineMat.color.setHex(lineColor);
      item.lineMat.opacity = pierces ? 0.85 : 0.18;
      item.arrow.setColor(lineColor);
      item.arrow.setLength(1.6, pierces ? 0.55 : 0.35, pierces ? 0.35 : 0.22);

      if (pierces && Math.abs(xInt) <= 10) {
        item.dot.visible = true;
        item.dot.position.set(xInt, item.y, item.z);
      } else {
        item.dot.visible = false;
      }
    }

    if (!updateRo) return;

    const Lm = SE.L * 1e-2;
    const A = SE.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
    const B = SE.B * 1e-3;
    const Aeff = A * cTh;
    const phiAna = B * A * cTh;
    const phiNum = calcNumericalFlux(curTh);
    const errRel = Math.abs(phiAna) > 1e-12 ? (Math.abs(phiNum - phiAna) / Math.abs(phiAna)) * 100 : 0;
    const deg = ((curTh * 180) / Math.PI).toFixed(1);

    let signLabel = 'Nulo (0 Wb, B ⊥ n̂)';
    if (cTh > 0.01) signLabel = 'Positivo (+Φ_B, θ < 90°)';
    else if (cTh < -0.01) signLabel = 'Negativo (−Φ_B, θ > 90°)';

    ro([
      ['Signo del flujo $\\Phi_B$', signLabel],
      ['Área total $A$', fm(A * 1e4) + ' cm² (' + fm(A) + ' m²)'],
      ['Ángulo $\\theta$ ($\\cos\\theta$)', deg + '° (' + cTh.toFixed(3) + ')'],
      ['Área proyectada $A\\cos\\theta$', fm(Aeff * 1e4) + ' cm²'],
      ['Flujo analítico $\\Phi_B = B A \\cos\\theta$', fm(phiAna * 1e6) + ' μWb'],
      ['Flujo numérico $\\sum \\vec{B}\\cdot\\Delta\\vec{A}$', fm(phiNum * 1e6) + ' μWb (' + fm(errRel) + ' % err)'],
      ['Líneas que atraviesan', piercingLines + ' de ' + totalLines]
    ]);
  }

  function initE() {
    curTh = (SE.th * Math.PI) / 180;
    updateScene(true);
  }

  Sim.registerModule({
    id: 'flujo-magnetico',
    title: '6 · Flujo magnético',
    group: gE,
    canPause: true,
    cameraPos: [12, 11, 18],
    state: SE,
    getLive() {
      return {
        curTh,
        deg: (curTh * 180) / Math.PI
      };
    },
    theory:
      '<b>Flujo magnético a través de una superficie orientable:</b>' +
      '$$\\Phi_B = \\int_S \\vec{B} \\cdot d\\vec{A} = \\vec{B} \\cdot \\vec{A} = B\\,A\\,\\cos\\theta \\quad [\\text{Wb} = \\text{T}\\cdot\\text{m}^2]$$' +
      '$$A_\\perp = A\\,\\cos\\theta, \\qquad \\Phi_B(t) = B\\,A\\,\\cos(\\omega t)$$' +
      '<ul class="th-list">' +
      '<li><b>Flujo positivo ($\\Phi_B > 0$, verde):</b> Cuando $|\\theta| < 90^\\circ$ (las líneas salen por $+\\hat{n}$).</li>' +
      '<li><b>Flujo nulo ($\\Phi_B = 0$, gris):</b> Cuando $\\theta = \\pm 90^\\circ$ (superficie paralela al campo $\\vec{B}$).</li>' +
      '<li><b>Flujo negativo ($\\Phi_B < 0$, rojo):</b> Cuando $|\\theta| > 90^\\circ$ (las líneas entran contra $+\\hat{n}$).</li>' +
      '</ul>' +
      '<p>El flujo total es proporcional al área proyectada $A\\cos\\theta$ y al número de líneas que atraviesan la superficie.</p>',
    activate() {
      build(cfgE, SE, initE);
      initE();
    },
    reset() {
      initE();
    },
    onThemeChange() {
      cachedSurfKey = '';
      updateScene(false);
    },
    update(paused, fr, dt) {
      if (!paused && SE.mode === 'rotacion') {
        const step = Math.min(dt || 1 / 60, 0.05);
        curTh += SE.w * step;
        if (curTh > Math.PI) curTh -= 2 * Math.PI;
        SE.th = Math.round((curTh * 180) / Math.PI);
        const shouldRo = fr % 4 === 0;
        updateScene(shouldRo);
        if (shouldRo && Sim.ui && Sim.ui.syncControls) {
          Sim.ui.syncControls();
        }
        if (fr % 15 === 0 && Sim.explainer && Sim.activeMod) {
          Sim.explainer.scheduleUpdate(Sim.activeMod);
        }
      }
    }
  });
})();
