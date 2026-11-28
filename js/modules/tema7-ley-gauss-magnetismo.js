/* ===== Tema 7: Ley de Gauss del magnetismo (∮ B · dA = 0, ∇·B = 0) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const gF = new THREE.Group();
  scene.add(gF);

  const refGrp = new THREE.Group();
  const srcGrp = new THREE.Group();
  const linesGrp = new THREE.Group();
  const gaussGrp = new THREE.Group();
  gF.add(refGrp, srcGrp, linesGrp, gaussGrp);

  function rebuildRef() {
    Sim.scene.clearGroup(refGrp);
    refGrp.add(Sim.viz.createGrid({ size: 22, majorStep: 4, minorStep: 2, plane: 'xz' }));
    refGrp.add(Sim.viz.createAxes(10, { tickStep: 2, unitLabel: '1 div = 2 cm' }));
  }
  rebuildRef();

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
      t: 'Fuente magnética',
      opts: {
        'Imán de barra (dipolo N–S)': 'dipolo',
        'Espira circular de corriente': 'espira'
      }
    },
    {
      k: 'surf',
      t: 'Superficie gaussiana $S$',
      opts: {
        'Esfera cerrada (radio R_g)': 'esfera',
        'Caja cerrada (lado 2·R_g)': 'caja'
      }
    },
    { k: 'I', t: 'Intensidad $I$', u: 'A', min: 1, max: 20, step: 0.5 },
    { k: 'Rg', t: 'Radio / semilado $R_g$', u: 'cm', min: 3, max: 9, step: 0.5 },
    { k: 'gx', t: 'Centro $x_g$', u: 'cm', min: -7, max: 7, step: 0.5 },
    { k: 'gy', t: 'Centro $y_g$', u: 'cm', min: -7, max: 7, step: 0.5 }
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
        new THREE.TorusGeometry(4.0, 0.2, 16, 72),
        new THREE.MeshStandardMaterial({ color: pal.I, roughness: 0.4, metalness: 0.24 })
      );
      torus.rotation.x = Math.PI / 2;
      srcGrp.add(torus);
      srcGrp.add(Sim.viz.createVector(V(0, 0, -1), V(4.0, 0, 0), 2.1, pal.vxb, { radius: 0.055 }));
      srcGrp.add(Sim.viz.createVector(V(0, 0, 1), V(-4.0, 0, 0), 2.1, pal.vxb, { radius: 0.055 }));
    } else {
      const geoHalf = new THREE.CylinderGeometry(1.5, 1.5, 3.0, 28);
      const north = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: pal.F, roughness: 0.48, metalness: 0.12 })
      );
      north.position.set(0, 1.5, 0);

      const south = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: pal.south, roughness: 0.48, metalness: 0.12 })
      );
      south.position.set(0, -1.5, 0);
      srcGrp.add(north, south);

      const nLbl = Sim.viz.createLabel('N', { color: '#faf9f5', worldHeight: 0.78, depthTest: false });
      const sLbl = Sim.viz.createLabel('S', { color: '#faf9f5', worldHeight: 0.78, depthTest: false });
      if (nLbl) {
        nLbl.position.set(0, 1.6, 1.6);
        srcGrp.add(nLbl);
      }
      if (sLbl) {
        sLbl.position.set(0, -1.6, 1.6);
        srcGrp.add(sLbl);
      }

      srcGrp.add(Sim.viz.createVector(V(0, 1, 0), V(0, -2.5, 0), 5.2, pal.mu, { radius: 0.072, label: 'μ' }));
    }

    const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.56 });
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
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const wireMat = new THREE.MeshBasicMaterial({
      color: pal.gaussSurf,
      wireframe: true,
      transparent: true,
      opacity: 0.24
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
        new THREE.LineBasicMaterial({ color: pal.gaussSurf, transparent: true, opacity: 0.65 })
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
      gaussGrp.add(
        Sim.viz.createVector(B.clone().divideScalar(m), pos, 1.4, color, {
          radius: 0.04,
          headLength: 0.42,
          headRadius: 0.13
        })
      );
    });

    const phiNetNum = phiOut + phiIn;
    const denom = Math.max(phiOut, Math.abs(phiIn), 1e-15);
    const relRes = (Math.abs(phiNetNum) / denom) * 100;
    liveGauss = { phiOut, phiIn, phiNet: phiNetNum };

    ro([
      ['Flujo saliente $\\Phi_{\\text{sal}}$', '+' + fm(phiOut * 1e6), 'μWb', { primary: true }],
      ['Flujo entrante $\\Phi_{\\text{ent}}$', '−' + fm(Math.abs(phiIn) * 1e6), 'μWb', { primary: true }],
      ['Balance numérico', `${fm(phiNetNum * 1e6)} μWb (${fm(relRes)} %)`],
      ['Valor teórico $\\oint_S \\vec{B}\\cdot d\\vec{A}$', '0', 'Wb'],
      ['Superficie $S$', `${SF.surf === 'esfera' ? 'Esfera' : 'Caja'} · ${SF.source === 'dipolo' ? 'Imán N–S' : 'Espira'}`],
      ['Carga magnética $q_m$', '0 (∇·B = 0)']
    ]);
  }

  Sim.registerModule({
    id: 'ley-gauss',
    title: '7 · Ley de Gauss del magnetismo',
    group: gF,
    canPause: false,
    cameraPos: [14.5, 10.5, 21.5],
    state: SF,
    getLive() {
      return liveGauss;
    },
    theory:
      '<p>Las líneas de campo magnético son curvas cerradas sin principio ni fin. Por ello, el flujo magnético neto a través de cualquier superficie cerrada $S$ es idénticamente nulo:</p>' +
      '$$\\oint_S \\vec{B} \\cdot d\\vec{A} = 0 \\iff \\nabla \\cdot \\vec{B} = 0$$' +
      '<p>Esta ley expresa la ausencia de monopolos magnéticos aislados.</p>',
    activate() {
      build(cfgF, SF, onF);
      onF();
    },
    reset() {
      onF();
    },
    onThemeChange() {
      rebuildRef();
      onF();
    }
  });
})();
