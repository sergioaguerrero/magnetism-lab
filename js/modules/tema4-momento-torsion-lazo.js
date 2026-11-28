/* ===== Tema 4: Momento de torsión sobre un lazo de corriente (τ = μ × B) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gD = new THREE.Group();
  scene.add(gD);

  gD.add(new THREE.AxesHelper(10));

  const bFieldGrp = new THREE.Group();
  const loopGrp = new THREE.Group();
  const vecGrp = new THREE.Group();
  gD.add(bFieldGrp, loopGrp, vecGrp);

  function rebuildBackgroundField() {
    Sim.scene.clearGroup(bFieldGrp);
    const pal = Sim.scene.getPalette();

    const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.28 });
    [-6, 0, 6].forEach((y) => {
      [-6, 0, 6].forEach((z) => {
        const pts = [V(-10, y, z), V(10, y, z)];
        bFieldGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
        bFieldGrp.add(new THREE.ArrowHelper(V(1, 0, 0), V(6.5, y, z), 2.2, pal.B, 0.65, 0.4));
      });
    });

    const axisPts = [V(0, -9, 0), V(0, 9, 0)];
    bFieldGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(axisPts),
        new THREE.LineBasicMaterial({ color: pal.axisLine, transparent: true, opacity: 0.55 })
      )
    );
  }
  rebuildBackgroundField();

  /* Flechas persistentes reutilizadas en cada frame (cero asignaciones WebGL durante la rotación) */
  const initPal = Sim.scene.getPalette();
  const muArrow = new THREE.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 5.2, initPal.mu, 0.9, 0.55);
  const bArrow = new THREE.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 5.2, initPal.B, 0.9, 0.55);
  const f1Arrow = new THREE.ArrowHelper(V(0, 0, -1), V(0, 0, 0), 3.6, initPal.F, 0.75, 0.45);
  const f2Arrow = new THREE.ArrowHelper(V(0, 0, 1), V(0, 0, 0), 3.6, initPal.F, 0.75, 0.45);
  const tauArrow = new THREE.ArrowHelper(V(0, -1, 0), V(0, 0, 0), 3.0, initPal.v, 0.85, 0.5);
  vecGrp.add(muArrow, bArrow, f1Arrow, f2Arrow, tauArrow);

  const SD = {
    shape: 'rect',
    mode: 'dinamico',
    th0: 65,
    I: 5,
    B: 60,
    L: 8,
    N: 15,
    dmp: 0.45
  };

  let curTh = (SD.th0 * Math.PI) / 180;
  let omega = 0;

  const cfgD = [
    {
      k: 'shape',
      t: 'Geometría de la espira',
      opts: {
        'Espira rectangular (L × L)': 'rect',
        'Espira circular (diámetro L)': 'circ'
      }
    },
    {
      k: 'mode',
      t: 'Modo de simulación',
      opts: {
        'Dinámico (gira al equilibrio)': 'dinamico',
        'Estático (ángulo fijo θ)': 'estatico'
      },
      onSelect() {
        omega = 0;
      }
    },
    { k: 'th0', t: 'Ángulo inicial $\\theta$ (entre $\\vec{\\mu}$ y $\\vec{B}$)', u: '°', min: -175, max: 175, step: 1 },
    { k: 'I', t: 'Corriente $I$', u: 'A', min: 0.5, max: 20, step: 0.5 },
    { k: 'B', t: 'Campo magnético $B$ ($+X$)', u: 'mT', min: 5, max: 200, step: 5 },
    { k: 'L', t: 'Dimensión de espira $L$', u: 'cm', min: 4, max: 14, step: 0.5 },
    { k: 'N', t: 'Número de vueltas $N$', u: '', min: 1, max: 50, step: 1 },
    {
      k: 'dmp',
      t: 'Amortiguamiento',
      u: '',
      min: 0,
      max: 2,
      step: 0.05,
      show: () => SD.mode === 'dinamico'
    }
  ];

  function localLoopPoints() {
    const h = SD.L / 2;
    const pts = [];
    if (SD.shape === 'rect') {
      const corners = [V(0, -h, h), V(0, h, h), V(0, h, -h), V(0, -h, -h), V(0, -h, h)];
      const segsPerSide = 20;
      for (let s = 0; s < 4; s++) {
        for (let k = 0; k < segsPerSide; k++) {
          pts.push(corners[s].clone().lerp(corners[s + 1], k / segsPerSide));
        }
      }
      pts.push(corners[4].clone());
    } else {
      const M = 96;
      for (let i = 0; i <= M; i++) {
        const a = (2 * Math.PI * i) / M;
        pts.push(V(0, -h * Math.cos(a), h * Math.sin(a)));
      }
    }
    return pts;
  }

  function calcNumericalTorque(th) {
    const pts = localLoopPoints();
    const Bvec = V(SD.B * 1e-3, 0, 0);
    const rotY = new THREE.Matrix4().makeRotationY(-th);
    const tau = V(0, 0, 0);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i].clone().applyMatrix4(rotY).multiplyScalar(1e-2);
      const p1 = pts[i + 1].clone().applyMatrix4(rotY).multiplyScalar(1e-2);
      const rm = p0.clone().add(p1).multiplyScalar(0.5);
      const dl = p1.clone().sub(p0);
      const dF = dl.cross(Bvec).multiplyScalar(SD.N * SD.I);
      tau.add(rm.cross(dF));
    }
    return tau;
  }

  function syncVectorColors() {
    const pal = Sim.scene.getPalette();
    muArrow.setColor(pal.mu);
    bArrow.setColor(pal.B);
    f1Arrow.setColor(pal.F);
    f2Arrow.setColor(pal.F);
    tauArrow.setColor(pal.v);
  }

  function rebuildLoopGeometry() {
    Sim.scene.clearGroup(loopGrp);
    const pal = Sim.scene.getPalette();
    const h = SD.L / 2;
    const pts = localLoopPoints();

    loopGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: pal.I })
      )
    );

    const tubeMat = new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.35, metalness: 0.25 });
    const surfMat = new THREE.MeshStandardMaterial({
      color: pal.mu,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });

    if (SD.shape === 'rect') {
      const cylV = new THREE.CylinderGeometry(0.18, 0.18, SD.L, 16);
      const arm1 = new THREE.Mesh(cylV, tubeMat);
      arm1.position.set(0, 0, h);
      const arm2 = new THREE.Mesh(cylV, tubeMat);
      arm2.position.set(0, 0, -h);

      const arm3 = new THREE.Mesh(cylV, tubeMat);
      arm3.rotation.x = Math.PI / 2;
      arm3.position.set(0, h, 0);
      const arm4 = new THREE.Mesh(cylV, tubeMat);
      arm4.rotation.x = Math.PI / 2;
      arm4.position.set(0, -h, 0);
      loopGrp.add(arm1, arm2, arm3, arm4);

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(SD.L, SD.L), surfMat);
      plane.rotation.y = Math.PI / 2;
      loopGrp.add(plane);
    } else {
      const torus = new THREE.Mesh(new THREE.TorusGeometry(h, 0.18, 16, 64), tubeMat);
      torus.rotation.y = Math.PI / 2;
      loopGrp.add(torus);

      const disc = new THREE.Mesh(new THREE.CircleGeometry(h, 48), surfMat);
      disc.rotation.y = Math.PI / 2;
      loopGrp.add(disc);
    }

    loopGrp.add(new THREE.ArrowHelper(V(0, 1, 0), V(0, -1, h), 2.4, pal.arc, 0.7, 0.45));
    loopGrp.add(new THREE.ArrowHelper(V(0, -1, 0), V(0, 1, -h), 2.4, pal.arc, 0.7, 0.45));
  }

  function updateVisualsAndReadouts(updateRo) {
    loopGrp.rotation.y = -curTh;

    const h = SD.L / 2;
    const nDir = V(Math.cos(curTh), 0, Math.sin(curTh));
    const uDir = V(-Math.sin(curTh), 0, Math.cos(curTh));

    muArrow.setDirection(nDir);
    bArrow.setDirection(V(1, 0, 0));

    f1Arrow.position.copy(uDir).multiplyScalar(h);
    f1Arrow.setDirection(V(0, 0, -1));
    f2Arrow.position.copy(uDir).multiplyScalar(-h);
    f2Arrow.setDirection(V(0, 0, 1));

    const sTh = Math.sin(curTh);
    if (Math.abs(sTh) > 1e-3) {
      tauArrow.visible = true;
      tauArrow.setDirection(V(0, sTh > 0 ? -1 : 1, 0));
      tauArrow.setLength(Math.max(1.2, Math.min(5.5, 4.8 * Math.abs(sTh))), 0.85, 0.5);
    } else {
      tauArrow.visible = false;
    }

    if (!updateRo) return;

    const Lm = SD.L * 1e-2;
    const A = SD.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
    const B = SD.B * 1e-3;
    const mu = SD.N * SD.I * A;
    const tauAna = mu * B * Math.abs(Math.sin(curTh));
    const tauNum = calcNumericalTorque(curTh).length();
    const errRel = tauAna > 1e-12 ? (Math.abs(tauNum - tauAna) / tauAna) * 100 : 0;
    const U = -mu * B * Math.cos(curTh);
    const Farm = SD.N * SD.I * Lm * B;
    const deg = ((curTh * 180) / Math.PI).toFixed(1);

    ro([
      ['Área del lazo $A$', fm(A * 1e4) + ' cm² (' + fm(A) + ' m²)'],
      ['Momento $|\\vec{\\mu}| = N I A$', fm(mu) + ' A·m²'],
      ['Ángulo $\\theta$ ($\\vec{\\mu}, \\vec{B}$)', deg + ' °'],
      ['Torque $|\\vec{\\tau}| = \\mu B |\\sin\\theta|$', fm(tauAna) + ' N·m'],
      ['Torque numérico $|\\sum \\vec{r}\\times d\\vec{F}|$', fm(tauNum) + ' N·m'],
      ['Error relativo', tauAna > 1e-12 ? fm(errRel) + ' %' : '0 %'],
      ['Par lateral $F_1 = F_2$', fm(Farm) + ' N (∑F = 0)'],
      ['Energía $U = -\\vec{\\mu}\\cdot\\vec{B}$', fm(U) + ' J']
    ]);
  }

  function initD() {
    curTh = (SD.th0 * Math.PI) / 180;
    omega = 0;
    syncVectorColors();
    rebuildLoopGeometry();
    updateVisualsAndReadouts(true);
  }

  Sim.registerModule({
    id: 'torque-lazo',
    title: '4 · Momento de torsión sobre un lazo',
    group: gD,
    canPause: true,
    cameraPos: [11, 12, 16],
    state: SD,
    getLive() {
      return {
        curTh,
        deg: (curTh * 180) / Math.PI,
        omega
      };
    },
    theory:
      '<b>Momento de torsión sobre un lazo de corriente en $\\vec{B}$ uniforme:</b>' +
      '$$\\vec{\\mu} = N\\,I\\,A\\,\\hat{n}, \\qquad \\vec{\\tau} = \\vec{\\mu} \\times \\vec{B}, \\qquad |\\vec{\\tau}| = N\\,I\\,A\\,B\\,|\\sin\\theta|$$' +
      '$$\\sum \\vec{F} = \\vec{F}_1 + \\vec{F}_2 = \\vec{0}, \\qquad U = -\\vec{\\mu}\\cdot\\vec{B} = -\\mu\\,B\\,\\cos\\theta$$' +
      '<ul class="th-list">' +
      '<li><b>Momento dipolar $\\vec{\\mu}$ (magenta):</b> Normal al plano de la espira por la regla de la mano derecha.</li>' +
      '<li><b>Par de fuerzas $\\vec{F}_1, \\vec{F}_2$ (rojas):</b> Fuerzas laterales opuestas con resultante neta nula.</li>' +
      '<li><b>Torque $\\vec{\\tau}$ (azul, eje $Y$):</b> Gira la espira hacia el equilibrio estable en $\\theta = 0^\\circ$.</li>' +
      '</ul>',
    activate() {
      build(cfgD, SD, initD);
      initD();
    },
    reset() {
      initD();
    },
    onThemeChange() {
      rebuildBackgroundField();
      syncVectorColors();
      rebuildLoopGeometry();
      updateVisualsAndReadouts(false);
    },
    update(paused, fr, dt) {
      if (!paused && SD.mode === 'dinamico') {
        const Lm = SD.L * 1e-2;
        const A = SD.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
        const B = SD.B * 1e-3;
        const mu = SD.N * SD.I * A;
        const inertia = 0.008 * A;
        const step = Math.min(dt || 1 / 60, 0.05);
        const alpha = (-mu * B * Math.sin(curTh)) / inertia - SD.dmp * 3.2 * omega;
        omega += alpha * step;
        curTh += omega * step;
        updateVisualsAndReadouts(fr % 4 === 0);
        if (fr % 15 === 0 && Sim.explainer && Sim.activeMod) {
          Sim.explainer.scheduleUpdate(Sim.activeMod);
        }
      }
    }
  });
})();
