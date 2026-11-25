/* ===== Inspector 3D interactivo para el Código de Colores ===== */
(function () {
  let activeKey = null;
  let lastHudTitle = '';
  let lastHudDesc = '';

  /* Marcador 3D luminoso que señala el vector/elemento seleccionado en la escena */
  const markerGrp = new THREE.Group();
  markerGrp.visible = false;
  scene.add(markerGrp);

  const ringGeo = new THREE.RingGeometry(0.42, 0.58, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    depthTest: false
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.renderOrder = 999;

  const haloGeo = new THREE.SphereGeometry(0.38, 16, 12);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
    depthTest: false
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.renderOrder = 998;
  markerGrp.add(ringMesh, haloMesh);

  /* Animación suave de cámara hacia el elemento seleccionado */
  let camAnim = null;

  function animateCameraTo(targetPos, offsetVec) {
    const startTarget = ctl.target.clone();
    const startCam = cam.position.clone();
    const endTarget = targetPos.clone();
    const endCam = targetPos.clone().add(offsetVec);
    camAnim = {
      t0: performance.now(),
      dur: 520,
      startTarget,
      startCam,
      endTarget,
      endCam
    };
  }

  /* Obtiene la posición 3D exacta y los datos en vivo del elemento seleccionado según el módulo activo */
  function getInfo(mod, key) {
    if (!mod) return null;
    const S = mod.state || {};

    /* ===== Tema 1: Campo magnético ===== */
    if (mod.id === 'M0') {
      const thRad = (S.th * Math.PI) / 180;
      const sTh = Math.sin(thRad);
      const cTh = Math.cos(thRad);
      const qSign = S.signo === 'pos' ? 1 : -1;
      const vxb = S.v * (S.B * 1e-3) * Math.abs(sTh);
      const FB = S.q * 1e-6 * vxb;

      if (key === 'B') {
        return {
          pos: V(0, 3.2, 0),
          offset: V(7, 5, 10),
          color: '#22c55e',
          title: 'Vector Campo Magnético $\\vec{B}$ (Dedo medio)',
          val: `|B| = ${S.B} mT (${fm(S.B * 1e-3)} T) en dirección +Y`,
          desc: 'Define la dirección de las líneas de fuerza magnética en la región.'
        };
      }
      if (key === 'I') {
        return {
          pos: S.modo === 'iman' ? V(0, 0, 0) : V(0, 0, 0),
          offset: V(8, 5, 11),
          color: '#f59e0b',
          title: S.modo === 'iman' ? 'Imán permanente (Polos Norte y Sur)' : 'Carga eléctrica de prueba $q$',
          val: S.modo === 'iman' ? 'Dipolo magnético N (+Y) – S (−Y)' : `q = ${qSign > 0 ? '+' : '−'}${S.q} μC`,
          desc: 'Partícula o dipolo magnético situado en el origen del sistema de coordenadas.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(3.2 * sTh, 3.2 * cTh, 0),
          offset: V(7, 5, 10),
          color: '#38bdf8',
          title: 'Vector velocidad $\\vec{v}$ (Dedo índice)',
          val: `|v| = ${S.v} m/s  ·  Ángulo θ = ${S.th}° con B`,
          desc: 'Vector velocidad de la carga de prueba contenido en el plano XY.'
        };
      }
      if (key === 'F') {
        return {
          pos: S.modo === 'iman' ? V(S.px, S.py, 0) : V(0, 0, 3.2 * qSign),
          offset: V(7, 5, 10),
          color: '#ef4444',
          title: S.modo === 'iman' ? 'Aguja Norte de la brújula 3D' : 'Fuerza magnética $\\vec{F}_B = q(\\vec{v}\\times\\vec{B})$',
          val: S.modo === 'iman' ? `Posición (${S.px} cm, ${S.py} cm)` : `|F_B| = ${fm(FB * 1e6)} μN (${qSign > 0 ? '+Z' : '−Z'})`,
          desc: S.modo === 'iman' ? 'Se orienta tangencialmente a las líneas de campo magnético local.' : 'Perpendicular tanto al campo B como a la velocidad v de la partícula.'
        };
      }
      if (key === 'mu') {
        return {
          pos: S.modo === 'iman' ? V(S.px, S.py, 0) : V(0, 0, 0),
          offset: V(7, 5, 10),
          color: '#e879f9',
          title: 'Orientación dipolar / Normal al plano $(\\vec{v}, \\vec{B})$',
          val: `Plano de interacción XY ⊥ eje Z`,
          desc: 'Dirección normal al plano formado por los vectores de velocidad y campo magnético.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(0, 0, 3.0),
          offset: V(7, 5, 10),
          color: '#facc15',
          title: 'Producto cruz $\\vec{v}\\times\\vec{B}$ y paralelogramo',
          val: `|v × B| = v·B·sin(${S.th}°) = ${fm(vxb)} V/m`,
          desc: 'El área del paralelogramo amarillo representa la magnitud del producto vectorial v × B.'
        };
      }
    }

    /* ===== Módulo 5 (ID A): Movimiento de partícula en E y B ===== */
    if (mod.id === 'A') {
      const live = mod.getLive ? mod.getLive() : { p: V(), v: V(1, 0, 0), B: V(0, 1, 0), E: V(), F: V(), q: -E_, m: 9.1e-31, s: 1 };
      const p = live.p.clone();
      const vDir = live.v.length() > 1e-9 ? live.v.clone().normalize() : V(1, 0, 0);
      const vxb = live.v.clone().cross(live.B);
      const vxbDir = vxb.length() > 1e-12 ? vxb.clone().normalize() : V(0, 0, 1);
      const fDir = live.F.length() > 1e-25 ? live.F.clone().normalize() : vxbDir.clone().multiplyScalar(live.q > 0 ? 1 : -1);

      if (key === 'B') {
        return {
          pos: p.clone().add(V(0, 1.8, 0)),
          offset: V(3.5, 2.2, 4.5),
          color: '#22c55e',
          title: 'Campo magnético $\\vec{B}$ (Dedo medio)',
          val: `|B| = ${fm(S.B)} mT  ·  Dirección: +Y (0, ${fm(S.B)}, 0) mT`,
          desc: 'Campo magnético vertical uniforme. Curva la trayectoria sin modificar la energía cinética.',
          follow: true
        };
      }
      if (key === 'I') {
        const rGyro = (live.m * live.v.length() * Math.sin((S.th * Math.PI) / 180)) / (Math.abs(live.q) * (S.B * 1e-3));
        return {
          pos: p.clone(),
          offset: V(4.2, 3.0, 5.2),
          color: '#f59e0b',
          title: 'Partícula cargada y trayectoria 3D',
          val: `q = ${fm(live.q)} C  ·  Radio r = ${fm(rGyro)} m`,
          desc: 'Posición instantánea de la carga y estela naranja calculada con el integrador de Boris.',
          follow: true
        };
      }
      if (key === 'v') {
        const Ek = (0.5 * live.m * live.v.lengthSq()) / E_;
        return {
          pos: p.clone().addScaledVector(vDir, 2.0),
          offset: V(3.4, 2.2, 4.4),
          color: '#38bdf8',
          title: 'Vector velocidad $\\vec{v}$ (Dedo índice)',
          val: `|v| = ${fm(live.v.length())} m/s  ·  Ek = ${fm(Ek)} eV`,
          desc: `Tangente a la curva en todo punto; forma un ángulo θ = ${S.th}° con el campo B.`,
          follow: true
        };
      }
      if (key === 'F') {
        return {
          pos: p.clone().addScaledVector(fDir, 2.0),
          offset: V(3.4, 2.2, 4.4),
          color: '#ef4444',
          title: 'Fuerza de Lorentz $\\vec{F} = q(\\vec{E} + \\vec{v}\\times\\vec{B})$',
          val: `|F| = ${fm(live.F.length())} N  ·  ${live.q > 0 ? 'Paralela a v×B (q > 0)' : 'Opuesta a v×B (q < 0)'}`,
          desc: 'Fuerza neta sobre la partícula que actúa como fuerza centrípeta curvando su movimiento.',
          follow: true
        };
      }
      if (key === 'mu') {
        const feMag = Math.abs(live.q) * (S.E * 1e3);
        return {
          pos: p.clone().add(V(0, 0, live.q > 0 ? -1.8 : 1.8)),
          offset: V(3.6, 2.3, 4.6),
          color: '#e879f9',
          title: 'Fuerza eléctrica $\\vec{F}_E = q\\vec{E}$',
          val: `|F_E| = ${fm(feMag)} N  ·  E = ${fm(S.E)} kV/m (−Z)`,
          desc: S.E > 0 ? 'Fuerza eléctrica transversal en el eje Z que compite con la fuerza magnética.' : 'Actualmente E = 0 kV/m (sube el slider de E o activa el preset Selector de velocidades).',
          follow: true
        };
      }
      if (key === 'vxb') {
        return {
          pos: p.clone().addScaledVector(vxbDir, 1.8),
          offset: V(3.4, 2.2, 4.4),
          color: '#facc15',
          title: 'Producto cruz $\\vec{v} \\times \\vec{B}$ (Pulgar mano derecha)',
          val: `|v × B| = ${fm(vxb.length())} V/m  ·  ⊥ a v y a B`,
          desc: 'Dirección del pulgar según la regla de la mano derecha (de v hacia B).',
          follow: true
        };
      }
    }

    /* ===== Módulo 2: Biot-Savart ===== */
    if (mod.id === 'B') {
      const pp = V(S.px, S.py, 0);
      if (key === 'B') {
        return {
          pos: V(4, 2, 0),
          offset: V(8, 6, 14),
          color: '#22c55e',
          title: 'Campo magnético $\\vec{B}(\\vec{r})$ (Biot-Savart)',
          val: `Fuente: ${S.geo.toUpperCase()}  ·  Corriente I = ${S.I} A`,
          desc: 'Líneas de campo cerradas (verdes) y mapa vectorial en el plano z = 0.'
        };
      }
      if (key === 'I') {
        const iPos = S.geo === 'hilo' || S.geo === 'elemento_dl' || S.geo === 'carga_mov' ? V(0, 2, 0) : V(0, 0, -S.R);
        return {
          pos: iPos,
          offset: V(8, 6, 12),
          color: '#f59e0b',
          title: 'Conductor y elemento de corriente $I\\,d\\vec{l}$',
          val: `Corriente I = ${S.I} A  ·  Geometría: ${S.geo}`,
          desc: 'Camino físico de la corriente eléctrica (naranja) dividido en segmentos diferenciales dl.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(0, 1.8, 0),
          offset: V(7, 5, 11),
          color: '#38bdf8',
          title: 'Velocidad de portadores $\\vec{v}$',
          val: `q·v equiv. = ${fm(S.I * 0.01)} C·m/s (+Y)`,
          desc: 'Dirección de movimiento de las cargas positivas que originan el campo magnético.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(2, 0, 0),
          offset: V(7, 5, 11),
          color: '#ef4444',
          title: 'Zona de máxima intensidad de $|\\vec{B}|$',
          val: `Escala térmica logarítmica (rojo = máximo |B|)`,
          desc: 'Las flechas cercanas al conductor se tiñen de rojo donde la magnitud del campo es máxima.'
        };
      }
      if (key === 'mu') {
        return {
          pos: pp,
          offset: V(7, 5, 12),
          color: '#e879f9',
          title: 'Sonda de medida $\\vec{B}(x, y, 0)$',
          val: `Posición: (${S.px} cm, ${S.py} cm, 0)`,
          desc: 'Esfera y vector magenta donde se compara el cálculo numérico de Biot-Savart con la fórmula analítica.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: pp.clone().multiplyScalar(0.5),
          offset: V(8, 6, 13),
          color: '#facc15',
          title: 'Regla de la mano derecha ($d\\vec{l} \\times \\hat{r}$)',
          val: `dB ∝ (I·dl × r̂) / r²`,
          desc: 'El pulgar sigue la corriente I (naranja) y los dedos curvan en el sentido de las líneas verdes de B.'
        };
      }
    }

    /* ===== Módulo 3: Fuerza entre corrientes ===== */
    if (mod.id === 'C') {
      const x1 = -S.d / 2;
      const x2 = S.d / 2;
      const s2 = S.dir === 'mismo' ? 1 : -1;
      const dm = S.d * 1e-2;
      const B1 = (MU0 * S.I1) / (2 * Math.PI * dm);
      const FperL = (MU0 * S.I1 * S.I2) / (2 * Math.PI * dm);
      const dF = FperL * (S.dl * 1e-2);

      if (key === 'B') {
        return {
          pos: V(x2, S.y0, -2.0),
          offset: V(8, 5, 11),
          color: '#22c55e',
          title: 'Campo magnético $\\vec{B}_{1\\to 2}$',
          val: `|B₁| = ${fm(B1 * 1e6)} μT (dirección −Z en el hilo 2)`,
          desc: 'Campo magnético circular creado por el hilo 1 que atraviesa perpendicularmente al hilo 2.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(x1, S.y0 + 1.5, 0),
          offset: V(8, 5, 11),
          color: '#f59e0b',
          title: 'Corriente del Conductor 1 ($I_1\\,d\\vec{l}_1$)',
          val: `I₁ = ${S.I1} A (sentido +Y)  ·  x₁ = ${x1} cm`,
          desc: 'Primer conductor rectilíneo y vector elemento de corriente en dirección vertical +Y.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(x2, S.y0 + 1.5 * s2, 0),
          offset: V(8, 5, 11),
          color: '#38bdf8',
          title: 'Corriente del Conductor 2 ($I_2\\,d\\vec{l}_2$)',
          val: `I₂ = ${S.I2} A (sentido ${s2 > 0 ? '+Y ⇈' : '−Y ⇅'})  ·  x₂ = +${x2} cm`,
          desc: 'Segundo conductor paralelo cuyo sentido relativo define si hay atracción o repulsión.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(x2 - s2 * 1.8, S.y0, 0),
          offset: V(7, 5, 11),
          color: '#ef4444',
          title: 'Fuerza magnética $\\Delta\\vec{F} = I_2\\,\\Delta\\vec{l}_2 \\times \\vec{B}_1$',
          val: `ΔF = ${fm(dF * 1e6)} μN  ·  F/L = ${fm(FperL * 1e6)} μN/m (${s2 > 0 ? 'Atracción' : 'Repulsión'})`,
          desc: 'Par acción-reacción de fuerzas magnéticas entre los segmentos de ambos conductores.'
        };
      }
      if (key === 'mu') {
        return {
          pos: V(x2, S.y0, 0),
          offset: V(7, 4, 10),
          color: '#e879f9',
          title: 'Segmento diferencial resaltado ($\\Delta l$)',
          val: `Longitud Δl = ${S.dl} cm  ·  Altura y₀ = ${S.y0} cm`,
          desc: 'Tramo de conductor sobre el que se integra numéricamente la fuerza de Laplace.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(x2, S.y0, 0),
          offset: V(8, 5, 11),
          color: '#facc15',
          title: 'Producto cruz $I_2\\,d\\vec{l}_2 \\times \\vec{B}_1$',
          val: `dl₂ (${s2 > 0 ? '+Y' : '−Y'}) × B₁ (−Z) ⟹ Fuerza en ${s2 > 0 ? '−X' : '+X'}`,
          desc: 'Aplicación de la regla de la mano derecha sobre el segmento del segundo conductor.'
        };
      }
    }

    /* ===== Módulo 4: Torque sobre espira ===== */
    if (mod.id === 'D') {
      const Lm = S.L * 1e-2;
      const A = S.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
      const B = S.B * 1e-3;
      const mu = S.N * S.I * A;
      const thRad = (S.th0 * Math.PI) / 180;
      const tau = mu * B * Math.abs(Math.sin(thRad));
      const Farm = S.N * S.I * Lm * B;
      const nDir = V(Math.cos(thRad), 0, Math.sin(thRad));
      const uDir = V(-Math.sin(thRad), 0, Math.cos(thRad));

      if (key === 'B') {
        return {
          pos: V(3.2, 0, 0),
          offset: V(7, 6, 10),
          color: '#22c55e',
          title: 'Campo magnético uniforme $\\vec{B}$',
          val: `|B| = ${S.B} mT (dirección horizontal +X)`,
          desc: 'Campo magnético externo uniforme que interactúa con el momento dipolar de la espira.'
        };
      }
      if (key === 'I') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2),
          offset: V(7, 6, 10),
          color: '#f59e0b',
          title: 'Espira conductora ($N\\cdot I$)',
          val: `I = ${S.I} A  ·  N = ${S.N} vueltas  ·  L = ${S.L} cm`,
          desc: 'Lazo conductor por el que circula la corriente eléctrica I en sentido antihorario respecto a μ.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(0, 2.5, 0),
          offset: V(7, 6, 10),
          color: '#38bdf8',
          title: 'Vector Momento de Torsión $\\vec{\\tau} = \\vec{\\mu} \\times \\vec{B}$',
          val: `|τ| = ${fm(tau)} N·m (a lo largo del eje de giro Y)`,
          desc: 'Torque axial producido por el par de fuerzas que hace rotar la espira hacia θ = 0°.'
        };
      }
      if (key === 'F') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2).add(V(0, 0, -2.0)),
          offset: V(7, 6, 10),
          color: '#ef4444',
          title: 'Par de fuerzas laterales ($\\vec{F}_1, \\vec{F}_2$)',
          val: `F_brazo = ${fm(Farm)} N  ·  Fuerza neta ∑F = 0 N`,
          desc: 'Fuerzas iguales y opuestas sobre los brazos verticales que generan la cupla de rotación.'
        };
      }
      if (key === 'mu') {
        return {
          pos: nDir.clone().multiplyScalar(3.2),
          offset: V(7, 6, 10),
          color: '#e879f9',
          title: 'Momento dipolar magnético $\\vec{\\mu} = N I A\\,\\hat{n}$',
          val: `|μ| = ${fm(mu)} A·m²  ·  Ángulo θ = ${S.th0}°`,
          desc: 'Vector perpendicular al plano de la espira que tiende a alinearse paralelamente con B.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2),
          offset: V(7, 6, 10),
          color: '#facc15',
          title: 'Sentido de circulación de $I$ (Mano derecha)',
          val: `Dedos con I ⟹ Pulgar define la dirección de μ`,
          desc: 'Flechas amarillas sobre la espira que determinan la cara positiva del vector normal n̂.'
        };
      }
    }

    /* ===== Módulo 5: Flujo magnético ===== */
    if (mod.id === 'E') {
      const Lm = S.L * 1e-2;
      const A = S.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
      const B = S.B * 1e-3;
      const thRad = (S.th * Math.PI) / 180;
      const cTh = Math.cos(thRad);
      const phi = B * A * cTh;
      const nDir = V(cTh, 0, Math.sin(thRad));

      if (key === 'B') {
        return {
          pos: V(3.5, 0, 0),
          offset: V(8, 6, 11),
          color: '#22c55e',
          title: 'Campo magnético $\\vec{B}$ y líneas de flujo',
          val: `|B| = ${S.B} mT (+X)  ·  Φ_B = ${fm(phi * 1e6)} μWb`,
          desc: 'Haz de líneas de campo magnético cuya densidad espacial es proporcional a la magnitud de B.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, S.L / 2, 0),
          offset: V(8, 6, 11),
          color: '#f59e0b',
          title: 'Contorno de la superficie de área $A$',
          val: `Área A = ${fm(A * 1e4)} cm² (${fm(A)} m²)`,
          desc: 'Borde de la superficie plana orientable a través de la cual se evalúa la integral de flujo.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(-10, 0, 0),
          offset: V(9, 6, 12),
          color: '#38bdf8',
          title: 'Área efectiva proyectada $A_\\perp = A\\cos\\theta$',
          val: `A_⊥ = ${fm(A * cTh * 1e4)} cm²  ·  cos θ = ${cTh.toFixed(3)}`,
          desc: 'Silueta proyectada en el plano x = −10 perpendicular a las líneas de campo magnético.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(0, 0, 0),
          offset: V(8, 6, 11),
          color: '#ef4444',
          title: 'Intersección y signo del flujo $\\Phi_B$',
          val: `Flujo Φ_B = ${fm(phi * 1e6)} μWb (${cTh > 0.01 ? 'Positivo' : cTh < -0.01 ? 'Negativo' : 'Nulo'})`,
          desc: 'Puntos de corte de las líneas de campo con la superficie (verde si Φ > 0, rojo si Φ < 0).'
        };
      }
      if (key === 'mu') {
        return {
          pos: nDir.clone().multiplyScalar(3.5),
          offset: V(8, 6, 11),
          color: '#e879f9',
          title: 'Vector normal unitario $\\hat{n}$ y diferenciales $d\\vec{A}$',
          val: `Ángulo θ = ${S.th}° respecto a B  ·  dA = n̂·dA`,
          desc: 'Vector perpendicular a la superficie que define la orientación positiva del flujo.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(2.2 * Math.cos(thRad / 2), 0, 2.2 * Math.sin(thRad / 2)),
          offset: V(7, 5, 10),
          color: '#facc15',
          title: 'Arco del ángulo $\\theta$ entre $\\vec{B}$ y $\\hat{n}$',
          val: `θ = ${S.th}°  ·  Factor cos(${S.th}°) = ${cTh.toFixed(3)}`,
          desc: 'Ángulo de inclinación que determina la fracción del campo que atraviesa la superficie.'
        };
      }
    }

    /* ===== Módulo 6: Ley de Gauss del magnetismo ===== */
    if (mod.id === 'F') {
      const gCenter = V(S.gx, S.gy, 0);
      if (key === 'B') {
        return {
          pos: gCenter.clone().add(V(0, S.Rg * 0.85, 0)),
          offset: V(9, 6, 13),
          color: '#22c55e',
          title: 'Flujo magnético saliente ($\\Phi_{\\text{sal}} > 0$)',
          val: `Región donde B · n̂ > 0 (flechas verdes saliendo de S)`,
          desc: 'Líneas de campo que emergen hacia el exterior de la superficie gaussiana cerrada.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, 0, 0),
          offset: V(9, 6, 13),
          color: '#f59e0b',
          title: 'Fuente magnética sin monopolos ($q_m = 0$)',
          val: `Fuente: ${S.source === 'dipolo' ? 'Imán N–S' : 'Espira circular'} (I = ${S.I} A)`,
          desc: 'Genera líneas de campo magnético que forman siempre lazos cerrados continuos.'
        };
      }
      if (key === 'v') {
        return {
          pos: gCenter,
          offset: V(10, 7, 14),
          color: '#38bdf8',
          title: 'Superficie gaussiana cerrada $S$',
          val: `${S.surf === 'esfera' ? 'Esfera' : 'Caja'} de tamaño R_g = ${S.Rg} cm  ·  ∮ B·dA = 0 Wb`,
          desc: 'Superficie cerrada imaginaria donde el flujo saliente cancela exactamente al flujo entrante.'
        };
      }
      if (key === 'F') {
        return {
          pos: gCenter.clone().add(V(0, -S.Rg * 0.85, 0)),
          offset: V(9, 6, 13),
          color: '#ef4444',
          title: 'Flujo magnético entrante ($\\Phi_{\\text{ent}} < 0$)',
          val: `Región donde B · n̂ < 0 (flechas rojas entrando a S)`,
          desc: 'Toda línea que sale de la superficie cerrada vuelve a entrar a ella por otra región (|Φ_ent| = Φ_sal).'
        };
      }
      if (key === 'mu') {
        return {
          pos: V(0, 1.5, 0),
          offset: V(8, 5, 12),
          color: '#e879f9',
          title: 'Momento dipolar magnético $\\vec{\\mu}$ (Sur $\\to$ Norte)',
          val: `Eje dipolar vertical +Y  ·  ∇ · B = 0`,
          desc: 'Por el interior del imán o espira las líneas van de Sur a Norte cerrando el circuito magnético.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(3.5, 0, 0),
          offset: V(9, 6, 13),
          color: '#facc15',
          title: 'Continuidad de líneas cerradas ($\\nabla\\cdot\\vec{B} = 0$)',
          val: `Flujo neto ∮_S B · dA = 0 Wb en cualquier posición`,
          desc: 'Como las líneas no tienen principio ni fin, ninguna superficie cerrada encierra carga magnética neta.'
        };
      }
    }

    return null;
  }

  function select(key) {
    if (activeKey === key) {
      clear();
      return;
    }
    activeKey = key;

    document.querySelectorAll('.leg-item[data-vec]').forEach((el) => {
      el.classList.toggle('on', el.getAttribute('data-vec') === activeKey);
    });

    const info = getInfo(Sim.activeMod, activeKey);
    if (!info) {
      clear();
      return;
    }

    ringMat.color.set(info.color);
    haloMat.color.set(info.color);
    markerGrp.visible = true;
    markerGrp.position.copy(info.pos);

    animateCameraTo(info.pos, info.offset);
    updateHud(info);
  }

  function clear() {
    activeKey = null;
    camAnim = null;
    markerGrp.visible = false;
    const hud = $('vec-hud');
    if (hud) hud.hidden = true;
    document.querySelectorAll('.leg-item[data-vec]').forEach((el) => {
      el.classList.remove('on');
    });
  }

  function updateHud(info) {
    const hud = $('vec-hud');
    if (!hud || !info) return;
    hud.hidden = false;
    hud.style.borderColor = info.color;

    const dotEl = $('vec-hud-dot');
    const titleEl = $('vec-hud-title');
    const valEl = $('vec-hud-val');
    const descEl = $('vec-hud-desc');

    if (dotEl) dotEl.style.background = info.color;
    if (valEl) valEl.textContent = info.val;

    if (titleEl && info.title !== lastHudTitle) {
      lastHudTitle = info.title;
      titleEl.innerHTML = info.title;
      if (Sim.ui && Sim.ui.renderMath) Sim.ui.renderMath(titleEl);
    }
    if (descEl && info.desc !== lastHudDesc) {
      lastHudDesc = info.desc;
      descEl.innerHTML = info.desc;
      if (Sim.ui && Sim.ui.renderMath) Sim.ui.renderMath(descEl);
    }
  }

  function tick(now) {
    if (!activeKey || !Sim.activeMod) return;
    const info = getInfo(Sim.activeMod, activeKey);
    if (!info) return;

    /* Actualizar posición del marcador 3D y pulso suave */
    markerGrp.position.copy(info.pos);
    markerGrp.quaternion.copy(cam.quaternion);
    const pulse = 1 + 0.14 * Math.sin(now * 0.006);
    ringMesh.scale.set(pulse, pulse, 1);

    /* Interpolar cámara hacia el objetivo o seguir al vector si está en movimiento */
    if (camAnim) {
      const u = Math.min(1, (now - camAnim.t0) / camAnim.dur);
      const ease = 1 - Math.pow(1 - u, 3);
      ctl.target.lerpVectors(camAnim.startTarget, info.pos, ease);
      const desiredCam = info.pos.clone().add(info.offset);
      cam.position.lerpVectors(camAnim.startCam, desiredCam, ease);
      if (u >= 1) camAnim = null;
    } else if (info.follow && !Sim.freeCam) {
      const prevT = ctl.target.clone();
      ctl.target.lerp(info.pos, 0.08);
      cam.position.add(ctl.target.clone().sub(prevT));
    }

    updateHud(info);

    /* Proyectar la coordenada 3D del vector a coordenadas 2D de la pantalla (#cvw) para posicionar la tarjeta encima */
    const hud = $('vec-hud');
    if (hud) {
      const w = cvw.clientWidth;
      const h = cvw.clientHeight;
      const proj = info.pos.clone().project(cam);
      const sx = (proj.x * 0.5 + 0.5) * w;
      const sy = (-proj.y * 0.5 + 0.5) * h;

      const clampedX = Math.max(155, Math.min(w - 155, sx));
      const clampedY = Math.max(105, Math.min(h - 24, sy - 22));
      hud.style.left = clampedX + 'px';
      hud.style.top = clampedY + 'px';
    }
  }

  Sim.inspector = { select, clear, tick };
})();
