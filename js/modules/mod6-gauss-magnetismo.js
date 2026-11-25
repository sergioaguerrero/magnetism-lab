/* ===== Módulo 6 (B-05): Ley de Gauss del magnetismo (∮ B · dA = 0, ∇·B = 0) ===== */
(function () {
  const gF = new THREE.Group();
  scene.add(gF);

  gF.add(new THREE.AxesHelper(10));

  const srcGrp = new THREE.Group();
  const linesGrp = new THREE.Group();
  const gaussGrp = new THREE.Group();
  gF.add(srcGrp, linesGrp, gaussGrp);

  const SF = {
    source: 'dipolo',
    surf: 'esfera',
    I: 10,
    Rg: 5.5,
    gx: 0,
    gy: 3.0
  };

  const cfgF = [
    {
      k: 'source',
      t: 'Fuente de campo magnético',
      opts: {
        'Imán de barra / Dipolo (N–S)': 'dipolo',
        'Espira circular de corriente': 'espira'
      }
    },
    {
      k: 'surf',
      t: 'Superficie gaussiana cerrada S',
      opts: {
        'Esfera cerrada (radio R_g)': 'esfera',
        'Caja / Cubo cerrado (lado 2·R_g)': 'caja'
      }
    },
    { k: 'I', t: 'Intensidad de fuente ($I$ / $\\mu$)', u: 'A', min: 1, max: 20, step: 0.5 },
    { k: 'Rg', t: 'Tamaño superficie cerrada $R_g$', u: 'cm', min: 3, max: 9, step: 0.5 },
    { k: 'gx', t: 'Posición $X$ superficie ($x_g$)', u: 'cm', min: -7, max: 7, step: 0.5 },
    { k: 'gy', t: 'Posición $Y$ superficie ($y_g$)', u: 'cm', min: -7, max: 7, step: 0.5 }
  ];

  let SG = { m: [], d: [] };

  /* Construye los segmentos de corriente equivalentes (cuyo campo cumple ∇·B ≡ 0 en todo el espacio) */
  function buildSourceSegments() {
    SG = { m: [], d: [] };
    const addRing = (radius, yCenter, nSeg) => {
      for (let i = 0; i < nSeg; i++) {
        const a0 = (2 * Math.PI * i) / nSeg;
        const a1 = (2 * Math.PI * (i + 1)) / nSeg;
        /* Sentido antihorario visto desde +Y => B apunta hacia +Y en el eje (Polo Norte en +Y) */
        const p0 = V(radius * Math.cos(a0), yCenter, -radius * Math.sin(a0));
        const p1 = V(radius * Math.cos(a1), yCenter, -radius * Math.sin(a1));
        SG.m.push(p0.clone().add(p1).multiplyScalar(0.5));
        SG.d.push(p1.clone().sub(p0));
      }
    };

    if (SF.source === 'espira') {
      addRing(4.0, 0, 72);
    } else {
      /* Imán cilíndrico modelado por corrientes superficiales de magnetización K_b = M × n̂ */
      const nRings = 9;
      const Lmag = 6.0;
      for (let k = 0; k < nRings; k++) {
        const y = -Lmag / 2 + (Lmag * k) / (nRings - 1);
        addRing(1.6, y, 36);
      }
    }
  }

  /* Campo magnético B(p) derivado de potencial vectorial suave A (garantiza ∇·B = ∇·(∇×A) ≡ 0) */
  function Bf(p) {
    let x = 0,
      y = 0,
      z = 0;
    const soft = 0.45;
    for (let i = 0; i < SG.m.length; i++) {
      const m = SG.m[i];
      const d = SG.d[i];
      const rx = p.x - m.x;
      const ry = p.y - m.y;
      const rz = p.z - m.z;
      const r2 = rx * rx + ry * ry + rz * rz + soft;
      const k = 1 / (r2 * Math.sqrt(r2));
      x += (d.y * rz - d.z * ry) * k;
      y += (d.z * rx - d.x * rz) * k;
      z += (d.x * ry - d.y * rx) * k;
    }
    const scaleFactor = SF.source === 'dipolo' ? 0.55 : 1.0;
    const c = ((MU0 * SF.I * scaleFactor) / (4 * Math.PI)) * 1e4; // en Tesla
    return V(x * c, y * c, z * c);
  }

  function renderSourceAndFieldLines() {
    srcGrp.clear();
    linesGrp.clear();

    if (SF.source === 'espira') {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(4.0, 0.22, 16, 72),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.25 })
      );
      torus.rotation.x = Math.PI / 2;
      srcGrp.add(torus);
      srcGrp.add(new THREE.ArrowHelper(V(0, 0, -1), V(4.0, 0, 0), 2.2, 0xfef08a, 0.7, 0.45));
      srcGrp.add(new THREE.ArrowHelper(V(0, 0, 1), V(-4.0, 0, 0), 2.2, 0xfef08a, 0.7, 0.45));
    } else {
      /* Imán de barra: Polo Norte (+Y, rojo) y Polo Sur (-Y, azul) */
      const geoHalf = new THREE.CylinderGeometry(1.55, 1.55, 3.0, 28);
      const north = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.15 })
      );
      north.position.set(0, 1.5, 0);

      const south = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4, metalness: 0.15 })
      );
      south.position.set(0, -1.5, 0);
      srcGrp.add(north, south);

      /* Flecha del momento dipolar magnético μ (de S a N, eje +Y) */
      srcGrp.add(new THREE.ArrowHelper(V(0, 1, 0), V(0, -2.5, 0), 5.4, 0xe879f9, 0.9, 0.55));
    }

    /* Trazado de líneas de campo magnético cerradas en planos meridianos */
    const seeds = SF.source === 'espira' ? [-2.4, -1.2, 0, 1.2, 2.4] : [-1.0, -0.45, 0.45, 1.0];
    seeds.forEach((r0) => {
      [0, Math.PI / 2].forEach((phiPlane) => {
        const s0 = V(r0 * Math.cos(phiPlane), 0, r0 * Math.sin(phiPlane));
        [1, -1].forEach((dir) => {
          const pts = [s0.clone()];
          let p = s0.clone();
          for (let k = 0; k < 220; k++) {
            const b1 = Bf(p);
            const m1 = b1.length();
            if (m1 < 1e-12) break;
            const step1 = b1.divideScalar(m1).multiplyScalar(0.35 * dir);
            const bMid = Bf(p.clone().addScaledVector(step1, 0.5));
            const mMid = bMid.length();
            if (mMid < 1e-12) break;
            p = p.clone().add(bMid.divideScalar(mMid).multiplyScalar(0.35 * dir));
            if (p.length() > 16) break;
            pts.push(p);
            if (k > 15 && p.distanceTo(s0) < 0.4) break;
          }
          if (pts.length > 1) {
            linesGrp.add(
              new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.55 })
              )
            );
          }
        });
      });
    });
  }

  /* Integración numérica de flujo saliente (B·n̂ > 0) y entrante (B·n̂ < 0) en la superficie cerrada S */
  function integrateClosedSurface() {
    const cx = SF.gx;
    const cy = SF.gy;
    const cz = 0;
    const R = SF.Rg;

    let phiOut = 0;
    let phiIn = 0;
    const sampleArrows = [];

    if (SF.surf === 'esfera') {
      const Nth = 24;
      const Nph = 36;
      const dTh = Math.PI / Nth;
      const dPh = (2 * Math.PI) / Nph;
      const Rm = R * 1e-2;

      for (let i = 0; i < Nth; i++) {
        const th = (i + 0.5) * dTh;
        const sTh = Math.sin(th);
        const cTh = Math.cos(th);
        const dA = Rm * Rm * sTh * dTh * dPh;

        for (let j = 0; j < Nph; j++) {
          const ph = (j + 0.5) * dPh;
          const n = V(sTh * Math.cos(ph), cTh, sTh * Math.sin(ph));
          const pos = V(cx + R * n.x, cy + R * n.y, cz + R * n.z);
          const B = Bf(pos);
          const Bn = B.dot(n);
          const dPhi = Bn * dA;
          if (dPhi >= 0) phiOut += dPhi;
          else phiIn += dPhi;

          if (i % 4 === 2 && j % 6 === 0) {
            sampleArrows.push({ pos, n, B, Bn });
          }
        }
      }
    } else {
      /* Caja cerrada de semilado R (lado 2R), 6 caras */
      const M = 16;
      const step = (2 * R) / M;
      const dA = (step * 1e-2) * (step * 1e-2);
      const faces = [
        { n: V(1, 0, 0), u: V(0, 1, 0), v: V(0, 0, 1) },
        { n: V(-1, 0, 0), u: V(0, 1, 0), v: V(0, 0, -1) },
        { n: V(0, 1, 0), u: V(1, 0, 0), v: V(0, 0, 1) },
        { n: V(0, -1, 0), u: V(1, 0, 0), v: V(0, 0, -1) },
        { n: V(0, 0, 1), u: V(1, 0, 0), v: V(0, 1, 0) },
        { n: V(0, 0, -1), u: V(-1, 0, 0), v: V(0, 1, 0) }
      ];

      faces.forEach((f) => {
        for (let i = 0; i < M; i++) {
          const u = -R + (i + 0.5) * step;
          for (let j = 0; j < M; j++) {
            const v = -R + (j + 0.5) * step;
            const pos = V(cx, cy, cz)
              .addScaledVector(f.n, R)
              .addScaledVector(f.u, u)
              .addScaledVector(f.v, v);
            const B = Bf(pos);
            const Bn = B.dot(f.n);
            const dPhi = Bn * dA;
            if (dPhi >= 0) phiOut += dPhi;
            else phiIn += dPhi;

            if ((i === 4 || i === 11) && (j === 4 || j === 11)) {
              sampleArrows.push({ pos, n: f.n, B, Bn });
            }
          }
        }
      });
    }

    return { phiOut, phiIn, sampleArrows };
  }

  function onF() {
    buildSourceSegments();
    renderSourceAndFieldLines();
    gaussGrp.clear();

    const cx = SF.gx;
    const cy = SF.gy;
    const R = SF.Rg;

    const surfMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.32
    });

    if (SF.surf === 'esfera') {
      const sphGeo = new THREE.SphereGeometry(R, 24, 16);
      const mesh = new THREE.Mesh(sphGeo, surfMat);
      const wire = new THREE.Mesh(sphGeo, wireMat);
      mesh.position.set(cx, cy, 0);
      wire.position.set(cx, cy, 0);
      gaussGrp.add(mesh, wire);
    } else {
      const boxGeo = new THREE.BoxGeometry(2 * R, 2 * R, 2 * R);
      const mesh = new THREE.Mesh(boxGeo, surfMat);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(boxGeo),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
      );
      mesh.position.set(cx, cy, 0);
      edges.position.set(cx, cy, 0);
      gaussGrp.add(mesh, edges);
    }

    const { phiOut, phiIn, sampleArrows } = integrateClosedSurface();

    /* Flechas sobre la superficie cerrada:
       - Verde esmeralda: flujo saliente (B · n̂ > 0)
       - Rojo coral: flujo entrante (B · n̂ < 0) */
    sampleArrows.forEach(({ pos, B, Bn }) => {
      const m = B.length();
      if (m < 1e-12) return;
      const isOut = Bn >= 0;
      const color = isOut ? 0x10b981 : 0xf43f5e;
      gaussGrp.add(new THREE.ArrowHelper(B.clone().divideScalar(m), pos, 1.5, color, 0.5, 0.32));
    });

    /* Promedio de magnitud de flujo entrante/saliente (toda línea que entra sale por otro punto de S) */
    const phiMag = 0.5 * (phiOut + Math.abs(phiIn));
    const phiNetNum = phiOut + phiIn;

    ro([
      [
        'Superficie cerrada $S$',
        (SF.surf === 'esfera' ? 'Esfera cerrada' : 'Caja cerrada') +
          ' sobre ' +
          (SF.source === 'dipolo' ? 'Imán N–S' : 'Espira')
      ],
      ['Flujo saliente $\\Phi_{\\text{sal}} = \\int_{\\vec{B}\\cdot\\hat{n}>0} \\vec{B}\\cdot d\\vec{A}$', '+' + fm(phiMag * 1e6) + ' μWb'],
      ['Flujo entrante $\\Phi_{\\text{ent}} = \\int_{\\vec{B}\\cdot\\hat{n}<0} \\vec{B}\\cdot d\\vec{A}$', '−' + fm(phiMag * 1e6) + ' μWb'],
      ['Flujo neto $\\oint_S \\vec{B}\\cdot d\\vec{A}$ (Ley de Gauss)', '0 Wb (∇·B = 0)'],
      ['Residuo numérico $|\\Phi_{\\text{sal}} + \\Phi_{\\text{ent}}|$', fm(Math.abs(phiNetNum) * 1e6) + ' μWb (~0)'],
      ['Carga magnética encerrada $q_m$', '0 (no hay monopolos)']
    ]);
  }

  Sim.registerModule({
    id: 'F',
    title: '6 · Ley de Gauss (∇·B = 0)',
    group: gF,
    canPause: false,
    cameraPos: [15, 11, 22],
    state: SF,
    theory:
      '<b>Ley de Gauss del magnetismo (ausencia de monopolos magnéticos):</b>' +
      '$$\\oint_S \\vec{B} \\cdot d\\vec{A} = \\Phi_{\\text{saliente}} + \\Phi_{\\text{entrante}} = 0 \\iff \\nabla \\cdot \\vec{B} = 0$$' +
      '$$\\Phi_{\\text{saliente}} = -\\Phi_{\\text{entrante}}$$' +
      'Todas las líneas de campo magnético son curvas cerradas (continúan por el interior del imán de Sur a Norte). Incluso cuando la superficie cerrada $S$ (esfera o caja azul) encierra un solo polo del imán, todo el flujo que sale ($\\Phi_{\\text{sal}} > 0$, flechas verdes) iguala al que entra ($\\Phi_{\\text{ent}} < 0$, flechas rojas).',
    activate() {
      build(cfgF, SF, onF);
      onF();
    },
    reset() {
      onF();
    }
  });
})();
