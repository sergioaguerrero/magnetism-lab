/* ===== Módulo 5 (B-04): Flujo magnético a través de una superficie (Φ = B·A·cos θ) ===== */
(function () {
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
        'Rotación continua ω (Φ(t) = B·A·cos ωt)': 'rotacion'
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

  const hitSphereGeo = new THREE.SphereGeometry(0.22, 12, 10);

  /* Integración numérica del flujo Φ = ∑ B(r_ij) · dA_ij sobre una malla 2D en la superficie */
  function calcNumericalFlux(th) {
    const M = 24;
    const h = (SE.L * 1e-2) / 2; // en metros
    const step = (2 * h) / M;
    const dA = step * step;
    const nVec = V(Math.cos(th), 0, Math.sin(th));
    const Bvec = V(SE.B * 1e-3, 0, 0);
    let flux = 0;

    for (let i = 0; i < M; i++) {
      const u = -h + (i + 0.5) * step;
      for (let j = 0; j < M; j++) {
        const v = -h + (j + 0.5) * step;
        if (SE.shape === 'disco' && u * u + v * v > h * h) continue;
        flux += Bvec.dot(nVec) * dA;
      }
    }
    return flux;
  }

  function updateScene(updateRo) {
    surfGrp.clear();
    linesGrp.clear();
    vecGrp.clear();
    projGrp.clear();

    const h = SE.L / 2; // en cm para la escena 3D
    const cTh = Math.cos(curTh);
    const sTh = Math.sin(curTh);

    /* Color según el signo del flujo Φ = B·A·cos θ */
    let fluxColor = 0x94a3b8;
    if (cTh > 0.02) fluxColor = 0x10b981;      // Flujo positivo (verde esmeralda)
    else if (cTh < -0.02) fluxColor = 0xf43f5e; // Flujo negativo (rojo coral)

    /* 1. Superficie orientable y su borde */
    const surfFrame = new THREE.Group();
    const surfMat = new THREE.MeshStandardMaterial({
      color: fluxColor,
      transparent: true,
      opacity: 0.28 + 0.22 * Math.abs(cTh),
      side: THREE.DoubleSide
    });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 });

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

      const wireGrid = new THREE.Mesh(
        new THREE.PlaneGeometry(SE.L, SE.L, 4, 4),
        new THREE.MeshBasicMaterial({ color: fluxColor, wireframe: true, transparent: true, opacity: 0.45 })
      );
      wireGrid.rotation.y = Math.PI / 2;
      surfFrame.add(wireGrid);

      const corners = [V(0, -h, h), V(0, h, h), V(0, h, -h), V(0, -h, -h), V(0, -h, h)];
      surfFrame.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(corners),
          new THREE.LineBasicMaterial({ color: 0xf59e0b })
        )
      );
    }

    /* Pequeñas flechas diferenciales dA sobre la superficie indicando la cara positiva (+n̂) */
    [
      [-h * 0.45, -h * 0.45],
      [h * 0.45, -h * 0.45],
      [-h * 0.45, h * 0.45],
      [h * 0.45, h * 0.45]
    ].forEach(([u, v]) => {
      surfFrame.add(new THREE.ArrowHelper(V(1, 0, 0), V(0, v, u), 1.6, 0xe879f9, 0.45, 0.3));
    });

    surfFrame.rotation.y = -curTh;
    surfGrp.add(surfFrame);

    /* 2.Vectores principales en el centro: normal n̂ (magenta) y campo B (verde) */
    const nDir = V(cTh, 0, sTh);
    vecGrp.add(new THREE.ArrowHelper(nDir, V(0, 0, 0), 5.8, 0xe879f9, 0.95, 0.55));
    vecGrp.add(new THREE.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 5.8, 0x22c55e, 0.95, 0.55));

    /* Arco visual del ángulo θ entre B (+X) y n̂ */
    if (Math.abs(curTh) > 0.03) {
      const arcPts = [];
      const arcSteps = 28;
      for (let i = 0; i <= arcSteps; i++) {
        const a = (curTh * i) / arcSteps;
        arcPts.push(V(2.8 * Math.cos(a), 0, 2.8 * Math.sin(a)));
      }
      vecGrp.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(arcPts),
          new THREE.LineBasicMaterial({ color: 0xfef08a })
        )
      );
    }

    /* 3. Proyección del área efectiva A_⊥ = A·|cos θ| en el plano x = -10 */
    const projX = -10;
    const projPts = [];
    if (SE.shape === 'disco') {
      const Np = 48;
      for (let i = 0; i <= Np; i++) {
        const a = (2 * Math.PI * i) / Np;
        projPts.push(V(projX, h * Math.sin(a), h * Math.cos(a) * cTh));
      }
    } else {
      const hz = h * cTh;
      projPts.push(
        V(projX, -h, hz),
        V(projX, h, hz),
        V(projX, h, -hz),
        V(projX, -h, -hz),
        V(projX, -h, hz)
      );
    }
    projGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(projPts),
        new THREE.LineBasicMaterial({ color: fluxColor, transparent: true, opacity: 0.7 })
      )
    );

    /* 4. Haz de líneas de campo B y puntos de intersección con la superficie */
    /* La densidad de la rejilla de líneas crece con la magnitud de B */
    const nGrid = Math.max(2, Math.min(5, Math.round(1 + SE.B / 45)));
    const span = 6.5;
    let totalLines = 0;
    let piercingLines = 0;
    const hitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: fluxColor });

    for (let iy = -nGrid; iy <= nGrid; iy++) {
      for (let iz = -nGrid; iz <= nGrid; iz++) {
        const y = (iy / nGrid) * span;
        const z = (iz / nGrid) * span;
        totalLines++;

        let pierces = false;
        let xInt = 0;
        if (Math.abs(cTh) > 1e-3) {
          const u = z / cTh;
          const v = y;
          pierces =
            SE.shape === 'disco'
              ? u * u + v * v <= h * h
              : Math.abs(u) <= h && Math.abs(v) <= h;
          if (pierces) {
            xInt = -u * sTh;
            piercingLines++;
          }
        }

        const lineColor = pierces ? fluxColor : 0x22c55e;
        const lineOp = pierces ? 0.85 : 0.18;
        linesGrp.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([V(-10, y, z), V(10, y, z)]),
            new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: lineOp })
          )
        );
        linesGrp.add(
          new THREE.ArrowHelper(
            V(1, 0, 0),
            V(8.2, y, z),
            1.6,
            lineColor,
            pierces ? 0.55 : 0.35,
            pierces ? 0.35 : 0.22
          )
        );

        if (pierces && Math.abs(xInt) <= 10) {
          const dot = new THREE.Mesh(hitSphereGeo, hitMat);
          dot.position.set(xInt, y, z);
          linesGrp.add(dot);
        }
      }
    }

    if (!updateRo) return;

    const Lm = SE.L * 1e-2;
    const A = SE.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
    const B = SE.B * 1e-3;
    const Aeff = A * cTh;
    const phiAna = B * A * cTh;
    const phiNum = SE.shape === 'rect' ? calcNumericalFlux(curTh) : phiAna;
    const deg = ((curTh * 180) / Math.PI).toFixed(1);

    let signLabel = 'Nulo (0 Wb, B ⊥ n̂)';
    if (cTh > 0.01) signLabel = 'Positivo (+Φ_B, θ < 90°)';
    else if (cTh < -0.01) signLabel = 'Negativo (−Φ_B, θ > 90°)';

    ro([
      ['Signo del flujo $\\Phi_B$', signLabel],
      ['Área total $A$', fm(A * 1e4) + ' cm² (' + fm(A) + ' m²)'],
      ['Ángulo $\\theta$ ($\\cos\\theta$)', deg + '° (' + cTh.toFixed(3) + ')'],
      ['Área proyectada $A\\cos\\theta$', fm(Aeff * 1e4) + ' cm²'],
      ['Flujo $\\Phi_B = B A \\cos\\theta$', fm(phiAna * 1e6) + ' μWb'],
      ['Flujo numérico $\\sum \\vec{B}\\cdot\\Delta\\vec{A}$', fm(phiNum * 1e6) + ' μWb'],
      ['Líneas que atraviesan', piercingLines + ' de ' + totalLines]
    ]);
  }

  function initE() {
    curTh = (SE.th * Math.PI) / 180;
    updateScene(true);
  }

  Sim.registerModule({
    id: 'E',
    title: '5 · Flujo magnético',
    group: gE,
    canPause: true,
    cameraPos: [12, 11, 18],
    state: SE,
    theory:
      '<b>Flujo magnético a través de una superficie orientable:</b>' +
      '$$\\Phi_B = \\int_S \\vec{B} \\cdot d\\vec{A} = \\vec{B} \\cdot \\vec{A} = B\\,A\\,\\cos\\theta \\quad [\\text{Wb} = \\text{T}\\cdot\\text{m}^2]$$' +
      '$$A_\\perp = A\\,\\cos\\theta, \\qquad \\Phi_B(t) = B\\,A\\,\\cos(\\omega t)$$' +
      'El flujo es proporcional al área proyectada $A\\cos\\theta$ y al número de líneas de campo que atraviesan la superficie: es <b>positivo</b> ($\\Phi_B > 0$, verde) si $|\\theta| < 90^\\circ$, <b>nulo</b> ($\\Phi_B = 0$) si $\\theta = \\pm 90^\\circ$ y <b>negativo</b> ($\\Phi_B < 0$, rojo) si $|\\theta| > 90^\\circ$.',
    activate() {
      build(cfgE, SE, initE);
      initE();
    },
    reset() {
      initE();
    },
    update(paused, fr) {
      if (!paused && SE.mode === 'rotacion') {
        curTh += SE.w * (1 / 60);
        if (curTh > Math.PI) curTh -= 2 * Math.PI;
        SE.th = Math.round((curTh * 180) / Math.PI);
        updateScene(fr % 4 === 0);
      }
    }
  });
})();
