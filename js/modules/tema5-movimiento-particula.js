/* ===== Tema 5: Movimiento de una partícula cargada en campos E y B (Integrador de Boris) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gA = new THREE.Group();
  scene.add(gA);

  const refGrp = new THREE.Group();
  gA.add(refGrp);

  function rebuildRef() {
    Sim.scene.clearGroup(refGrp);
    refGrp.add(Sim.viz.createGrid({ size: 16, majorStep: 4, minorStep: 2, plane: 'xz' }));
    refGrp.add(Sim.viz.createAxes(4.2, { tickStep: 1 }));
  }
  rebuildRef();

  const initPal = Sim.scene.getPalette();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 16),
    new THREE.MeshStandardMaterial({ color: initPal.south, roughness: 0.35, metalness: 0.12 })
  );
  gA.add(ball);

  const TN = 8000;
  const tp = new Float32Array(TN * 3);
  const tg = new THREE.BufferGeometry();
  const trail = { n: 0 };
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  tg.setDrawRange(0, 0);

  const trailMat = new THREE.LineBasicMaterial({ color: initPal.I });
  const tl = new THREE.Line(tg, trailMat);
  tl.frustumCulled = false;
  gA.add(tl);

  /* Vectores sólidos persistentes sobre la partícula (cero asignaciones por frame) */
  const vA = Sim.viz.createVector(V(1, 0, 0), V(), 1.9, initPal.v, { radius: 0.052, label: 'v', labelHeight: 0.45 });
  const bPartA = Sim.viz.createVector(V(0, 1, 0), V(), 1.75, initPal.B, { radius: 0.048, label: 'B', labelHeight: 0.45 });
  const vxbA = Sim.viz.createVector(V(0, 0, 1), V(), 1.75, initPal.vxb, { radius: 0.046, label: 'v×B', labelHeight: 0.42 });
  const fA = Sim.viz.createVector(V(1, 0, 0), V(), 1.95, initPal.F, { radius: 0.056, label: 'F', labelHeight: 0.45 });
  const feA = Sim.viz.createVector(V(0, 0, -1), V(), 1.8, initPal.mu, { radius: 0.048, label: 'F_E', labelHeight: 0.42 });
  gA.add(vA, bPartA, vxbA, fA, feA);

  const specGrp = new THREE.Group();
  gA.add(specGrp);

  const Bg = new THREE.Group();
  const bgArrows = [];
  [
    [-3.5, -3.5],
    [3.5, -3.5],
    [-3.5, 3.5],
    [3.5, 3.5]
  ].forEach(([x, z]) => {
    const arr = Sim.viz.createVector(V(0, 1, 0), V(x, -1.5, z), 3, initPal.B, {
      radius: 0.024,
      headLength: 0.35,
      headRadius: 0.09
    });
    bgArrows.push(arr);
    Bg.add(arr);
  });
  gA.add(Bg);

  const SA = {
    preset: 'ciclotron',
    rhr: 'si',
    part: 'e',
    v: 5,
    th: 90,
    B: 2,
    E: 0,
    sp: 1
  };

  function applyPreset(val) {
    if (val === 'ciclotron') {
      SA.part = 'e';
      SA.v = 5;
      SA.th = 90;
      SA.B = 2;
      SA.E = 0;
    } else if (val === 'helice') {
      SA.part = 'p';
      SA.v = 6;
      SA.th = 55;
      SA.B = 5;
      SA.E = 0;
    } else if (val === 'selector') {
      SA.part = 'p';
      SA.v = 5;
      SA.th = 90;
      SA.B = 10;
      SA.E = 50;
    } else if (val === 'espectrometro') {
      SA.part = 'a';
      SA.v = 4;
      SA.th = 90;
      SA.B = 8;
      SA.E = 0;
    } else if (val === 'deriva') {
      SA.part = 'e';
      SA.v = 3;
      SA.th = 90;
      SA.B = 5;
      SA.E = 25;
    }
  }

  const cfgA = [
    {
      k: 'preset',
      t: 'Régimen de movimiento',
      opts: {
        'Ciclotrón (órbita circular)': 'ciclotron',
        'Hélice magnética (θ = 55°)': 'helice',
        'Selector de velocidades (v = E/B)': 'selector',
        'Espectrómetro de masas (α vs. p)': 'espectrometro',
        'Deriva E×B (cicloide)': 'deriva',
        'Configuración libre': 'libre'
      },
      onSelect(val) {
        applyPreset(val);
      }
    },
    {
      k: 'rhr',
      t: 'Vectores sobre la partícula',
      opts: {
        'Triedro completo (v, B, v×B, F)': 'si',
        'Solo v y F': 'no'
      }
    },
    { k: 'part', t: 'Partícula', opts: { 'Electrón (q = −e)': 'e', 'Protón (q = +e)': 'p', 'Partícula α (q = +2e)': 'a' } },
    { k: 'v', t: 'Rapidez inicial $v_0$', u: '×10⁶ m/s', min: 0.1, max: 30, step: 0.1 },
    { k: 'th', t: 'Ángulo $\\theta(\\vec{v}, \\vec{B})$', u: '°', min: 0, max: 180, step: 1 },
    { k: 'B', t: 'Campo $B$ ($+Y$)', u: 'mT', min: 0.1, max: 20, step: 0.1 },
    { k: 'E', t: 'Campo $E$ ($-Z$)', u: 'kV/m', min: 0, max: 200, step: 1 },
    { k: 'sp', t: 'Escala temporal', u: '×', min: 0.1, max: 4, step: 0.1 }
  ];

  let sim;
  let ekHist = [];
  const EK_MAX = 160;

  function syncThemeColors() {
    const pal = Sim.scene.getPalette();
    trailMat.color.setHex(pal.I);
    vA.setColor(pal.v);
    bPartA.setColor(pal.B);
    vxbA.setColor(pal.vxb);
    fA.setColor(pal.F);
    feA.setColor(pal.mu);
    bgArrows.forEach((a) => a.setColor(pal.B));
  }

  function buildSpectrometerReference(s) {
    Sim.scene.clearGroup(specGrp);
    if (SA.preset !== 'espectrometro') return;

    const pal = Sim.scene.getPalette();
    const B = SA.B * 1e-3;
    const v = SA.v * 1e6;
    const [qp, mp] = P.p;
    const [qa, ma] = P.a;
    const rpVis = ((mp * v) / (qp * B)) * s.s;
    const raVis = ((ma * v) / (qa * B)) * s.s;

    const makeOrbitCircle = (rVis, color) => {
      const pts = [];
      const N = 72;
      for (let i = 0; i <= N; i++) {
        const a = (2 * Math.PI * i) / N;
        pts.push(V(rVis * Math.sin(a), 0, rVis * (1 - Math.cos(a))));
      }
      return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
      );
    };

    specGrp.add(makeOrbitCircle(rpVis, pal.v));
    specGrp.add(makeOrbitCircle(raVis, pal.F));
  }

  const MANUAL_KEYS = new Set(['part', 'v', 'th', 'B', 'E']);

  function initA(changedKey) {
    if (changedKey && MANUAL_KEYS.has(changedKey) && SA.preset !== 'libre') {
      SA.preset = 'libre';
      if (Sim.ui && Sim.ui.syncControls) Sim.ui.syncControls();
    }

    syncThemeColors();

    const [q, m] = P[SA.part];
    const B = SA.B * 1e-3;
    const E = SA.E * 1e3;
    const v = SA.v * 1e6;
    const th = (SA.th * Math.PI) / 180;
    const T = (2 * Math.PI * m) / (Math.abs(q) * B);
    const rc = (m * v) / (Math.abs(q) * B);

    const rVis = 2.5 * Math.max(0.35, Math.min(2.6, Math.pow((SA.v / 5) * (2 / SA.B), 0.45)));

    sim = {
      q,
      m,
      B: V(0, B, 0),
      E: V(0, 0, -E),
      x: V(),
      v: V(v * Math.sin(th), v * Math.cos(th), 0),
      dt: T / 120,
      t: 0,
      s: rVis / rc,
      Ek0: 0.5 * m * v * v,
      v0: v,
      th,
      acc: 0
    };

    trail.n = 0;
    ekHist = [[0, sim.Ek0 / E_]];
    const pal = Sim.scene.getPalette();
    ball.material.color.setHex(q > 0 ? pal.F : pal.south);
    if (!Sim.freeCam) {
      const off = cam.position.clone().sub(ctl.target);
      if (off.lengthSq() > 0.01) {
        ctl.target.set(0, 0, 0);
        cam.position.copy(off);
      }
    }
    buildSpectrometerReference(sim);
    pushT();
    visA();
    roA();
  }

  function boris(s, dt) {
    const qm = ((s.q / s.m) * dt) / 2;
    const vm = s.v.clone().addScaledVector(s.E, qm);
    const t = s.B.clone().multiplyScalar(qm);
    const sv = t.clone().multiplyScalar(2 / (1 + t.lengthSq()));
    const vpr = vm.clone().add(vm.clone().cross(t));
    const vpl = vm.clone().add(vpr.cross(sv));
    s.v.copy(vpl.addScaledVector(s.E, qm));
    s.x.addScaledVector(s.v, dt);
    s.t += dt;
  }

  function pushT() {
    if (trail.n === TN) {
      tp.copyWithin(0, 3);
      trail.n--;
    }
    const i = trail.n++ * 3;
    tp[i] = sim.x.x * sim.s;
    tp[i + 1] = sim.x.y * sim.s;
    tp[i + 2] = sim.x.z * sim.s;
  }

  function visA() {
    const s = sim;
    const p = s.x.clone().multiplyScalar(s.s);
    tg.attributes.position.needsUpdate = true;
    tg.setDrawRange(0, trail.n);
    ball.position.copy(p);

    const vLen = s.v.length();
    vA.visible = vLen > 1e-9;
    if (vA.visible) {
      vA.position.copy(p);
      vA.setDirection(s.v.clone().divideScalar(vLen));
    }

    const showRhr = SA.rhr === 'si';
    bPartA.visible = showRhr;
    if (showRhr) {
      bPartA.position.copy(p);
      bPartA.setDirection(V(0, 1, 0));
    }

    const vxb = s.v.clone().cross(s.B);
    const vxbLen = vxb.length();
    vxbA.visible = showRhr && vxbLen > 1e-12;
    if (vxbA.visible) {
      vxbA.position.copy(p);
      vxbA.setDirection(vxb.clone().divideScalar(vxbLen));
    }

    const FE = s.E.clone().multiplyScalar(s.q);
    const feLen = FE.length();
    feA.visible = showRhr && feLen > 1e-20;
    if (feA.visible) {
      feA.position.copy(p);
      feA.setDirection(FE.clone().divideScalar(feLen));
    }

    const F = s.E.clone().add(vxb).multiplyScalar(s.q);
    const thr = 1e-5 * Math.abs(s.q) * (s.v0 * s.B.y + Math.abs(s.E.z));
    const fLen = F.length();
    fA.visible = fLen > thr;
    if (fA.visible) {
      fA.position.copy(p);
      fA.setDirection(F.divideScalar(fLen));
    }
    Bg.position.set(p.x, 0, p.z);
  }

  function roA() {
    const s = sim;
    const v = s.v0;
    const sTh = Math.abs(Math.sin(s.th)) < 1e-12 ? 0 : Math.sin(s.th);
    const cTh = Math.abs(Math.cos(s.th)) < 1e-12 ? 0 : Math.cos(s.th);
    const vp = v * sTh;
    const vl = v * cTh;
    const B = s.B.y;
    const E = Math.abs(s.E.z);
    const T = (2 * Math.PI * s.m) / (Math.abs(s.q) * B);
    const Ek = 0.5 * s.m * s.v.lengthSq();
    const rGyro = (s.m * vp) / (Math.abs(s.q) * B);
    const mqRatio = s.m / Math.abs(s.q);

    ro([
      ['Radio de Larmor $r$', fm(rGyro), 'm', { primary: true }],
      ['Energía cinética $E_k$', fm(Ek / E_), 'eV', { primary: true }],
      ['Periodo $T$', fm(T), 's'],
      ['Frecuencia $f$', fm(1 / T), 'Hz'],
      ['Paso de hélice $p$', fm(vl * T), 'm'],
      ['Deriva $v_d = E/B$', fm(E / B), 'm/s'],
      ['Relación $m/|q|$', fm(mqRatio), 'kg/C'],
      ['Deriva de $E_k$', E ? 'E realiza trabajo' : fm((Ek / s.Ek0 - 1) * 100) + ' %'],
      ['Tiempo simulado $t$', fm(s.t), 's']
    ]);
  }

  Sim.registerModule({
    id: 'movimiento-particula',
    title: '5 · Movimiento de partícula cargada',
    group: gA,
    canPause: true,
    canFollow: true,
    cameraPos: [7.5, 5.2, 8.5],
    state: SA,
    getLive() {
      const F = sim.E.clone().add(sim.v.clone().cross(sim.B)).multiplyScalar(sim.q);
      return { p: ball.position, v: sim.v, B: sim.B, E: sim.E, F, q: sim.q, m: sim.m, s: sim.s };
    },
    getPlotData() {
      if (!sim) return null;
      const c = Sim.scene.getPalette().css;
      const tScale = sim.t > 1e-6 ? 1e6 : 1e9;
      const tUnit = sim.t > 1e-6 ? 'μs' : 'ns';
      const pts = ekHist.map(([t, ek]) => [t * tScale, ek]);
      const last = pts[pts.length - 1] || [0, sim.Ek0 / E_];
      return {
        title: 'Energía cinética E_k(t)',
        xLabel: `t (${tUnit})`,
        yUnit: 'eV',
        xMin: pts.length > 1 ? pts[0][0] : 0,
        xMax: pts.length > 1 ? Math.max(pts[pts.length - 1][0], pts[0][0] + 1e-3) : 1,
        series: [{ label: 'E_k(t)', color: c.I, pts }],
        marker: { x: last[0], y: last[1], color: c.F }
      };
    },
    applyPreset(p) {
      SA.preset = p;
      applyPreset(p);
      build(cfgA, SA, initA);
      initA();
    },
    theory:
      '<p>La trayectoria de una carga $q$ de masa $m$ en campos electromagnéticos uniformes obedece la fuerza de Lorentz:</p>' +
      '$$\\vec{F} = q\\,(\\vec{E} + \\vec{v} \\times \\vec{B}), \\qquad r = \\frac{m\\,v_\\perp}{|q|\\,B}, \\qquad T = \\frac{2\\pi\\,m}{|q|\\,B}$$' +
      '<p>Cuando $E = 0$, la energía cinética permanece constante; en campos cruzados con $v_0 = E/B$, las fuerzas eléctrica y magnética se cancelan.</p>',
    activate() {
      build(cfgA, SA, initA);
      initA();
    },
    reset() {
      initA();
    },
    onThemeChange() {
      rebuildRef();
      syncThemeColors();
      if (sim) {
        const pal = Sim.scene.getPalette();
        ball.material.color.setHex(sim.q > 0 ? pal.F : pal.south);
        buildSpectrometerReference(sim);
      }
    },
    update(paused, fr, dt) {
      if (!paused) {
        const step = Math.min(dt || 1 / 60, 0.05);
        sim.acc += 120 * SA.sp * step;
        let n = Math.min(20, Math.floor(sim.acc));
        sim.acc -= n;
        while (n--) {
          boris(sim, sim.dt);
          pushT();
        }
        if (fr % 3 === 0) {
          const ekEv = (0.5 * sim.m * sim.v.lengthSq()) / E_;
          ekHist.push([sim.t, ekEv]);
          if (ekHist.length > EK_MAX) ekHist.shift();
        }
        if (!Sim.freeCam) {
          const o = ctl.target.clone();
          ctl.target.lerp(ball.position, 0.03);
          cam.position.add(ctl.target.clone().sub(o));
        }
      }
      visA();
      if (fr % 6 === 0) {
        roA();
        if (!paused && Sim.plot && Sim.activeMod) Sim.plot.render(Sim.activeMod);
      }
    }
  });
})();
