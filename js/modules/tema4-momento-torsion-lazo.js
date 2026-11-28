/* ===== Tema 4: Momento de torsión sobre un lazo de corriente (τ = μ × B) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gD = new THREE.Group();
  scene.add(gD);

  const refGrp = new THREE.Group();
  const bFieldGrp = new THREE.Group();
  const loopGrp = new THREE.Group();
  const vecGrp = new THREE.Group();
  gD.add(refGrp, bFieldGrp, loopGrp, vecGrp);

  function rebuildRefAndField() {
    Sim.scene.clearGroup(refGrp);
    Sim.scene.clearGroup(bFieldGrp);
    const pal = Sim.scene.getPalette();

    refGrp.add(Sim.viz.createGrid({ size: 20, majorStep: 4, minorStep: 2, plane: 'xz' }));
    refGrp.add(Sim.viz.createAxes(9.5, { tickStep: 2, unitLabel: '1 div = 2 cm' }));

    const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.22 });
    [-6, 0, 6].forEach((y) => {
      [-6, 0, 6].forEach((z) => {
        bFieldGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-10, y, z), V(10, y, z)]), lineMat));
        bFieldGrp.add(
          Sim.viz.createVector(V(1, 0, 0), V(6.6, y, z), 1.9, pal.B, {
            radius: 0.028,
            headLength: 0.42,
            headRadius: 0.11
          })
        );
      });
    });

    bFieldGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([V(0, -8.5, 0), V(0, 8.5, 0)]),
        new THREE.LineBasicMaterial({ color: pal.axisLine, transparent: true, opacity: 0.55 })
      )
    );
  }
  rebuildRefAndField();

  /* Vectores sólidos persistentes reutilizados en cada frame (cero asignaciones durante la oscilación) */
  const initPal = Sim.scene.getPalette();
  const muArrow = Sim.viz.createVector(V(1, 0, 0), V(0, 0, 0), 5.0, initPal.mu, { radius: 0.082, label: 'μ' });
  const bArrow = Sim.viz.createVector(V(1, 0, 0), V(0, 0, 0), 5.0, initPal.B, { radius: 0.075, label: 'B' });
  const f1Arrow = Sim.viz.createVector(V(0, 0, -1), V(0, 0, 0), 3.4, initPal.F, { radius: 0.072, label: 'F₁' });
  const f2Arrow = Sim.viz.createVector(V(0, 0, 1), V(0, 0, 0), 3.4, initPal.F, { radius: 0.072, label: 'F₂' });
  const tauArrow = Sim.viz.createVector(V(0, -1, 0), V(0, 0, 0), 3.0, initPal.v, { radius: 0.08, label: 'τ' });
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
        'Rectangular (L × L)': 'rect',
        'Circular (diámetro L)': 'circ'
      }
    },
    {
      k: 'mode',
      t: 'Régimen',
      opts: {
        'Dinámico (hacia equilibrio)': 'dinamico',
        'Estático (ángulo fijo)': 'estatico'
      },
      onSelect() {
        omega = 0;
      }
    },
    { k: 'th0', t: 'Ángulo inicial $\\theta$', u: '°', min: -175, max: 175, step: 1 },
    { k: 'I', t: 'Corriente $I$', u: 'A', min: 0.5, max: 20, step: 0.5 },
    { k: 'B', t: 'Campo $B$ ($+X$)', u: 'mT', min: 5, max: 200, step: 5 },
    { k: 'L', t: 'Dimensión $L$', u: 'cm', min: 4, max: 14, step: 0.5 },
    { k: 'N', t: 'Vueltas $N$', u: '', min: 1, max: 50, step: 1 },
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

    const tubeMat = new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.4, metalness: 0.25 });
    const surfMat = new THREE.MeshStandardMaterial({
      color: pal.mu,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    if (SD.shape === 'rect') {
      const cylV = new THREE.CylinderGeometry(0.16, 0.16, SD.L, 16);
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
      const torus = new THREE.Mesh(new THREE.TorusGeometry(h, 0.16, 16, 64), tubeMat);
      torus.rotation.y = Math.PI / 2;
      loopGrp.add(torus);

      const disc = new THREE.Mesh(new THREE.CircleGeometry(h, 48), surfMat);
      disc.rotation.y = Math.PI / 2;
      loopGrp.add(disc);
    }

    loopGrp.add(Sim.viz.createVector(V(0, 1, 0), V(0, -1, h), 2.1, pal.vxb, { radius: 0.055 }));
    loopGrp.add(Sim.viz.createVector(V(0, -1, 0), V(0, 1, -h), 2.1, pal.vxb, { radius: 0.055 }));
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
      tauArrow.setLength(Math.max(1.2, Math.min(5.2, 4.6 * Math.abs(sTh))), 0.72, 0.2);
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
      ['Torque $|\\vec{\\tau}|$', fm(tauAna), 'N·m', { primary: true }],
      ['Ángulo actual $\\theta$', deg, '°', { primary: true }],
      ['Momento dipolar $|\\vec{\\mu}|$', fm(mu), 'A·m²'],
      ['Energía potencial $U$', fm(U), 'J'],
      ['Fuerza lateral $F_1 = F_2$', fm(Farm), 'N'],
      ['Área de espira $A$', fm(A * 1e4), 'cm²'],
      ['Torque numérico', fm(tauNum), 'N·m'],
      ['Error relativo', tauAna > 1e-12 ? fm(errRel) : '0', '%']
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
    cameraPos: [11, 11, 15.5],
    state: SD,
    getLive() {
      return {
        curTh,
        deg: (curTh * 180) / Math.PI,
        omega
      };
    },
    theory:
      '<p>Una espira plana de $N$ vueltas, área $A$ y corriente $I$ posee un momento dipolar $\\vec{\\mu} = N I A\\,\\hat{n}$. Dentro de un campo uniforme $\\vec{B}$ la fuerza neta es nula, pero aparece un par restaurador:</p>' +
      '$$\\vec{\\tau} = \\vec{\\mu} \\times \\vec{B}, \\qquad U = -\\vec{\\mu}\\cdot\\vec{B} = -\\mu\\,B\\,\\cos\\theta$$' +
      '<p>La posición $\\theta = 0^\\circ$ corresponde al mínimo de energía potencial (equilibrio estable).</p>',
    activate() {
      build(cfgD, SD, initD);
      initD();
    },
    reset() {
      initD();
    },
    onThemeChange() {
      rebuildRefAndField();
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
