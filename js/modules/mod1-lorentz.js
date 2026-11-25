/* ===== Módulo 1 (RF-06 + B-06): Carga en campos E y B, Presets y Regla de la Mano Derecha ===== */
(function () {
  const gA = new THREE.Group();
  scene.add(gA);

  gA.add(new THREE.AxesHelper(3.5));

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
  );
  gA.add(ball);

  const TN = 8000;
  const tp = new Float32Array(TN * 3);
  const tg = new THREE.BufferGeometry();
  const trail = { n: 0 };
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  tg.setDrawRange(0, 0);

  const tl = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0xf59e0b }));
  tl.frustumCulled = false;
  gA.add(tl);

  /* Vectores principales sobre la partícula:
     - vA (azul claro): velocidad v (dedo índice)
     - bPartA (verde): campo B local en la partícula (dedo medio)
     - vxbA (amarillo): producto cruz v × B (pulgar mano derecha)
     - fA (rojo): fuerza magnética / total F = q(E + v × B)
     - feA (magenta): fuerza eléctrica F_E = qE (visible cuando E > 0) */
  const vA = new THREE.ArrowHelper(V(1, 0, 0), V(), 2.1, 0x38bdf8, 0.5, 0.3);
  const bPartA = new THREE.ArrowHelper(V(0, 1, 0), V(), 1.9, 0x22c55e, 0.45, 0.28);
  const vxbA = new THREE.ArrowHelper(V(0, 0, 1), V(), 1.9, 0xfacc15, 0.45, 0.28);
  const fA = new THREE.ArrowHelper(V(1, 0, 0), V(), 2.1, 0xef4444, 0.5, 0.3);
  const feA = new THREE.ArrowHelper(V(0, 0, -1), V(), 2.0, 0xe879f9, 0.48, 0.28);
  gA.add(vA, bPartA, vxbA, fA, feA);

  /* Grupo para órbita de referencia en preset de espectrómetro de masas */
  const specGrp = new THREE.Group();
  gA.add(specGrp);

  const Bg = new THREE.Group();
  [
    [-3, -3],
    [3, -3],
    [-3, 3],
    [3, 3]
  ].forEach(([x, z]) => {
    Bg.add(new THREE.ArrowHelper(V(0, 1, 0), V(x, -1.5, z), 3, 0x22c55e, 0.5, 0.3));
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
      /* Selector de velocidades: v = E / B => 5×10⁶ m/s = (50×10³ V/m) / (10×10⁻³ T) */
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
      t: 'Preset de ejercicio (B-06)',
      opts: {
        '1. Ciclotrón (órbita circular, θ = 90°)': 'ciclotron',
        '2. Hélice magnética (θ = 55°)': 'helice',
        '3. Selector de velocidades (v = E/B, F = 0)': 'selector',
        '4. Espectrómetro de masas (α vs. protón)': 'espectrometro',
        '5. Deriva E×B (cicloide)': 'deriva',
        'Personalizado (ajuste libre)': 'libre'
      },
      onSelect(val) {
        applyPreset(val);
      }
    },
    {
      k: 'rhr',
      t: 'Regla de la mano derecha 3D',
      opts: {
        'Mostrar triedro (v, B, v×B y F)': 'si',
        'Solo vectores v y F': 'no'
      }
    },
    { k: 'part', t: 'Partícula ($q, m$)', opts: { 'Electrón (q = −e)': 'e', 'Protón (q = +e)': 'p', 'Partícula α (q = +2e)': 'a' } },
    { k: 'v', t: 'Rapidez inicial $v_0$', u: '×10⁶ m/s', min: 0.1, max: 30, step: 0.1 },
    { k: 'th', t: 'Ángulo $\\theta$ entre $\\vec{v}$ y $\\vec{B}$', u: '°', min: 0, max: 180, step: 1 },
    { k: 'B', t: 'Campo magnético $B$ ($+Y$)', u: 'mT', min: 0.1, max: 20, step: 0.1 },
    { k: 'E', t: 'Campo eléctrico $E$ ($-Z, \\perp \\vec{B}$)', u: 'kV/m', min: 0, max: 200, step: 1 },
    { k: 'sp', t: 'Velocidad de simulación', u: '×', min: 0.1, max: 4, step: 0.1 }
  ];

  let sim;

  function buildSpectrometerReference(s) {
    specGrp.clear();
    if (SA.preset !== 'espectrometro') return;

    /* En el espectrómetro de masas comparamos el radio del protón (r_p) y de la partícula α (r_α ≈ 2·r_p)
       entrando en el mismo punto (0,0,0) con velocidad +X en campo B (+Y).
       Para q > 0, v(+X) × B(+Y) = +Z, así que el centro de giro está en (0, 0, +r). */
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
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })
      );
    };

    specGrp.add(makeOrbitCircle(rpVis, 0x38bdf8)); // Órbita de referencia del protón (azul)
    specGrp.add(makeOrbitCircle(raVis, 0xef4444)); // Órbita de referencia de partícula α (roja)
  }

  function initA() {
    const [q, m] = P[SA.part];
    const B = SA.B * 1e-3;
    const E = SA.E * 1e3;
    const v = SA.v * 1e6;
    const th = (SA.th * Math.PI) / 180;
    const T = (2 * Math.PI * m) / (Math.abs(q) * B);
    const rc = (m * v) / (Math.abs(q) * B);

    const rVis = 2.5 * Math.max(0.35, Math.min(2.6, Math.pow((SA.v / 5) * (2 / SA.B), 0.45)));

    /* E apunta en -Z para que E × B apunte en +X (la misma dirección de v₀ cuando θ = 90°).
       Así, cuando v = E/B, la fuerza eléctrica qE (-Z) cancela exactamente a la magnética q(v×B) (+Z) */
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
    ball.material.color.set(q > 0 ? 0xef4444 : 0x3b82f6);
    const off = cam.position.clone().sub(ctl.target);
    if (off.lengthSq() > 0.01) {
      ctl.target.set(0, 0, 0);
      cam.position.copy(off);
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
    const vp = v * Math.sin(s.th);
    const vl = v * Math.cos(s.th);
    const B = s.B.y;
    const E = Math.abs(s.E.z);
    const T = (2 * Math.PI * s.m) / (Math.abs(s.q) * B);
    const Ek = 0.5 * s.m * s.v.lengthSq();
    const rGyro = (s.m * vp) / (Math.abs(s.q) * B);
    const mqRatio = s.m / Math.abs(s.q);
    const rhrNote =
      s.q > 0
        ? 'Igual a v × B (q > 0)'
        : 'Opuesto a v × B (q < 0)';

    ro([
      ['Sentido de $\\vec{F}_B$', rhrNote],
      ['Radio $r = \\tfrac{m v_\\perp}{|q|B}$', fm(rGyro) + ' m'],
      ['Relación $\\tfrac{m}{|q|}$', fm(mqRatio) + ' kg/C'],
      ['Periodo $T = \\tfrac{2\\pi m}{|q|B}$', fm(T) + ' s'],
      ['Frecuencia $f = \\tfrac{1}{T}$', fm(1 / T) + ' Hz'],
      ['Paso hélice $p = v_\\parallel T$', fm(vl * T) + ' m'],
      ['Velocidad $v_d = \\tfrac{E}{B}$', fm(E / B) + ' m/s'],
      ['Energía $E_k = \\tfrac{1}{2}mv^2$', fm(Ek / E_) + ' eV'],
      ['Conservación de $E_k$', E ? 'E realiza trabajo' : fm((Ek / s.Ek0 - 1) * 100) + ' %'],
      ['Tiempo simulado $t$', fm(s.t) + ' s']
    ]);
  }

  Sim.registerModule({
    id: 'A',
    title: '1 · Carga en E y B',
    group: gA,
    canPause: true,
    cameraPos: [7, 5, 8],
    state: SA,
    applyPreset(p) {
      SA.preset = p;
      applyPreset(p);
      build(cfgA, SA, initA);
      initA();
    },
    theory:
      '<b>Fuerza de Lorentz y movimiento en campos $\\vec{E}$ y $\\vec{B}$:</b>' +
      '$$\\vec{F} = q\\,(\\vec{E} + \\vec{v} \\times \\vec{B}), \\qquad \\vec{v}_d = \\frac{\\vec{E}\\times\\vec{B}}{B^2}$$' +
      '$$r = \\frac{m\\,v_\\perp}{|q|\\,B}, \\qquad T = \\frac{2\\pi\\,m}{|q|\\,B}, \\qquad p = v_\\parallel\\,T$$' +
      '<b>Regla de la mano derecha (triedro 3D):</b> índice $= \\vec{v}$ (azul), medio $= \\vec{B}$ (verde), pulgar $= \\vec{v}\\times\\vec{B}$ (amarillo). Si $q > 0$, $\\vec{F}_B$ (roja) apunta como el pulgar; si $q < 0$, se invierte. En el <b>Selector de velocidades</b> ($v = \\frac{E}{B}$), $\\vec{F}_E = -\\vec{F}_B$ y la trayectoria es rectilínea.',
    activate() {
      build(cfgA, SA, initA);
      initA();
    },
    reset() {
      initA();
    },
    update(paused, fr) {
      if (!paused) {
        sim.acc += 2 * SA.sp;
        let n = Math.floor(sim.acc);
        sim.acc -= n;
        while (n--) {
          boris(sim, sim.dt);
          pushT();
        }
        const o = ctl.target.clone();
        ctl.target.lerp(ball.position, 0.03);
        cam.position.add(ctl.target.clone().sub(o));
      }
      visA();
      if (fr % 6 === 0) roA();
    }
  });
})();
