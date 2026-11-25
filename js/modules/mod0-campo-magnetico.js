/* ===== Tema 1: Campo magnético (F_B = q v × B, paralelogramo del producto cruz e imán con brújula 3D) ===== */
(function () {
  const g0 = new THREE.Group();
  scene.add(g0);

  g0.add(new THREE.AxesHelper(8));

  const mainGrp = new THREE.Group();
  g0.add(mainGrp);

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
      t: 'Subtema de campo magnético',
      opts: {
        'Fuerza F = q(v × B) y Mano Derecha': 'vectorial',
        'Imán de barra (N–S) y Brújula 3D': 'iman'
      }
    },
    {
      k: 'signo',
      t: 'Signo de la carga de prueba q',
      opts: {
        'Positiva (q > 0, F ∥ v × B)': 'pos',
        'Negativa (q < 0, F opuesta a v × B)': 'neg'
      },
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'q',
      t: 'Magnitud de carga $|q|$',
      u: 'μC',
      min: 1,
      max: 25,
      step: 1,
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'v',
      t: 'Rapidez de la partícula $v$',
      u: 'm/s',
      min: 1,
      max: 40,
      step: 1,
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'B',
      t: 'Intensidad de campo magnético $B$',
      u: 'mT',
      min: 10,
      max: 500,
      step: 10
    },
    {
      k: 'th',
      t: 'Ángulo $\\theta$ entre $\\vec{v}$ y $\\vec{B}$',
      u: '°',
      min: 0,
      max: 180,
      step: 1,
      show: () => S0.modo === 'vectorial'
    },
    {
      k: 'px',
      t: 'Posición brújula $x$',
      u: 'cm',
      min: -8,
      max: 8,
      step: 0.5,
      show: () => S0.modo === 'iman'
    },
    {
      k: 'py',
      t: 'Posición brújula $y$',
      u: 'cm',
      min: -8,
      max: 8,
      step: 0.5,
      show: () => S0.modo === 'iman'
    }
  ];

  /* Campo dipolar de un imán de barra vertical (-3 cm a +3 cm en Y) */
  function calcMagnetField(p) {
    const rPlus = V(p.x, p.y - 3.0, p.z);
    const rMinus = V(p.x, p.y + 3.0, p.z);
    const d1 = Math.max(0.8, rPlus.length());
    const d2 = Math.max(0.8, rMinus.length());
    const bVec = rPlus
      .divideScalar(d1 * d1 * d1)
      .sub(rMinus.divideScalar(d2 * d2 * d2));
    const scale = (S0.B * 1e-3) * 18;
    return bVec.multiplyScalar(scale);
  }

  function on0() {
    mainGrp.clear();

    if (S0.modo === 'vectorial') {
      const qSign = S0.signo === 'pos' ? 1 : -1;
      const qC = qSign * S0.q * 1e-6;
      const v = S0.v;
      const B = S0.B * 1e-3;
      const thRad = (S0.th * Math.PI) / 180;
      const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.sin(thRad);
      const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);

      /* Fondo de líneas de campo magnético B uniforme (+Y) */
      [-5, 0, 5].forEach((x) => {
        [-5, 5].forEach((z) => {
          mainGrp.add(new THREE.ArrowHelper(V(0, 1, 0), V(x, -4, z), 8, 0x22c55e, 0.55, 0.32));
        });
      });

      /* Esfera de la carga puntual en el origen */
      const chargeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 24, 16),
        new THREE.MeshStandardMaterial({
          color: qSign > 0 ? 0xef4444 : 0x3b82f6,
          roughness: 0.3,
          metalness: 0.15
        })
      );
      mainGrp.add(chargeMesh);

      /* Vectores del triedro en el origen:
         - B en +Y (verde)
         - v en el plano XY formando ángulo θ con +Y: vDir = (sin θ, cos θ, 0) (azul claro)
         - v × B en +Z cuando sin θ > 0 (amarillo)
         - F_B = q(v × B) en ±Z (rojo) */
      const bLen = 4.6;
      const vLen = 4.6;
      const bDir = V(0, 1, 0);
      const vDir = V(sTh, cTh, 0);

      mainGrp.add(new THREE.ArrowHelper(bDir, V(0, 0, 0), bLen, 0x22c55e, 0.85, 0.5));
      mainGrp.add(new THREE.ArrowHelper(vDir, V(0, 0, 0), vLen, 0x38bdf8, 0.85, 0.5));

      /* Paralelogramo sombreado que representa geométricamente |v × B| = v·B·sin θ */
      if (sTh > 0.02) {
        const pB = bDir.clone().multiplyScalar(bLen * 0.75);
        const pV = vDir.clone().multiplyScalar(vLen * 0.75);
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
        const paraMesh = new THREE.Mesh(
          paraGeo,
          new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide
          })
        );
        mainGrp.add(paraMesh);

        const paraBorder = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), pV, pSum, pB, V(0, 0, 0)]),
          new THREE.LineBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.6 })
        );
        mainGrp.add(paraBorder);

        /* Vector pulgar v × B (amarillo en +Z) */
        const vxbLen = Math.max(1.2, 4.8 * sTh);
        mainGrp.add(new THREE.ArrowHelper(V(0, 0, 1), V(0, 0, 0), vxbLen, 0xfacc15, 0.85, 0.5));

        /* Vector Fuerza Magnética F_B = q(v × B) (rojo, en +Z si q>0 o en -Z si q<0) */
        const fDir = V(0, 0, qSign);
        const fOrigin = qSign > 0 ? V(0, 0.25, 0) : V(0, 0, 0);
        mainGrp.add(new THREE.ArrowHelper(fDir, fOrigin, vxbLen * 1.08, 0xef4444, 0.9, 0.55));
      }

      /* Arco del ángulo θ entre B (+Y) y v */
      if (S0.th > 2) {
        const arcPts = [];
        for (let i = 0; i <= 24; i++) {
          const a = (thRad * i) / 24;
          arcPts.push(V(2.0 * Math.sin(a), 2.0 * Math.cos(a), 0));
        }
        mainGrp.add(
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(arcPts),
            new THREE.LineBasicMaterial({ color: 0xfef08a })
          )
        );
      }

      const vxbMag = v * B * sTh;
      const Fmag = Math.abs(qC) * vxbMag;

      ro([
        ['Carga de prueba $q$', (qSign > 0 ? '+' : '−') + fm(S0.q) + ' μC'],
        ['Campo magnético $|\\vec{B}|$', fm(S0.B) + ' mT (' + fm(B) + ' T)'],
        ['Ángulo $\\theta$ y factor $\\sin\\theta$', S0.th + '° (sin θ = ' + sTh.toFixed(3) + ')'],
        ['Producto cruz $|\\vec{v}\\times\\vec{B}| = v B \\sin\\theta$', fm(vxbMag) + ' V/m'],
        ['Fuerza magnética $|\\vec{F}_B| = |q| v B \\sin\\theta$', fm(Fmag * 1e6) + ' μN (' + fm(Fmag) + ' N)'],
        ['Dirección de $\\vec{F}_B$', sTh < 1e-3 ? 'Nula (v ∥ B)' : qSign > 0 ? '+Z (igual a v × B)' : '−Z (opuesta a v × B)']
      ]);
    } else {
      /* Subtema 2: Imán de barra (Polos Norte y Sur) y brújula 3D */
      const geoHalf = new THREE.BoxGeometry(2.2, 3.0, 1.4);
      const north = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 })
      );
      north.position.set(0, 1.5, 0);
      const south = new THREE.Mesh(
        geoHalf,
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35 })
      );
      south.position.set(0, -1.5, 0);
      mainGrp.add(north, south);

      /* Líneas de campo saliendo del Polo Norte (+Y) y entrando al Polo Sur (-Y) */
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
            mainGrp.add(
              new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.65 })
              )
            );
          }
        });
      });

      /* Brújula 3D en la posición (px, py, 0) que se alinea con el vector B local */
      const pp = V(S0.px, S0.py, 0);
      const bLocal = calcMagnetField(pp);
      const bMag = bLocal.length();
      const bDir = bMag > 1e-12 ? bLocal.clone().divideScalar(bMag) : V(0, 1, 0);

      const compassPivot = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xfef08a })
      );
      compassPivot.position.copy(pp);
      mainGrp.add(compassPivot);

      /* Aguja norte de la brújula (roja, apunta en la dirección de B) y aguja sur (azul, en -B) */
      mainGrp.add(new THREE.ArrowHelper(bDir, pp, 2.6, 0xef4444, 0.75, 0.48));
      mainGrp.add(new THREE.ArrowHelper(bDir.clone().negate(), pp, 2.2, 0x3b82f6, 0.6, 0.35));
      mainGrp.add(new THREE.ArrowHelper(bDir, pp, 3.8, 0x22c55e, 0.8, 0.5));

      const angDeg = ((Math.atan2(bDir.y, bDir.x) * 180) / Math.PI).toFixed(1);

      ro([
        ['Posición de la brújula $(x, y)$', `(${S0.px} cm, ${S0.py} cm)`],
        ['Magnitud local $|\\vec{B}|$', fm(bMag * 1e3) + ' mT'],
        ['Componentes $(B_x, B_y)$', `${fm(bLocal.x * 1e3)} · ${fm(bLocal.y * 1e3)} mT`],
        ['Orientación de la aguja Norte', angDeg + '° (tangente a las líneas de B)'],
        ['Polos del imán', 'Salen de Norte (+Y, rojo) → Entran a Sur (−Y, azul)']
      ]);
    }
  }

  Sim.registerModule({
    id: 'M0',
    title: '1 · Campo magnético',
    group: g0,
    canPause: false,
    cameraPos: [10, 8, 16],
    state: S0,
    theory:
      '<b>Definición del campo magnético $\\vec{B}$ y fuerza sobre una carga:</b>' +
      '$$\\vec{F}_B = q\\,(\\vec{v} \\times \\vec{B}), \\qquad |\\vec{F}_B| = |q|\\,v\\,B\\,\\sin\\theta \\quad [1\\text{ T} = 1\\text{ N}/(\\text{A}\\cdot\\text{m})]$$' +
      '<ul class="th-list">' +
      '<li><b>Dedo índice ($\\vec{v}$, azul):</b> Dirección de la velocidad de la carga.</li>' +
      '<li><b>Dedo medio ($\\vec{B}$, verde):</b> Dirección de las líneas de campo magnético.</li>' +
      '<li><b>Pulgar ($\\vec{v}\\times\\vec{B}$, amarillo):</b> Perpendicular al paralelogramo formado por $\\vec{v}$ y $\\vec{B}$.</li>' +
      '<li><b>Fuerza $\\vec{F}_B$ (roja):</b> Es máxima cuando $\\theta = 90^\\circ$ y nula cuando $\\vec{v} \\parallel \\vec{B}$ ($\\theta = 0^\\circ$ o $180^\\circ$).</li>' +
      '</ul>',
    activate() {
      build(cfg0, S0, on0);
      on0();
    },
    reset() {
      on0();
    }
  });
})();
