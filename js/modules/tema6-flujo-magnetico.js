/* ===== Tema 6: Flujo magnético a través de una superficie (Φ = B·A·cos θ) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gE = new THREE.Group();
  scene.add(gE);

  const refGrp = new THREE.Group();
  const surfGrp = new THREE.Group();
  const linesGrp = new THREE.Group();
  const vecGrp = new THREE.Group();
  const projGrp = new THREE.Group();
  gE.add(refGrp, surfGrp, linesGrp, vecGrp, projGrp);

  function rebuildRef() {
    Sim.scene.clearGroup(refGrp);
    refGrp.add(Sim.viz.createGrid({ size: 22, majorStep: 4, minorStep: 2, plane: 'xz' }));
    refGrp.add(Sim.viz.createAxes(9.5, { tickStep: 2, unitLabel: '1 div = 2 cm' }));
  }
  rebuildRef();

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
      t: 'Superficie',
      opts: {
        'Disco circular (diámetro L)': 'disco',
        'Cuadrado (L × L)': 'rect'
      }
    },
    {
      k: 'mode',
      t: 'Orientación',
      opts: {
        'Manual (ángulo θ)': 'manual',
        'Rotación continua (ωt)': 'rotacion'
      }
    },
    { k: 'th', t: 'Ángulo $\\theta(\\hat{n}, \\vec{B})$', u: '°', min: -180, max: 180, step: 1 },
    { k: 'B', t: 'Campo $B$ ($+X$)', u: 'mT', min: 10, max: 200, step: 5 },
    { k: 'L', t: 'Dimensión $L$', u: 'cm', min: 4, max: 14, step: 0.5 },
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

  const initPal = Sim.scene.getPalette();
  const hitSphereGeo = new THREE.SphereGeometry(0.18, 12, 10);
  hitSphereGeo._shared = true;
  const hitMat = new THREE.MeshStandardMaterial({ color: initPal.fluxPos, roughness: 0.35, metalness: 0.1 });
  hitMat._shared = true;

  const nArrow = Sim.viz.createVector(V(1, 0, 0), V(0, 0, 0), 5.4, initPal.mu, { radius: 0.082, label: 'n̂' });
  const bArrow = Sim.viz.createVector(V(1, 0, 0), V(0, 0, 0), 5.4, initPal.B, { radius: 0.075, label: 'B' });

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
  const projMat = new THREE.LineBasicMaterial({ color: initPal.fluxPos, transparent: true, opacity: 0.78 });
  const projLine = new THREE.Line(projGeo, projMat);
  projGrp.add(projLine);

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
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const rimMat = new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.42, metalness: 0.22 });
    wireMat = null;

    if (SE.shape === 'disco') {
      const disc = new THREE.Mesh(new THREE.CircleGeometry(h, 48), surfMat);
      disc.rotation.y = Math.PI / 2;
      surfFrame.add(disc);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(h, 0.13, 14, 64), rimMat);
      ring.rotation.y = Math.PI / 2;
      surfFrame.add(ring);
    } else {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(SE.L, SE.L, 4, 4), surfMat);
      plane.rotation.y = Math.PI / 2;
      surfFrame.add(plane);

      wireMat = new THREE.MeshBasicMaterial({ color: pal.fluxPos, wireframe: true, transparent: true, opacity: 0.35 });
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
      surfFrame.add(Sim.viz.createVector(V(1, 0, 0), V(0, v, u), 1.45, pal.mu, { radius: 0.034, headLength: 0.36, headRadius: 0.1 }));
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

        const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.18 });
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-10, y, z), V(10, y, z)]), lineMat);
        const arrow = Sim.viz.createVector(V(1, 0, 0), V(8.4, y, z), 1.4, pal.B, {
          radius: 0.025,
          headLength: 0.34,
          headRadius: 0.095
        });
        const dot = new THREE.Mesh(hitSphereGeo, hitMat);
        dot.visible = false;

        linesGrp.add(line, arrow, dot);
        pool.push({ y, z, lineMat, arrow, dot });
      }
    }
  }

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

    surfFrame.rotation.y = -curTh;
    surfMat.color.setHex(fluxColor);
    surfMat.opacity = 0.22 + 0.2 * Math.abs(cTh);
    if (wireMat) wireMat.color.setHex(fluxColor);

    nArrow.setDirection(V(cTh, 0, sTh));
    nArrow.setColor(pal.mu);
    bArrow.setColor(pal.B);

    arcMat.color.setHex(pal.arc);
    if (Math.abs(curTh) > 0.03) {
      arcLine.visible = true;
      for (let i = 0; i <= ARC_STEPS; i++) {
        const a = (curTh * i) / ARC_STEPS;
        arcPositions[i * 3] = 2.6 * Math.cos(a);
        arcPositions[i * 3 + 1] = 0;
        arcPositions[i * 3 + 2] = 2.6 * Math.sin(a);
      }
      arcGeo.attributes.position.needsUpdate = true;
    } else {
      arcLine.visible = false;
    }

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

    hitMat.color.setHex(fluxColor);
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
      item.lineMat.opacity = pierces ? 0.78 : 0.16;
      item.arrow.setColor(lineColor);
      item.arrow.setLength(1.4, pierces ? 0.44 : 0.3, pierces ? 0.12 : 0.08);

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

    let signLabel = 'Nulo (B ⊥ n̂)';
    if (cTh > 0.01) signLabel = 'Positivo (+Φ_B)';
    else if (cTh < -0.01) signLabel = 'Negativo (−Φ_B)';

    ro([
      ['Flujo analítico $\\Phi_B$', fm(phiAna * 1e6), 'μWb', { primary: true }],
      ['Área proyectada $A\\cos\\theta$', fm(Aeff * 1e4), 'cm²', { primary: true }],
      ['Signo del flujo', signLabel],
      ['Ángulo $\\theta$ ($\\cos\\theta$)', `${deg}° (${cTh.toFixed(3)})`],
      ['Área geométrica $A$', fm(A * 1e4), 'cm²'],
      ['Flujo numérico ($64\\times 64$)', `${fm(phiNum * 1e6)} μWb (${fm(errRel)} %)`],
      ['Líneas interceptadas', `${piercingLines} / ${totalLines}`]
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
    cameraPos: [12, 10.5, 17.5],
    state: SE,
    getLive() {
      return {
        curTh,
        deg: (curTh * 180) / Math.PI
      };
    },
    getPlotData() {
      const c = Sim.scene.getPalette().css;
      const Lm = SE.L * 1e-2;
      const A = SE.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
      const phiMax = SE.B * 1e-3 * A * 1e6;
      const pts = [];
      for (let deg = -180; deg <= 180; deg += 4) {
        pts.push([deg, phiMax * Math.cos((deg * Math.PI) / 180)]);
      }
      const curDeg = (curTh * 180) / Math.PI;
      const curPhi = phiMax * Math.cos(curTh);
      return {
        title: 'Flujo magnético Φ_B(θ)',
        xLabel: 'θ (°)',
        yUnit: 'μWb',
        xMin: -180,
        xMax: 180,
        yMin: -phiMax * 1.15,
        yMax: phiMax * 1.15,
        series: [{ label: 'Φ_B = BA·cos θ', color: c.B, pts }],
        marker: { x: curDeg, y: curPhi, color: curPhi >= 0 ? c.B : c.F }
      };
    },
    theory:
      '<p>El flujo magnético a través de una superficie abierta $S$ mide el paso neto de líneas de campo respecto a la orientación definida por $\\hat{n}$:</p>' +
      '$$\\Phi_B = \\int_S \\vec{B} \\cdot d\\vec{A} = B\\,A\\,\\cos\\theta \\qquad [1\\text{ Wb} = 1\\text{ T}\\cdot\\text{m}^2]$$' +
      '<p>En rotación uniforme a frecuencia angular $\\omega$, el flujo oscila armónicamente como $\\Phi_B(t) = B A \\cos(\\omega t)$.</p>',
    activate() {
      build(cfgE, SE, initE);
      initE();
    },
    reset() {
      initE();
    },
    onThemeChange() {
      rebuildRef();
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
        if (shouldRo && Sim.plot && Sim.activeMod) {
          Sim.plot.render(Sim.activeMod);
        }
        if (fr % 15 === 0 && Sim.explainer && Sim.activeMod) {
          Sim.explainer.scheduleUpdate(Sim.activeMod);
        }
      }
    }
  });
})();
