/* ===== Tema 7: Ley de Gauss del magnetismo (∮ B · dA = 0, ∇·B = 0) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

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
  let liveGauss = { phiOut: 0, phiIn: 0, phiNet: 0 };

  function buildSourceSegments() {
    SG = { m: [], d: [] };
    const addRing = (radius, yCenter, nSeg) => {
      for (let i = 0; i < nSeg; i++) {
        const a0 = (2 * Math.PI * i) / nSeg;
        const a1 = (2 * Math.PI * (i + 1)) / nSeg;
        const p0 = V(radius * Math.cos(a0), yCenter, -radius * Math.sin(a0));
        const p1 = V(radius * Math.cos(a1), yCenter, -radius * Math.sin(a1));
        SG.m.push(p0.clone().add(p1).multiplyScalar(0.5));
        SG.d.push(p1.clone().sub(p0));
      }
    };

    if (SF.source === 'espira') {
      addRing(4.0, 0, 72);
    } else {
      const nRings = 9;
      const Lmag = 6.0;
      for (let k = 0; k < nRings; k++) {
        const y = -Lmag / 2 + (Lmag * k) / (nRings - 1);
        addRing(1.6, y, 36);
      }
    }
  }

  function Bf(p) {
    let x = 0;
    let y = 0;
    let z = 0;
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
    const c = ((MU0 * SF.I * scaleFactor) / (4 * Math.PI)) * 1e4;
    return V(x * c, y * c, z * c);
  }

  function renderSourceAndFieldLines() {
    Sim.scene.clearGroup(srcGrp);
    Sim.scene.clearGroup(linesGrp);
    const pal = Sim.scene.getPalette();

    if (SF.source === 'espira') {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(4.0, 0.22, 16, 72),
        new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.35, metalness: 0.25 })
      );
      torus.rotation.x = Math.PI / 2;
      srcGrp.add(torus);
      srcGrp.add(new THREE.ArrowHelper(V(0, 0, -1), V(4.0, 0, 0), 2.2, pal.arc, 0.7, 0.45));
      srcGrp.add(new THREE.ArrowHelper(V(0, 0, 1), V(-4.0, 0, 0), 2.2, pal.arc, 0.7, 0.45));
    } else {
      const geoHalf = new THREE.CylinderGeometry(1.55, 1.55, 3.0, 28);
      const north = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: pal.F, roughness: 0.4, metalness: 0.15 })
      );
      north.position.set(0, 1.5, 0);

      const south = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4, metalness: 0.15 })
      );
      south.position.set(0, -1.5, 0);
      srcGrp.add(north, south);

      srcGrp.add(new THREE.ArrowHelper(V(0, 1, 0), V(0, -2.5, 0), 5.4, pal.mu, 0.9, 0.55));
    }

    const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.58 });
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
            linesGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
          }
        });
      });
    });
  }

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
      const M = 16;
      const step = (2 * R) / M;
      const dA = step * 1e-2 * (step * 1e-2);
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
    Sim.scene.clearGroup(gaussGrp);
    const pal = Sim.scene.getPalette();

    const cx = SF.gx;
    const cy = SF.gy;
    const R = SF.Rg;

    const surfMat = new THREE.MeshStandardMaterial({
      color: pal.gaussSurf,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const wireMat = new THREE.MeshBasicMaterial({
      color: pal.gaussSurf,
      wireframe: true,
      transparent: true,
      opacity: 0.34
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
        new THREE.LineBasicMaterial({ color: pal.gaussSurf, transparent: true, opacity: 0.75 })
      );
      mesh.position.set(cx, cy, 0);
      edges.position.set(cx, cy, 0);
      gaussGrp.add(mesh, edges);
    }

    const { phiOut, phiIn, sampleArrows } = integrateClosedSurface();

    sampleArrows.forEach(({ pos, B, Bn }) => {
      const m = B.length();
      if (m < 1e-12) return;
      const color = Bn >= 0 ? pal.fluxPos : pal.fluxNeg;
      gaussGrp.add(new THREE.ArrowHelper(B.clone().divideScalar(m), pos, 1.5, color, 0.5, 0.32));
    });

    /* Valores numéricos reales integrados sobre S (sin promediar ni maquillar) */
    const phiNetNum = phiOut + phiIn;
    const denom = Math.max(phiOut, Math.abs(phiIn), 1e-15);
    const relRes = (Math.abs(phiNetNum) / denom) * 100;
    liveGauss = { phiOut, phiIn, phiNet: phiNetNum };

    ro([
      [
        'Superficie cerrada $S$',
        (SF.surf === 'esfera' ? 'Esfera' : 'Caja') +
          ' · ' +
          (SF.source === 'dipolo' ? 'Imán N–S' : 'Espira')
      ],
      ['Flujo saliente numérico $\\Phi_{\\text{sal}}$', '+' + fm(phiOut * 1e6) + ' μWb'],
      ['Flujo entrante numérico $\\Phi_{\\text{ent}}$', '−' + fm(Math.abs(phiIn) * 1e6) + ' μWb'],
      ['Balance numérico $\\Phi_{\\text{sal}} + \\Phi_{\\text{ent}}$', fm(phiNetNum * 1e6) + ' μWb (' + fm(relRes) + ' %)'],
      ['Valor teórico $\\oint_S \\vec{B}\\cdot d\\vec{A}$', '0 Wb (∇·B = 0)'],
      ['Carga magnética $q_m$', '0 (sin monopolos)']
    ]);
  }

  Sim.registerModule({
    id: 'ley-gauss',
    title: '7 · Ley de Gauss del magnetismo',
    group: gF,
    canPause: false,
    cameraPos: [15, 11, 22],
    state: SF,
    getLive() {
      return liveGauss;
    },
    theory:
      '<b>Ley de Gauss del magnetismo (ausencia de monopolos magnéticos):</b>' +
      '$$\\oint_S \\vec{B} \\cdot d\\vec{A} = \\Phi_{\\text{saliente}} + \\Phi_{\\text{entrante}} = 0 \\iff \\nabla \\cdot \\vec{B} = 0$$' +
      '$$\\Phi_{\\text{saliente}} = -\\Phi_{\\text{entrante}}$$' +
      '<ul class="th-list">' +
      '<li><b>Flujo saliente ($\\Phi_{\\text{sal}} > 0$, flechas verdes):</b> Regiones donde el campo sale de $S$ ($\\vec{B}\\cdot\\hat{n} > 0$).</li>' +
      '<li><b>Flujo entrante ($\\Phi_{\\text{ent}} < 0$, flechas rojas):</b> Regiones donde el campo entra a $S$ ($\\vec{B}\\cdot\\hat{n} < 0$).</li>' +
      '</ul>' +
      '<p>Como todas las líneas de campo magnético son curvas cerradas, todo el flujo que sale de cualquier superficie cerrada iguala exactamente al flujo que entra en ella.</p>',
    activate() {
      build(cfgF, SF, onF);
      onF();
    },
    reset() {
      onF();
    },
    onThemeChange() {
      onF();
    }
  });
})();
