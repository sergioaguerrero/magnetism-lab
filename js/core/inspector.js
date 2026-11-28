/* ===== Inspector 3D interactivo y leyenda contextual por tema ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) {
    Sim.inspector = { select() {}, clear() {}, tick() {}, syncLegend() {}, markDirty() {} };
    return;
  }

  let activeKey = null;
  let lastHudTitle = '';
  let lastHudDesc = '';
  let lastLegendSig = '';
  let dirty = true;
  let lastCamHash = '';

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

  let camAnim = null;

  function animateCameraTo(targetPos, offsetVec) {
    camAnim = {
      t0: performance.now(),
      dur: 520,
      startTarget: ctl.target.clone(),
      startCam: cam.position.clone(),
      endTarget: targetPos.clone(),
      endCam: targetPos.clone().add(offsetVec)
    };
  }

  /* Leyenda contextual: solo muestra los elementos que existen realmente en el tema y modo activo */
  function getLegendItems(mod) {
    if (!mod) return [];
    const S = mod.state || {};
    const c = Sim.scene.getPalette().css;

    if (mod.id === 'campo-magnetico') {
      if (S.modo === 'iman') {
        return [
          { key: 'B', color: c.B, label: 'Campo $\\vec{B}$ local' },
          { key: 'I', color: c.I, label: 'Imán N–S' },
          { key: 'F', color: c.F, label: 'Brújula 3D' }
        ];
      }
      return [
        { key: 'B', color: c.B, label: 'Campo $\\vec{B}$' },
        { key: 'v', color: c.v, label: 'Velocidad $\\vec{v}$' },
        { key: 'vxb', color: c.vxb, label: 'Producto $\\vec{v}\\times\\vec{B}$' },
        { key: 'F', color: c.F, label: 'Fuerza $\\vec{F}_B$' },
        { key: 'I', color: c.I, label: 'Carga de prueba $q$' }
      ];
    }

    if (mod.id === 'fuentes-campo') {
      const items = [
        { key: 'B', color: c.B, label: 'Líneas de $\\vec{B}$' },
        { key: 'mu', color: c.mu, label: 'Sonda $\\vec{B}(x,y)$' },
        { key: 'F', color: c.F, label: 'Intensidad $|\\vec{B}|$' },
        { key: 'vxb', color: c.vxb, label: 'Regla mano der.' }
      ];
      if (S.geo === 'carga_mov') {
        items.splice(1, 0, { key: 'v', color: c.v, label: 'Velocidad $q\\vec{v}$' });
      } else {
        items.splice(1, 0, { key: 'I', color: c.I, label: 'Corriente $I\\,d\\vec{l}$' });
      }
      return items;
    }

    if (mod.id === 'fuerza-corrientes') {
      return [
        { key: 'I', color: c.I, label: 'Corriente $I_1$' },
        { key: 'v', color: c.v, label: 'Corriente $I_2$' },
        { key: 'B', color: c.B, label: 'Campo $\\vec{B}_{1\\to 2}$' },
        { key: 'F', color: c.F, label: 'Fuerza $\\Delta\\vec{F}$' },
        { key: 'mu', color: c.mu, label: 'Segmento $\\Delta l$' }
      ];
    }

    if (mod.id === 'torque-lazo') {
      return [
        { key: 'B', color: c.B, label: 'Campo $\\vec{B}$' },
        { key: 'I', color: c.I, label: 'Espira $N\\cdot I$' },
        { key: 'mu', color: c.mu, label: 'Dipolo $\\vec{\\mu}$' },
        { key: 'F', color: c.F, label: 'Par $\\vec{F}_1, \\vec{F}_2$' },
        { key: 'v', color: c.v, label: 'Torque $\\vec{\\tau}$' }
      ];
    }

    if (mod.id === 'movimiento-particula') {
      const items = [
        { key: 'B', color: c.B, label: 'Campo $\\vec{B}$' },
        { key: 'v', color: c.v, label: 'Velocidad $\\vec{v}$' },
        { key: 'F', color: c.F, label: 'Fuerza $\\vec{F}$' },
        { key: 'I', color: c.I, label: 'Trayectoria 3D' }
      ];
      if (S.rhr === 'si') {
        items.push({ key: 'vxb', color: c.vxb, label: 'Pulgar $\\vec{v}\\times\\vec{B}$' });
      }
      if (S.E > 0) {
        items.push({ key: 'mu', color: c.mu, label: 'Fuerza $\\vec{F}_E$' });
      }
      return items;
    }

    if (mod.id === 'flujo-magnetico') {
      return [
        { key: 'B', color: c.B, label: 'Campo $\\vec{B}$' },
        { key: 'mu', color: c.mu, label: 'Normal $\\hat{n}$' },
        { key: 'I', color: c.I, label: 'Superficie $A$' },
        { key: 'v', color: c.v, label: 'Área $A\\cos\\theta$' },
        { key: 'vxb', color: c.vxb, label: 'Ángulo $\\theta$' },
        { key: 'F', color: c.F, label: 'Signo de $\\Phi_B$' }
      ];
    }

    if (mod.id === 'ley-gauss') {
      const items = [
        { key: 'B', color: c.B, label: 'Flujo saliente' },
        { key: 'F', color: c.F, label: 'Flujo entrante' },
        { key: 'v', color: c.v, label: 'Superficie $S$' },
        { key: 'I', color: c.I, label: S.source === 'dipolo' ? 'Imán N–S' : 'Espira $I$' }
      ];
      if (S.source === 'dipolo') {
        items.push({ key: 'mu', color: c.mu, label: 'Dipolo $\\vec{\\mu}$' });
      }
      return items;
    }

    return [];
  }

  function syncLegend(mod) {
    const container = document.querySelector('.legend');
    if (!container || !mod) return;

    const items = getLegendItems(mod);
    const sig = items.map((it) => `${it.key}:${it.color}:${it.label}`).join('|');
    if (sig === lastLegendSig) return;
    lastLegendSig = sig;

    if (activeKey && !items.some((it) => it.key === activeKey)) {
      clear();
    }

    container.innerHTML = items
      .map(
        (it) =>
          `<button type="button" class="leg-item${activeKey === it.key ? ' on' : ''}" data-vec="${it.key}"><i class="dot" style="background:${it.color}"></i><span>${it.label}</span></button>`
      )
      .join('');

    container.querySelectorAll('.leg-item[data-vec]').forEach((btn) => {
      btn.onclick = () => select(btn.getAttribute('data-vec'));
    });

    if (Sim.ui && Sim.ui.renderMath) {
      Sim.ui.renderMath(container);
    }
  }

  function getInfo(mod, key) {
    if (!mod) return null;
    const S = mod.state || {};
    const c = Sim.scene.getPalette().css;

    /* ===== Tema 1: Campo magnético ===== */
    if (mod.id === 'campo-magnetico') {
      if (S.modo === 'iman') {
        const live = mod.getLive ? mod.getLive() : { pp: V(S.px, S.py, 0), bLocal: V(0, 1, 0), bMag: 0, angDeg: 0 };
        if (key === 'B') {
          return {
            pos: live.pp.clone().add(V(0, 0.8, 0)),
            offset: V(7, 5, 10),
            color: c.B,
            title: 'Campo magnético local $\\vec{B}(x, y)$',
            val: `|B| = ${fm(live.bMag * 1e3)} mT  ·  (${fm(live.bLocal.x * 1e3)}, ${fm(live.bLocal.y * 1e3)}) mT`,
            desc: 'Vector tangente a las líneas de campo que salen del Polo Norte y entran al Polo Sur.'
          };
        }
        if (key === 'I') {
          return {
            pos: V(0, 0, 0),
            offset: V(8, 5, 11),
            color: c.I,
            title: 'Imán permanente de barra (Polos N–S)',
            val: `Polo Norte en +Y (rojo) · Polo Sur en −Y (azul)`,
            desc: 'Fuente dipolar magnética cuya intensidad se controla con el slider B.'
          };
        }
        if (key === 'F') {
          return {
            pos: live.pp.clone(),
            offset: V(7, 5, 10),
            color: c.F,
            title: 'Brújula magnética 3D',
            val: `Posición (${S.px} cm, ${S.py} cm)  ·  Ángulo ${live.angDeg}°`,
            desc: 'La aguja Norte (roja) se alinea automáticamente en la dirección de B local.'
          };
        }
        return null;
      }

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
          color: c.B,
          title: 'Vector Campo Magnético $\\vec{B}$ (Dedo medio)',
          val: `|B| = ${S.B} mT (${fm(S.B * 1e-3)} T) en dirección +Y`,
          desc: 'Define la dirección de las líneas de fuerza magnética en la región.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, 0, 0),
          offset: V(8, 5, 11),
          color: c.I,
          title: 'Carga eléctrica de prueba $q$',
          val: `q = ${qSign > 0 ? '+' : '−'}${S.q} μC`,
          desc: 'Partícula situada en el origen del sistema de coordenadas.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(3.2 * sTh, 3.2 * cTh, 0),
          offset: V(7, 5, 10),
          color: c.v,
          title: 'Vector velocidad $\\vec{v}$ (Dedo índice)',
          val: `|v| = ${S.v} m/s  ·  Ángulo θ = ${S.th}° con B`,
          desc: 'Vector velocidad de la carga de prueba contenido en el plano XY.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(0, 0, 3.2 * qSign),
          offset: V(7, 5, 10),
          color: c.F,
          title: 'Fuerza magnética $\\vec{F}_B = q(\\vec{v}\\times\\vec{B})$',
          val: `|F_B| = ${fm(FB * 1e6)} μN (${qSign > 0 ? '+Z' : '−Z'})`,
          desc: 'Perpendicular tanto al campo B como a la velocidad v de la partícula.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(0, 0, 3.0),
          offset: V(7, 5, 10),
          color: c.vxb,
          title: 'Producto cruz $\\vec{v}\\times\\vec{B}$ y paralelogramo',
          val: `|v × B| = v·B·sin(${S.th}°) = ${fm(vxb)} V/m`,
          desc: 'El área del paralelogramo sombreado representa la magnitud del producto vectorial v × B.'
        };
      }
    }

    /* ===== Tema 2: Fuentes de campo (Biot-Savart) ===== */
    if (mod.id === 'fuentes-campo') {
      const pp = V(S.px, S.py, 0);
      const live = mod.getLive ? mod.getLive() : { bMag: 0, bAna: null };

      if (key === 'B') {
        return {
          pos: V(4, 2, 0),
          offset: V(8, 6, 14),
          color: c.B,
          title: 'Campo magnético $\\vec{B}(\\vec{r})$ (Biot-Savart)',
          val: `Fuente: ${S.geo.toUpperCase()}  ·  |B| en sonda = ${fm(live.bMag * 1e6)} μT`,
          desc: 'Líneas de campo cerradas (verdes) y mapa vectorial en el plano z = 0.'
        };
      }
      if (key === 'I') {
        const iPos = S.geo === 'hilo' || S.geo === 'elemento_dl' ? V(0, 2, 0) : V(0, 0, -S.R);
        return {
          pos: iPos,
          offset: V(8, 6, 12),
          color: c.I,
          title: 'Conductor y elemento de corriente $I\\,d\\vec{l}$',
          val: `Corriente I = ${S.I} A  ·  Geometría: ${S.geo}`,
          desc: 'Camino físico de la corriente eléctrica dividido en segmentos diferenciales dl.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(0, 1.8, 0),
          offset: V(7, 5, 11),
          color: c.v,
          title: 'Carga puntual y velocidad $q\\vec{v}$',
          val: `q·v = ${fm(S.I * 0.01)} C·m/s (+Y)`,
          desc: 'Dirección de movimiento de la carga puntual que origina el campo magnético.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(2, 0, 0),
          offset: V(7, 5, 11),
          color: c.F,
          title: 'Zona de máxima intensidad de $|\\vec{B}|$',
          val: 'Escala térmica logarítmica (rojo = máximo |B|)',
          desc: 'Las flechas cercanas a la fuente se tiñen de rojo donde la magnitud del campo es mayor.'
        };
      }
      if (key === 'mu') {
        return {
          pos: pp,
          offset: V(7, 5, 12),
          color: c.mu,
          title: 'Sonda de medida $\\vec{B}(x, y, 0)$',
          val: `(${S.px} cm, ${S.py} cm, 0)  ·  |B| = ${fm(live.bMag * 1e6)} μT`,
          desc: 'Punto donde se compara el cálculo numérico de Biot-Savart contra la fórmula analítica.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: pp.clone().multiplyScalar(0.5),
          offset: V(8, 6, 13),
          color: c.vxb,
          title: 'Regla de la mano derecha ($d\\vec{l} \\times \\hat{r}$)',
          val: S.geo === 'carga_mov' ? 'B ∝ (q·v × r̂) / r²' : 'dB ∝ (I·dl × r̂) / r²',
          desc: 'El pulgar sigue la dirección de la fuente (+Y) y los dedos indican el sentido de las líneas de B.'
        };
      }
    }

    /* ===== Tema 3: Fuerza entre corrientes ===== */
    if (mod.id === 'fuerza-corrientes') {
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
          color: c.B,
          title: 'Campo magnético $\\vec{B}_{1\\to 2}$',
          val: `|B₁| = ${fm(B1 * 1e6)} μT (dirección −Z en el hilo 2)`,
          desc: 'Campo magnético circular creado por el hilo 1 que atraviesa perpendicularmente al hilo 2.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(x1, S.y0 + 1.5, 0),
          offset: V(8, 5, 11),
          color: c.I,
          title: 'Corriente del Conductor 1 ($I_1\\,d\\vec{l}_1$)',
          val: `I₁ = ${S.I1} A (+Y)  ·  x₁ = ${x1} cm`,
          desc: 'Primer conductor rectilíneo con corriente vertical hacia +Y.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(x2, S.y0 + 1.5 * s2, 0),
          offset: V(8, 5, 11),
          color: c.v,
          title: 'Corriente del Conductor 2 ($I_2\\,d\\vec{l}_2$)',
          val: `I₂ = ${S.I2} A (${s2 > 0 ? '+Y ⇈' : '−Y ⇅'})  ·  x₂ = +${x2} cm`,
          desc: 'Segundo conductor paralelo cuyo sentido relativo define atracción o repulsión.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(x2 - s2 * 1.8, S.y0, 0),
          offset: V(7, 5, 11),
          color: c.F,
          title: 'Fuerza magnética $\\Delta\\vec{F} = I_2\\,\\Delta\\vec{l}_2 \\times \\vec{B}_1$',
          val: `ΔF = ${fm(dF * 1e6)} μN  ·  F/L = ${fm(FperL * 1e6)} μN/m (${s2 > 0 ? 'Atracción' : 'Repulsión'})`,
          desc: 'Par acción-reacción de fuerzas magnéticas entre ambos conductores.'
        };
      }
      if (key === 'mu') {
        return {
          pos: V(x2, S.y0, 0),
          offset: V(7, 4, 10),
          color: c.mu,
          title: 'Segmento diferencial resaltado ($\\Delta l$)',
          val: `Longitud Δl = ${S.dl} cm  ·  Altura y₀ = ${S.y0} cm`,
          desc: 'Tramo sobre el que se integra numéricamente la fuerza de Laplace.'
        };
      }
    }

    /* ===== Tema 4: Torque sobre lazo ===== */
    if (mod.id === 'torque-lazo') {
      const live = mod.getLive ? mod.getLive() : { curTh: (S.th0 * Math.PI) / 180, deg: S.th0 };
      const thRad = live.curTh;
      const degTxt = live.deg.toFixed(1);

      const Lm = S.L * 1e-2;
      const A = S.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
      const B = S.B * 1e-3;
      const mu = S.N * S.I * A;
      const tau = mu * B * Math.abs(Math.sin(thRad));
      const Farm = S.N * S.I * Lm * B;
      const nDir = V(Math.cos(thRad), 0, Math.sin(thRad));
      const uDir = V(-Math.sin(thRad), 0, Math.cos(thRad));

      if (key === 'B') {
        return {
          pos: V(3.2, 0, 0),
          offset: V(7, 6, 10),
          color: c.B,
          title: 'Campo magnético uniforme $\\vec{B}$',
          val: `|B| = ${S.B} mT (dirección +X)`,
          desc: 'Campo magnético externo uniforme que ejerce torque sobre el dipolo.'
        };
      }
      if (key === 'I') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2),
          offset: V(7, 6, 10),
          color: c.I,
          title: 'Espira conductora ($N\\cdot I$)',
          val: `I = ${S.I} A  ·  N = ${S.N} vueltas  ·  L = ${S.L} cm`,
          desc: 'Lazo conductor por el que circula la corriente I.'
        };
      }
      if (key === 'v') {
        const sTh = Math.sin(thRad);
        return {
          pos: V(0, sTh >= 0 ? -2.4 : 2.4, 0),
          offset: V(7, 6, 10),
          color: c.v,
          title: 'Vector Momento de Torsión $\\vec{\\tau} = \\vec{\\mu} \\times \\vec{B}$',
          val: `|τ| = ${fm(tau)} N·m  ·  θ actual = ${degTxt}°`,
          desc: 'Torque axial en el eje Y que alinea μ con B hacia θ = 0°.'
        };
      }
      if (key === 'F') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2).add(V(0, 0, -2.0)),
          offset: V(7, 6, 10),
          color: c.F,
          title: 'Par de fuerzas laterales ($\\vec{F}_1, \\vec{F}_2$)',
          val: `F_brazo = ${fm(Farm)} N  ·  ∑F = 0 N`,
          desc: 'Fuerzas iguales y opuestas sobre los brazos verticales que producen el giro.'
        };
      }
      if (key === 'mu') {
        return {
          pos: nDir.clone().multiplyScalar(3.2),
          offset: V(7, 6, 10),
          color: c.mu,
          title: 'Momento dipolar magnético $\\vec{\\mu} = N I A\\,\\hat{n}$',
          val: `|μ| = ${fm(mu)} A·m²  ·  θ actual = ${degTxt}°`,
          desc: 'Vector perpendicular al plano de la espira que tiende a alinearse con B.'
        };
      }
    }

    /* ===== Tema 5: Movimiento de partícula ===== */
    if (mod.id === 'movimiento-particula') {
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
          color: c.B,
          title: 'Campo magnético $\\vec{B}$ (Dedo medio)',
          val: `|B| = ${fm(S.B)} mT  ·  Dirección +Y`,
          desc: 'Campo magnético vertical uniforme; curva la trayectoria sin variar la energía cinética.',
          follow: true
        };
      }
      if (key === 'I') {
        const rGyro = (live.m * live.v.length() * Math.sin((S.th * Math.PI) / 180)) / (Math.abs(live.q) * (S.B * 1e-3));
        return {
          pos: p.clone(),
          offset: V(4.2, 3.0, 5.2),
          color: c.I,
          title: 'Partícula cargada y trayectoria 3D',
          val: `q = ${fm(live.q)} C  ·  Radio r = ${fm(rGyro)} m`,
          desc: 'Posición instantánea y estela calculada mediante el integrador simpléctico de Boris.',
          follow: true
        };
      }
      if (key === 'v') {
        const Ek = (0.5 * live.m * live.v.lengthSq()) / E_;
        return {
          pos: p.clone().addScaledVector(vDir, 2.0),
          offset: V(3.4, 2.2, 4.4),
          color: c.v,
          title: 'Vector velocidad $\\vec{v}$ (Dedo índice)',
          val: `|v| = ${fm(live.v.length())} m/s  ·  Ek = ${fm(Ek)} eV`,
          desc: `Tangente a la curva en todo punto; forma θ = ${S.th}° con B.`,
          follow: true
        };
      }
      if (key === 'F') {
        return {
          pos: p.clone().addScaledVector(fDir, 2.0),
          offset: V(3.4, 2.2, 4.4),
          color: c.F,
          title: 'Fuerza de Lorentz $\\vec{F} = q(\\vec{E} + \\vec{v}\\times\\vec{B})$',
          val: `|F| = ${fm(live.F.length())} N  ·  ${live.q > 0 ? 'Igual a v×B' : 'Opuesta a v×B'}`,
          desc: 'Fuerza electromagnética neta sobre la partícula.',
          follow: true
        };
      }
      if (key === 'mu') {
        const feMag = Math.abs(live.q) * (S.E * 1e3);
        return {
          pos: p.clone().add(V(0, 0, live.q > 0 ? -1.8 : 1.8)),
          offset: V(3.6, 2.3, 4.6),
          color: c.mu,
          title: 'Fuerza eléctrica $\\vec{F}_E = q\\vec{E}$',
          val: `|F_E| = ${fm(feMag)} N  ·  E = ${fm(S.E)} kV/m (−Z)`,
          desc: 'Fuerza eléctrica transversal que compite contra la fuerza magnética.',
          follow: true
        };
      }
      if (key === 'vxb') {
        return {
          pos: p.clone().addScaledVector(vxbDir, 1.8),
          offset: V(3.4, 2.2, 4.4),
          color: c.vxb,
          title: 'Producto cruz $\\vec{v} \\times \\vec{B}$ (Pulgar)',
          val: `|v × B| = ${fm(vxb.length())} V/m  ·  ⊥ a v y a B`,
          desc: 'Dirección del pulgar según la regla de la mano derecha.',
          follow: true
        };
      }
    }

    /* ===== Tema 6: Flujo magnético ===== */
    if (mod.id === 'flujo-magnetico') {
      const live = mod.getLive ? mod.getLive() : { curTh: (S.th * Math.PI) / 180, deg: S.th };
      const thRad = live.curTh;
      const degTxt = live.deg.toFixed(1);
      const Lm = S.L * 1e-2;
      const A = S.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
      const B = S.B * 1e-3;
      const cTh = Math.cos(thRad);
      const phi = B * A * cTh;
      const nDir = V(cTh, 0, Math.sin(thRad));

      if (key === 'B') {
        return {
          pos: V(3.5, 0, 0),
          offset: V(8, 6, 11),
          color: c.B,
          title: 'Campo magnético $\\vec{B}$ y líneas de flujo',
          val: `|B| = ${S.B} mT (+X)  ·  Φ_B = ${fm(phi * 1e6)} μWb`,
          desc: 'Haz de líneas cuya densidad espacial es proporcional a la intensidad de B.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, S.L / 2, 0),
          offset: V(8, 6, 11),
          color: c.I,
          title: 'Contorno de la superficie de área $A$',
          val: `Área A = ${fm(A * 1e4)} cm² (${fm(A)} m²)`,
          desc: 'Borde de la superficie plana orientable sobre la que se integra el flujo.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(-10, 0, 0),
          offset: V(9, 6, 12),
          color: c.v,
          title: 'Área efectiva proyectada $A_\\perp = A\\cos\\theta$',
          val: `A_⊥ = ${fm(A * cTh * 1e4)} cm²  ·  cos θ = ${cTh.toFixed(3)}`,
          desc: 'Proyección sobre el plano x = −10 perpendicular a las líneas de campo.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(0, 0, 0),
          offset: V(8, 6, 11),
          color: c.F,
          title: 'Intersección y signo del flujo $\\Phi_B$',
          val: `Φ_B = ${fm(phi * 1e6)} μWb (${cTh > 0.01 ? 'Positivo' : cTh < -0.01 ? 'Negativo' : 'Nulo'})`,
          desc: 'Puntos de corte de las líneas con la superficie (verde si Φ > 0, rojo si Φ < 0).'
        };
      }
      if (key === 'mu') {
        return {
          pos: nDir.clone().multiplyScalar(3.5),
          offset: V(8, 6, 11),
          color: c.mu,
          title: 'Vector normal unitario $\\hat{n}$',
          val: `θ actual = ${degTxt}° respecto a B`,
          desc: 'Vector perpendicular a la superficie que define la cara positiva del flujo.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(2.2 * Math.cos(thRad / 2), 0, 2.2 * Math.sin(thRad / 2)),
          offset: V(7, 5, 10),
          color: c.vxb,
          title: 'Arco del ángulo $\\theta$ entre $\\vec{B}$ y $\\hat{n}$',
          val: `θ = ${degTxt}°  ·  cos θ = ${cTh.toFixed(3)}`,
          desc: 'Determina la fracción del haz de campo magnético que atraviesa la superficie.'
        };
      }
    }

    /* ===== Tema 7: Ley de Gauss del magnetismo ===== */
    if (mod.id === 'ley-gauss') {
      const gCenter = V(S.gx, S.gy, 0);
      const live = mod.getLive ? mod.getLive() : { phiOut: 0, phiIn: 0, phiNet: 0 };

      if (key === 'B') {
        return {
          pos: gCenter.clone().add(V(0, S.Rg * 0.85, 0)),
          offset: V(9, 6, 13),
          color: c.B,
          title: 'Flujo magnético saliente ($\\Phi_{\\text{sal}} > 0$)',
          val: `Φ_sal = +${fm(live.phiOut * 1e6)} μWb (B · n̂ > 0)`,
          desc: 'Región donde las líneas de campo emergen hacia el exterior de S.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, 0, 0),
          offset: V(9, 6, 13),
          color: c.I,
          title: 'Fuente magnética sin monopolos ($q_m = 0$)',
          val: `${S.source === 'dipolo' ? 'Imán N–S' : 'Espira circular'} · I = ${S.I} A`,
          desc: 'Genera líneas de campo magnético que forman siempre lazos cerrados continuos.'
        };
      }
      if (key === 'v') {
        return {
          pos: gCenter,
          offset: V(10, 7, 14),
          color: c.v,
          title: 'Superficie gaussiana cerrada $S$',
          val: `${S.surf === 'esfera' ? 'Esfera' : 'Caja'} R_g = ${S.Rg} cm · Balance ${fm(live.phiNet * 1e6)} μWb`,
          desc: 'Superficie cerrada donde el flujo saliente y el entrante se cancelan.'
        };
      }
      if (key === 'F') {
        return {
          pos: gCenter.clone().add(V(0, -S.Rg * 0.85, 0)),
          offset: V(9, 6, 13),
          color: c.F,
          title: 'Flujo magnético entrante ($\\Phi_{\\text{ent}} < 0$)',
          val: `Φ_ent = −${fm(Math.abs(live.phiIn) * 1e6)} μWb (B · n̂ < 0)`,
          desc: 'Toda línea que sale de la superficie cerrada vuelve a entrar por otra región.'
        };
      }
      if (key === 'mu') {
        return {
          pos: V(0, 1.5, 0),
          offset: V(8, 5, 12),
          color: c.mu,
          title: 'Momento dipolar magnético $\\vec{\\mu}$ (Sur $\\to$ Norte)',
          val: 'Eje dipolar +Y · ∇ · B = 0',
          desc: 'Por el interior del imán las líneas regresan de Sur a Norte cerrando el lazo.'
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
    dirty = true;

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
    dirty = false;
    markerGrp.visible = false;
    const hud = $('vec-hud');
    if (hud) hud.hidden = true;
    document.querySelectorAll('.leg-item[data-vec]').forEach((el) => {
      el.classList.remove('on');
    });
  }

  function markDirty() {
    dirty = true;
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
    if (valEl && valEl.textContent !== info.val) valEl.textContent = info.val;

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

  function projectHud(pos) {
    const hud = $('vec-hud');
    if (!hud) return;
    const w = cvw.clientWidth;
    const h = cvw.clientHeight;
    const proj = pos.clone().project(cam);
    const sx = (proj.x * 0.5 + 0.5) * w;
    const sy = (-proj.y * 0.5 + 0.5) * h;

    const clampedX = Math.max(155, Math.min(w - 155, sx));
    const clampedY = Math.max(105, Math.min(h - 24, sy - 22));
    hud.style.left = clampedX + 'px';
    hud.style.top = clampedY + 'px';
  }

  let cachedInfo = null;

  function tick(now, isAnimating) {
    if (!activeKey || !Sim.activeMod) return;

    /* Pulso ligero del anillo 3D (solo propiedades WebGL, sin tocar el DOM) */
    markerGrp.quaternion.copy(cam.quaternion);
    const pulse = 1 + 0.14 * Math.sin(now * 0.006);
    ringMesh.scale.set(pulse, pulse, 1);

    const camHash = `${cam.position.x.toFixed(3)},${cam.position.y.toFixed(3)},${cam.position.z.toFixed(3)}:${ctl.target.x.toFixed(3)},${ctl.target.y.toFixed(3)},${ctl.target.z.toFixed(3)}`;
    const camMoved = camHash !== lastCamHash;
    lastCamHash = camHash;

    if (!dirty && !camAnim && !isAnimating && !camMoved && cachedInfo) {
      return;
    }

    const info = getInfo(Sim.activeMod, activeKey);
    if (!info) {
      clear();
      return;
    }
    cachedInfo = info;
    dirty = false;

    ringMat.color.set(info.color);
    haloMat.color.set(info.color);
    markerGrp.position.copy(info.pos);

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
    projectHud(info.pos);
  }

  Sim.inspector = { select, clear, tick, syncLegend, markDirty };
})();
