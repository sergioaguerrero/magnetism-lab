/* ===== Tema 1: Campo magnético (F_B = q v × B, paralelogramo del producto cruz e imán con brújula 3D) ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) return;

  const g0 = new THREE.Group();
  scene.add(g0);

  const refGrp = new THREE.Group();
  const mainGrp = new THREE.Group();
  g0.add(refGrp, mainGrp);

  function rebuildRef() {
    Sim.scene.clearGroup(refGrp);
    refGrp.add(Sim.viz.createGrid({ size: 16, majorStep: 4, minorStep: 2, plane: 'xz' }));
    refGrp.add(Sim.viz.createAxes(7.5, { tickStep: 2, unitLabel: '1 div = 2 cm' }));
  }
  rebuildRef();

  const S0 = {
    modo: 'vectorial',
    signo: 'pos',
    q: 5,
    v: 12,
    B: 150,
    th: 90,
    px: 4,
    py: 3
  };

  const cfg0 = [
    {
      k: 'modo',
      t: 'Subtema',
      opts: {
        'Fuerza F = q(v × B)': 'vectorial',
        'Imán de barra y brújula 3D': 'iman'
      }
    },
    {
      k: 'signo',
      t: 'Signo de la carga $q$',
      opts: {
        'Positiva (q > 0)': 'pos',
        'Negativa (q < 0)': 'neg'
      },
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'q',
      t: 'Carga $|q|$',
      u: 'μC',
      min: 1,
      max: 25,
      step: 1,
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'v',
      t: 'Rapidez $v$',
      u: 'm/s',
      min: 1,
      max: 40,
      step: 1,
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'B',
      t: 'Campo magnético $B$',
      u: 'mT',
      min: 10,
      max: 500,
      step: 10
    },
    {
      k: 'th',
      t: 'Ángulo $\\theta(\\vec{v}, \\vec{B})$',
      u: '°',
      min: 0,
      max: 180,
      step: 1,
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'px',
      t: 'Brújula $x$',
      u: 'cm',
      min: -8,
      max: 8,
      step: 0.5,
      show: () => S0.modo === 'iman'
    },
    {
      k: 'py',
      t: 'Brújula $y$',
      u: 'cm',
      min: -8,
      max: 8,
      step: 0.5,
      show: () => S0.modo === 'iman'
    }
  ];

  function calcMagnetField(p) {
    const rPlus = V(p.x, p.y - 3.0, p.z);
    const rMinus = V(p.x, p.y + 3.0, p.z);
    const d1 = Math.max(0.8, rPlus.length());
    const d2 = Math.max(0.8, rMinus.length());
    const bVec = rPlus
      .divideScalar(d1 * d1 * d1)
      .sub(rMinus.divideScalar(d2 * d2 * d2));
    const scale = S0.B * 1e-3 * 18;
    return bVec.multiplyScalar(scale);
  }

  let liveMagnet = { pp: V(S0.px, S0.py, 0), bLocal: V(0, 1, 0), bMag: 0, angDeg: 0 };
  let compassHandle = null;

  function on0() {
    Sim.scene.clearGroup(mainGrp);
    compassHandle = null;
    const pal = Sim.scene.getPalette();

    if (S0.modo === 'vectorial') {
      const qSign = S0.signo === 'pos' ? 1 : -1;
      const qC = qSign * S0.q * 1e-6;
      const v = S0.v;
      const B = S0.B * 1e-3;
      const thRad = (S0.th * Math.PI) / 180;
      const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.sin(thRad);
      const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);

      /* Líneas de referencia del campo uniforme B (+Y) */
      [-5, 0, 5].forEach((x) => {
        [-5, 5].forEach((z) => {
          mainGrp.add(
            Sim.viz.createVector(V(0, 1, 0), V(x, -3.5, z), 7, pal.B, {
              radius: 0.028,
              headLength: 0.42,
              headRadius: 0.11
            })
          );
        });
      });

      /* Carga puntual en el origen */
      const chargeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 24, 16),
        new THREE.MeshStandardMaterial({
          color: qSign > 0 ? pal.F : pal.south,
          roughness: 0.42,
          metalness: 0.1
        })
      );
      mainGrp.add(chargeMesh);

      const bLen = 4.6;
      const vLen = 4.6;
      const bDir = V(0, 1, 0);
      const vDir = V(sTh, cTh, 0);

      mainGrp.add(Sim.viz.createVector(bDir, V(0, 0, 0), bLen, pal.B, { radius: 0.08, label: 'B' }));
      mainGrp.add(Sim.viz.createVector(vDir, V(0, 0, 0), vLen, pal.v, { radius: 0.08, label: 'v' }));

      if (sTh > 0.02) {
        const pB = bDir.clone().multiplyScalar(bLen * 0.72);
        const pV = vDir.clone().multiplyScalar(vLen * 0.72);
        const pSum = pB.clone().add(pV);
        const paraGeo = new THREE.BufferGeometry().setFromPoints([
          V(0, 0, 0),
          pV,
          pSum,
          V(0, 0, 0),
          pSum,
          pB
        ]);
        paraGeo.computeVertexNormals();
        mainGrp.add(
          new THREE.Mesh(
            paraGeo,
            new THREE.MeshBasicMaterial({
              color: pal.vxb,
              transparent: true,
              opacity: 0.16,
              side: THREE.DoubleSide,
              depthWrite: false
            })
          )
        );
        mainGrp.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), pV, pSum, pB, V(0, 0, 0)]),
            new THREE.LineBasicMaterial({ color: pal.vxb, transparent: true, opacity: 0.65 })
          )
        );

        const vxbLen = Math.max(1.2, 4.6 * sTh);
        mainGrp.add(
          Sim.viz.createVector(V(0, 0, 1), V(0, 0, 0), vxbLen, pal.vxb, {
            radius: 0.072,
            label: 'v×B'
          })
        );

        const fDir = V(0, 0, qSign);
        const fOrigin = qSign > 0 ? V(0, 0.24, 0) : V(0, 0, 0);
        mainGrp.add(
          Sim.viz.createVector(fDir, fOrigin, vxbLen * 1.1, pal.F, {
            radius: 0.088,
            label: 'F_B'
          })
        );
      }

      if (S0.th > 2) {
        const arcPts = [];
        for (let i = 0; i <= 28; i++) {
          const a = (thRad * i) / 28;
          arcPts.push(V(1.9 * Math.sin(a), 1.9 * Math.cos(a), 0));
        }
        mainGrp.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(arcPts),
            new THREE.LineBasicMaterial({ color: pal.arc })
          )
        );
      }

      const vxbMag = v * B * sTh;
      const Fmag = Math.abs(qC) * vxbMag;

      ro([
        ['Fuerza $|\\vec{F}_B|$', fm(Fmag * 1e6), 'μN', { primary: true }],
        ['Producto $|\\vec{v}\\times\\vec{B}|$', fm(vxbMag), 'V/m', { primary: true }],
        ['Carga $q$', (qSign > 0 ? '+' : '−') + fm(S0.q), 'μC'],
        ['Campo $|\\vec{B}|$', fm(S0.B), 'mT'],
        ['Ángulo $\\theta$ ($\\sin\\theta$)', `${S0.th}° (${sTh.toFixed(3)})`],
        ['Dirección de $\\vec{F}_B$', sTh < 1e-3 ? 'Nula (v ∥ B)' : qSign > 0 ? '+Z (paralela a v×B)' : '−Z (opuesta a v×B)']
      ]);
    } else {
      /* Subtema 2: Imán de barra y brújula 3D */
      const geoHalf = new THREE.BoxGeometry(2.1, 3.0, 1.3);
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
      mainGrp.add(north, south);

      const nLbl = Sim.viz.createLabel('N', { color: '#faf9f5', worldHeight: 0.85, depthTest: false });
      const sLbl = Sim.viz.createLabel('S', { color: '#faf9f5', worldHeight: 0.85, depthTest: false });
      if (nLbl) {
        nLbl.position.set(0, 1.8, 0.72);
        mainGrp.add(nLbl);
      }
      if (sLbl) {
        sLbl.position.set(0, -1.8, 0.72);
        mainGrp.add(sLbl);
      }

      const lineMat = new THREE.LineBasicMaterial({ color: pal.B, transparent: true, opacity: 0.62 });
      [-2.8, -1.6, -0.7, 0.7, 1.6, 2.8].forEach((x0) => {
        const s0 = V(x0, 0, 0);
        [1, -1].forEach((dir) => {
          const pts = [s0.clone()];
          let p = s0.clone();
          for (let k = 0; k < 120; k++) {
            const b = calcMagnetField(p);
            if (b.length() < 1e-9) break;
            p = p.clone().add(b.normalize().multiplyScalar(0.28 * dir));
            if (p.length() > 12 || (Math.abs(p.x) < 1.1 && Math.abs(p.y) < 3.0)) break;
            pts.push(p);
          }
          if (pts.length > 1) {
            mainGrp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
          }
        });
      });

      const pp = V(S0.px, S0.py, 0);
      const bLocal = calcMagnetField(pp);
      const bMag = bLocal.length();
      const bDir = bMag > 1e-12 ? bLocal.clone().divideScalar(bMag) : V(0, 1, 0);

      const compassPivot = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 12),
        new THREE.MeshStandardMaterial({ color: pal.vxb, roughness: 0.4, metalness: 0.2 })
      );
      compassPivot.position.copy(pp);
      mainGrp.add(compassPivot);

      /* Volumen invisible más amplio para agarrar la brújula cómodamente con el ratón */
      compassHandle = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 12, 10),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      compassHandle.position.copy(pp);
      mainGrp.add(compassHandle);

      mainGrp.add(Sim.viz.createVector(bDir, pp, 2.5, pal.F, { radius: 0.085 }));
      mainGrp.add(Sim.viz.createVector(bDir.clone().negate(), pp, 2.0, pal.south, { radius: 0.075 }));
      mainGrp.add(Sim.viz.createVector(bDir, pp, 3.6, pal.B, { radius: 0.048, label: 'B' }));

      const angDeg = Number(((Math.atan2(bDir.y, bDir.x) * 180) / Math.PI).toFixed(1));
      liveMagnet = { pp, bLocal, bMag, angDeg };

      ro([
        ['Campo local $|\\vec{B}|$', fm(bMag * 1e3), 'mT', { primary: true }],
        ['Orientación aguja $\\alpha$', String(angDeg), '°', { primary: true }],
        ['Posición $(x, y)$', `(${S0.px}, ${S0.py})`, 'cm'],
        ['Componente $B_x$', fm(bLocal.x * 1e3), 'mT'],
        ['Componente $B_y$', fm(bLocal.y * 1e3), 'mT']
      ]);
    }
  }

  Sim.registerModule({
    id: 'campo-magnetico',
    title: '1 · Campo magnético',
    group: g0,
    canPause: false,
    cameraPos: [10.5, 7.5, 14.5],
    state: S0,
    getLive() {
      return liveMagnet;
    },
    getDragTarget() {
      if (S0.modo !== 'iman' || !compassHandle) return null;
      return {
        object: compassHandle,
        hint: 'Arrastra la brújula en el plano XY',
        getPos: () => V(S0.px, S0.py, 0),
        setPos: (x, y) => {
          S0.px = x;
          S0.py = y;
          on0();
        },
        bounds: { minX: -8, maxX: 8, minY: -8, maxY: 8, step: 0.5 }
      };
    },
    getPlotData() {
      const c = Sim.scene.getPalette().css;
      if (S0.modo === 'vectorial') {
        const qC = S0.q * 1e-6;
        const B = S0.B * 1e-3;
        const pts = [];
        for (let deg = 0; deg <= 180; deg += 3) {
          const fMicro = qC * S0.v * B * Math.sin((deg * Math.PI) / 180) * 1e6;
          pts.push([deg, fMicro]);
        }
        const curF = qC * S0.v * B * Math.sin((S0.th * Math.PI) / 180) * 1e6;
        return {
          title: 'Fuerza magnética |F_B(θ)|',
          xLabel: 'θ (°)',
          yUnit: 'μN',
          xMin: 0,
          xMax: 180,
          yMin: 0,
          series: [{ label: '|F_B| = |q|vB·sin θ', color: c.F, pts }],
          marker: { x: S0.th, y: curF, color: c.F }
        };
      }
      const pts = [];
      for (let x = -8; x <= 8; x += 0.4) {
        const bMt = calcMagnetField(V(x, S0.py, 0)).length() * 1e3;
        pts.push([+x.toFixed(2), bMt]);
      }
      return {
        title: `Perfil |B(x)| en y = ${S0.py} cm`,
        xLabel: 'x (cm)',
        yUnit: 'mT',
        xMin: -8,
        xMax: 8,
        yMin: 0,
        series: [{ label: '|B(x)| dipolar', color: c.B, pts }],
        marker: { x: S0.px, y: liveMagnet.bMag * 1e3, color: c.F }
      };
    },
    theory:
      '<p>La fuerza magnética sobre una carga puntual $q$ que se desplaza con velocidad $\\vec{v}$ en un campo $\\vec{B}$ define operacionalmente el vector de inducción magnética:</p>' +
      Sim.refs.eq('\\vec{F}_B = q\\,(\\vec{v} \\times \\vec{B}), \\qquad |\\vec{F}_B| = |q|\\,v\\,B\\,\\sin\\theta', [
        ['YF', '§27.2'],
        ['GR', '§5.1.2']
      ]) +
      '<p>En el Sistema Internacional, $1\\text{ T} = 1\\text{ N}/(\\text{A}\\cdot\\text{m})$. La fuerza es máxima cuando $\\vec{v}\\perp\\vec{B}$ y se anula cuando $\\vec{v}\\parallel\\vec{B}$.</p>',
    activate() {
      build(cfg0, S0, on0);
      on0();
    },
    reset() {
      on0();
    },
    onThemeChange() {
      rebuildRef();
      on0();
    }
  });
})();
