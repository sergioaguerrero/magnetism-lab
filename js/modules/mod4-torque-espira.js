/* ===== Módulo 4 (B-03): Momento de torsión sobre un lazo de corriente (τ = μ × B) ===== */
(function () {
  const gD = new THREE.Group();
  scene.add(gD);

  gD.add(new THREE.AxesHelper(10));

  const bFieldGrp = new THREE.Group();
  const loopGrp = new THREE.Group();
  const vecGrp = new THREE.Group();
  gD.add(bFieldGrp, loopGrp, vecGrp);

  /* Líneas de campo magnético uniforme B en dirección +X */
  [-6, 0, 6].forEach((y) => {
    [-6, 0, 6].forEach((z) => {
      const pts = [V(-10, y, z), V(10, y, z)];
      bFieldGrp.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.28 })
        )
      );
      bFieldGrp.add(new THREE.ArrowHelper(V(1, 0, 0), V(6.5, y, z), 2.2, 0x22c55e, 0.65, 0.4));
    });
  });

  /* Eje vertical de rotación (eje Y) */
  const axisPts = [V(0, -9, 0), V(0, 9, 0)];
  bFieldGrp.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(axisPts),
      new THREE.LineBasicMaterial({ color: 0x9aa5b1, transparent: true, opacity: 0.55 })
    )
  );

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
        'Dinámico (gira al equilibrio θ = 0°)': 'dinamico',
        'Estático (mantener ángulo fijo θ)': 'estatico'
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

  /* Genera los puntos cerrados de la espira en su marco local (normal = +X cuando θ = 0, plano de la espira = YZ) */
  function localLoopPoints() {
    const h = SD.L / 2;
    const pts = [];
    if (SD.shape === 'rect') {
      /* Recorrido antihorario visto desde +X (regla mano derecha => μ en +X):
         (0, -h, +h) -> (0, +h, +h) [brazo +Z sube en +Y]
         -> (0, +h, -h) [brazo sup va en -Z]
         -> (0, -h, -h) [brazo -Z baja en -Y]
         -> (0, -h, +h) [brazo inf va en +Z] */
      const corners = [
        V(0, -h, h),
        V(0, h, h),
        V(0, h, -h),
        V(0, -h, -h),
        V(0, -h, h)
      ];
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
        /* Para que dl × r dé μ en +X: en z = +h sube (+Y), en y = +h va hacia -Z */
        pts.push(V(0, -h * Math.cos(a), h * Math.sin(a)));
      }
    }
    return pts;
  }

  /* Calcula el torque numérico integrando r × (N·I·dl × B) sobre todos los segmentos */
  function calcNumericalTorque(th) {
    const pts = localLoopPoints();
    const Bvec = V(SD.B * 1e-3, 0, 0);
    const rotY = new THREE.Matrix4().makeRotationY(-th);
    /* Nota: con makeRotationY(-th), el vector normal local (1,0,0) pasa a (cos th, 0, sin th) */
    const tau = V(0, 0, 0);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i].clone().applyMatrix4(rotY).multiplyScalar(1e-2); // en metros
      const p1 = pts[i + 1].clone().applyMatrix4(rotY).multiplyScalar(1e-2);
      const rm = p0.clone().add(p1).multiplyScalar(0.5);
      const dl = p1.clone().sub(p0);
      const dF = dl.cross(Bvec).multiplyScalar(SD.N * SD.I);
      tau.add(rm.cross(dF));
    }
    return tau;
  }

  function rebuildLoopGeometry() {
    loopGrp.clear();
    const h = SD.L / 2;
    const pts = localLoopPoints();

    /* Conductor de la espira */
    loopGrp.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xf59e0b })
      )
    );

    /* Tubos o marco grueso para mejor visibilidad 3D */
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.25 });
    const surfMat = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
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

    /* Flechas de sentido de la corriente I sobre la espira */
    loopGrp.add(new THREE.ArrowHelper(V(0, 1, 0), V(0, -1, h), 2.4, 0xfef08a, 0.7, 0.45));
    loopGrp.add(new THREE.ArrowHelper(V(0, -1, 0), V(0, 1, -h), 2.4, 0xfef08a, 0.7, 0.45));
  }

  function updateVisualsAndReadouts(updateRo) {
    /* Orientar la espira: normal n = (cos θ, 0, sin θ) => rotación de -θ alrededor de Y */
    loopGrp.rotation.y = -curTh;

    vecGrp.clear();
    const h = SD.L / 2;
    const nDir = V(Math.cos(curTh), 0, Math.sin(curTh));
    const uDir = V(-Math.sin(curTh), 0, Math.cos(curTh)); // dirección hacia el brazo +Z local

    /* Vector momento dipolar magnético μ (magenta) */
    vecGrp.add(new THREE.ArrowHelper(nDir, V(0, 0, 0), 5.2, 0xe879f9, 0.9, 0.55));

    /* Vector campo magnético B en el centro (verde) */
    vecGrp.add(new THREE.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 5.2, 0x22c55e, 0.9, 0.55));

    /* Par de fuerzas F₁ (en brazo con corriente +Y: F = I·L(+Y) × B(+X) = -Z)
       y F₂ (en brazo con corriente -Y: F = +Z) */
    const posArm1 = uDir.clone().multiplyScalar(h);
    const posArm2 = uDir.clone().multiplyScalar(-h);
    vecGrp.add(new THREE.ArrowHelper(V(0, 0, -1), posArm1, 3.6, 0xef4444, 0.75, 0.45));
    vecGrp.add(new THREE.ArrowHelper(V(0, 0, 1), posArm2, 3.6, 0xef4444, 0.75, 0.45));

    /* Vector torque τ = μ × B = (0, -μ·B·sin θ, 0) (azul cian en el eje Y) */
    const sTh = Math.sin(curTh);
    if (Math.abs(sTh) > 1e-3) {
      const tauDir = V(0, sTh > 0 ? -1 : 1, 0);
      const tauLen = Math.max(1.2, Math.min(5.5, 4.8 * Math.abs(sTh)));
      vecGrp.add(new THREE.ArrowHelper(tauDir, V(0, 0, 0), tauLen, 0x38bdf8, 0.85, 0.5));
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
    rebuildLoopGeometry();
    updateVisualsAndReadouts(true);
  }

  Sim.registerModule({
    id: 'D',
    title: '4 · Torque sobre espira',
    group: gD,
    canPause: true,
    cameraPos: [11, 12, 16],
    state: SD,
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
    update(paused, fr) {
      if (!paused && SD.mode === 'dinamico') {
        const Lm = SD.L * 1e-2;
        const A = SD.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
        const B = SD.B * 1e-3;
        const mu = SD.N * SD.I * A;
        /* Escala dinámica realista para observar la oscilación hacia el equilibrio en tiempo real */
        const inertia = 0.008 * A;
        const dt = 1 / 60;
        const alpha = (-mu * B * Math.sin(curTh)) / inertia - SD.dmp * 3.2 * omega;
        omega += alpha * dt;
        curTh += omega * dt;
        updateVisualsAndReadouts(fr % 4 === 0);
      }
    }
  });
})();
