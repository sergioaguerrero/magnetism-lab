/* ===== Módulo 1: Carga en campos E y B (integrador de Boris) ===== */
(function () {
  const gA = new THREE.Group();
  scene.add(gA);

  gA.add(new THREE.AxesHelper(3.5));

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 24, 16),
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

  const vA = new THREE.ArrowHelper(V(1, 0, 0), V(), 2, 0x38bdf8, 0.5, 0.3);
  const fA = new THREE.ArrowHelper(V(1, 0, 0), V(), 2, 0xef4444, 0.5, 0.3);
  gA.add(vA, fA);

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

  const SA = { part: 'e', v: 5, th: 90, B: 2, E: 0, sp: 1 };
  const cfgA = [
    { k: 'part', t: 'Partícula', opts: { 'Electrón': 'e', 'Protón': 'p', 'Partícula α': 'a' } },
    { k: 'v', t: 'Rapidez v', u: '×10⁶ m/s', min: 0.1, max: 30, step: 0.1 },
    { k: 'th', t: 'Ángulo θ entre v y B', u: '°', min: 0, max: 180, step: 1 },
    { k: 'B', t: 'Campo magnético B (eje Y)', u: 'mT', min: 0.1, max: 20, step: 0.1 },
    { k: 'E', t: 'Campo eléctrico E (eje Z, ⊥ B)', u: 'kV/m', min: 0, max: 200, step: 1 },
    { k: 'sp', t: 'Velocidad de simulación', u: '×', min: 0.1, max: 4, step: 0.1 }
  ];

  let sim;

  function initA() {
    const [q, m] = P[SA.part];
    const B = SA.B * 1e-3;
    const E = SA.E * 1e3;
    const v = SA.v * 1e6;
    const th = (SA.th * Math.PI) / 180;
    const T = (2 * Math.PI * m) / (Math.abs(q) * B);
    const rc = (m * v) / (Math.abs(q) * B);

    sim = {
      q,
      m,
      B: V(0, B, 0),
      E: V(0, 0, E),
      x: V(),
      v: V(v * Math.sin(th), v * Math.cos(th), 0),
      dt: T / 120,
      t: 0,
      s: 2.5 / rc,
      Ek0: 0.5 * m * v * v,
      v0: v,
      th,
      acc: 0
    };

    trail.n = 0;
    ball.material.color.set(q > 0 ? 0xef4444 : 0x3b82f6);
    const off = cam.position.clone().sub(ctl.target);
    ctl.target.set(0, 0, 0);
    cam.position.copy(off);
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
    vA.position.copy(p);
    vA.setDirection(s.v.clone().normalize());

    const F = s.E.clone().add(s.v.clone().cross(s.B)).multiplyScalar(s.q);
    const thr = 1e-6 * Math.abs(s.q) * (s.v0 * s.B.y + s.E.z);
    fA.visible = F.length() > thr;
    if (fA.visible) {
      fA.position.copy(p);
      fA.setDirection(F.normalize());
    }
    Bg.position.set(p.x, 0, p.z);
  }

  function roA() {
    const s = sim;
    const v = s.v0;
    const vp = v * Math.sin(s.th);
    const vl = v * Math.cos(s.th);
    const B = s.B.y;
    const E = s.E.z;
    const T = (2 * Math.PI * s.m) / (Math.abs(s.q) * B);
    const Ek = 0.5 * s.m * s.v.lengthSq();

    ro([
      ['Radio r = m·v⊥/(|q|B)', fm((s.m * vp) / (Math.abs(s.q) * B)) + ' m'],
      ['Periodo T = 2πm/(|q|B)', fm(T) + ' s'],
      ['Frecuencia ciclotrón f', fm(1 / T) + ' Hz'],
      ['Paso de hélice v∥·T', fm(vl * T) + ' m'],
      ['Deriva E/B', fm(E / B) + ' m/s'],
      ['Energía cinética', fm(Ek / E_) + ' eV'],
      ['Variación de Ek', E ? '— (E realiza trabajo)' : fm((Ek / s.Ek0 - 1) * 100) + ' %'],
      ['Tiempo simulado', fm(s.t) + ' s']
    ]);
  }

  Sim.registerModule({
    id: 'A',
    title: '1 · Carga en E y B',
    group: gA,
    canPause: true,
    cameraPos: [7, 5, 8],
    theory:
      'Fuerza de Lorentz: F = q(E + v × B). En B uniforme la trayectoria es una hélice: radio r = m·v⊥/(|q|B), periodo T = 2πm/(|q|B) (no depende de v) y paso = v∥·T. Si se añade E ⊥ B, el centro de la órbita deriva con v = E×B/B², igual para cualquier carga y masa. Azul claro: v. Rojo: F. Verde: B. Integrador: Boris, que conserva la energía en B puro (mira la variación de Ek).',
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
