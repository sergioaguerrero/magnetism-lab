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

  /* Marcador geométrico discreto que señala el elemento inspeccionado */
  const markerGrp = new THREE.Group();
  markerGrp.visible = false;
  scene.add(markerGrp);

  const ringGeo = new THREE.RingGeometry(0.38, 0.48, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x1b4d63,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    depthTest: false
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.renderOrder = 999;
  markerGrp.add(ringMesh);

  let camAnim = null;

  function animateCameraTo(targetPos, offsetVec) {
    camAnim = {
      t0: performance.now(),
      dur: 420,
      startTarget: ctl.target.clone(),
      startCam: cam.position.clone(),
      endTarget: targetPos.clone(),
      endCam: targetPos.clone().add(offsetVec)
    };
  }

  function getLegendItems(mod) {
    if (!mod) return [];
    const S = mod.state || {};
    const c = Sim.scene.getPalette().css;

    if (mod.id === 'campo-magnetico') {
      if (S.modo === 'iman') {
        return [
          { key: 'B', color: c.B, label: 'Campo $\\vec{B}$' },
          { key: 'I', color: c.I, label: 'Imán N–S' },
          { key: 'F', color: c.F, label: 'Brújula' }
        ];
      }
      return [
        { key: 'B', color: c.B, label: '$\\vec{B}$' },
        { key: 'v', color: c.v, label: '$\\vec{v}$' },
        { key: 'vxb', color: c.vxb, label: '$\\vec{v}\\times\\vec{B}$' },
        { key: 'F', color: c.F, label: '$\\vec{F}_B$' },
        { key: 'I', color: c.I, label: 'Carga $q$' }
      ];
    }

    if (mod.id === 'fuentes-campo') {
      const items = [
        { key: 'B', color: c.B, label: 'Líneas $\\vec{B}$' },
        { key: 'mu', color: c.mu, label: 'Sonda' },
        { key: 'F', color: c.F, label: 'Escala $|\\vec{B}|$' }
      ];
      if (S.geo === 'carga_mov') {
        items.splice(1, 0, { key: 'v', color: c.v, label: '$q\\vec{v}$' });
      } else {
        items.splice(1, 0, { key: 'I', color: c.I, label: '$I\\,d\\vec{l}$' });
      }
      return items;
    }

    if (mod.id === 'fuerza-corrientes') {
      return [
        { key: 'I', color: c.I, label: '$I_1$' },
        { key: 'v', color: c.v, label: '$I_2$' },
        { key: 'B', color: c.B, label: '$\\vec{B}_{1\\to 2}$' },
        { key: 'F', color: c.F, label: '$\\Delta\\vec{F}$' },
        { key: 'mu', color: c.mu, label: 'Tramo $\\Delta l$' }
      ];
    }

    if (mod.id === 'torque-lazo') {
      return [
        { key: 'B', color: c.B, label: '$\\vec{B}$' },
        { key: 'I', color: c.I, label: 'Espira $NI$' },
        { key: 'mu', color: c.mu, label: '$\\vec{\\mu}$' },
        { key: 'F', color: c.F, label: '$\\vec{F}_1, \\vec{F}_2$' },
        { key: 'v', color: c.v, label: '$\\vec{\\tau}$' }
      ];
    }

    if (mod.id === 'movimiento-particula') {
      const items = [
        { key: 'B', color: c.B, label: '$\\vec{B}$' },
        { key: 'v', color: c.v, label: '$\\vec{v}$' },
        { key: 'F', color: c.F, label: '$\\vec{F}$' },
        { key: 'I', color: c.I, label: 'Trayectoria' }
      ];
      if (S.rhr === 'si') {
        items.push({ key: 'vxb', color: c.vxb, label: '$\\vec{v}\\times\\vec{B}$' });
      }
      if (S.E > 0) {
        items.push({ key: 'mu', color: c.mu, label: '$\\vec{F}_E$' });
      }
      return items;
    }

    if (mod.id === 'flujo-magnetico') {
      return [
        { key: 'B', color: c.B, label: '$\\vec{B}$' },
        { key: 'mu', color: c.mu, label: 'Normal $\\hat{n}$' },
        { key: 'I', color: c.I, label: 'Superficie $A$' },
        { key: 'v', color: c.v, label: '$A\\cos\\theta$' },
        { key: 'vxb', color: c.vxb, label: 'Ángulo $\\theta$' }
      ];
    }

    if (mod.id === 'ley-gauss') {
      const items = [
        { key: 'B', color: c.B, label: '$\\Phi_{\\text{sal}} > 0$' },
        { key: 'F', color: c.F, label: '$\\Phi_{\\text{ent}} < 0$' },
        { key: 'v', color: c.v, label: 'Superficie $S$' },
        { key: 'I', color: c.I, label: S.source === 'dipolo' ? 'Imán N–S' : 'Espira $I$' }
      ];
      if (S.source === 'dipolo') {
        items.push({ key: 'mu', color: c.mu, label: '$\\vec{\\mu}$' });
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
          `<button type="button" class="leg-item${activeKey === it.key ? ' on' : ''}" data-vec="${it.key}" title="Inspeccionar en escena"><i class="dot" style="background:${it.color}"></i><span>${it.label}</span></button>`
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

    if (mod.id === 'campo-magnetico') {
      if (S.modo === 'iman') {
        const live = mod.getLive ? mod.getLive() : { pp: V(S.px, S.py, 0), bLocal: V(0, 1, 0), bMag: 0, angDeg: 0 };
        if (key === 'B') {
          return {
            pos: live.pp.clone().add(V(0, 0.8, 0)),
            offset: V(7, 5, 10),
            color: c.B,
            title: 'Campo local $\\vec{B}(x, y)$',
            val: `|B| = ${fm(live.bMag * 1e3)} mT · (${fm(live.bLocal.x * 1e3)}, ${fm(live.bLocal.y * 1e3)}) mT`,
            desc: 'Tangente a las líneas del dipolo en la posición de la brújula.'
          };
        }
        if (key === 'I') {
          return {
            pos: V(0, 0, 0),
            offset: V(8, 5, 11),
            color: c.I,
            title: 'Imán permanente (N–S)',
            val: 'Polo Norte +Y · Polo Sur −Y',
            desc: 'Dipolo magnético alineado sobre el eje vertical.'
          };
        }
        if (key === 'F') {
          return {
            pos: live.pp.clone(),
            offset: V(7, 5, 10),
            color: c.F,
            title: 'Brújula 3D',
            val: `(${S.px}, ${S.py}) cm · α = ${live.angDeg}°`,
            desc: 'La aguja Norte se orienta paralela al vector B local.'
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
          title: 'Campo magnético $\\vec{B}$',
          val: `|B| = ${S.B} mT (+Y)`,
          desc: 'Campo uniforme vertical que define el plano de interacción junto a v.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, 0, 0),
          offset: V(8, 5, 11),
          color: c.I,
          title: 'Carga de prueba $q$',
          val: `q = ${qSign > 0 ? '+' : '−'}${S.q} μC`,
          desc: 'Carga puntual ubicada en el origen.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(3.2 * sTh, 3.2 * cTh, 0),
          offset: V(7, 5, 10),
          color: c.v,
          title: 'Velocidad $\\vec{v}$',
          val: `|v| = ${S.v} m/s · θ = ${S.th}°`,
          desc: 'Vector contenido en el plano XY.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(0, 0, 3.2 * qSign),
          offset: V(7, 5, 10),
          color: c.F,
          title: 'Fuerza $\\vec{F}_B = q(\\vec{v}\\times\\vec{B})$',
          val: `|F_B| = ${fm(FB * 1e6)} μN (${qSign > 0 ? '+Z' : '−Z'})`,
          desc: 'Perpendicular al plano definido por v y B.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(0, 0, 3.0),
          offset: V(7, 5, 10),
          color: c.vxb,
          title: 'Producto vectorial $\\vec{v}\\times\\vec{B}$',
          val: `|v × B| = ${fm(vxb)} V/m`,
          desc: 'Módulo igual al área del paralelogramo sombreado.'
        };
      }
    }

    if (mod.id === 'fuentes-campo') {
      const pp = V(S.px, S.py, 0);
      const live = mod.getLive ? mod.getLive() : { bMag: 0 };

      if (key === 'B') {
        return {
          pos: V(4, 2, 0),
          offset: V(8, 6, 14),
          color: c.B,
          title: 'Líneas de campo $\\vec{B}$',
          val: `|B| en sonda = ${fm(live.bMag * 1e6)} μT`,
          desc: 'Curvas integradas numéricamente a partir de la ley de Biot-Savart.'
        };
      }
      if (key === 'I') {
        const iPos = S.geo === 'hilo' || S.geo === 'elemento_dl' ? V(0, 2, 0) : V(0, 0, -S.R);
        return {
          pos: iPos,
          offset: V(8, 6, 12),
          color: c.I,
          title: 'Corriente $I\\,d\\vec{l}$',
          val: `I = ${S.I} A`,
          desc: 'Trayectoria del conductor discretizada en elementos diferenciales.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(0, 1.8, 0),
          offset: V(7, 5, 11),
          color: c.v,
          title: 'Carga móvil $q\\vec{v}$',
          val: `q·v = ${fm(S.I * 0.01)} C·m/s (+Y)`,
          desc: 'Fuente puntual en movimiento sobre el eje vertical.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(2, 0, 0),
          offset: V(7, 5, 11),
          color: c.F,
          title: 'Mapa de intensidad $|\\vec{B}|$',
          val: 'Escala logarítmica sobre z = 0',
          desc: 'Indica dirección local y decaimiento espacial respecto a la fuente.'
        };
      }
      if (key === 'mu') {
        return {
          pos: pp,
          offset: V(7, 5, 12),
          color: c.mu,
          title: 'Sonda $\\vec{B}(x, y, 0)$',
          val: `(${S.px}, ${S.py}, 0) cm · ${fm(live.bMag * 1e6)} μT`,
          desc: 'Punto de comparación entre integración discreta y fórmula analítica.'
        };
      }
    }

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
          title: 'Campo $\\vec{B}_{1\\to 2}$',
          val: `|B₁| = ${fm(B1 * 1e6)} μT (−Z)`,
          desc: 'Campo generado por el hilo 1 en la posición del hilo 2.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(x1, S.y0 + 1.5, 0),
          offset: V(8, 5, 11),
          color: c.I,
          title: 'Conductor 1 ($I_1$)',
          val: `I₁ = ${S.I1} A (+Y) · x₁ = ${x1} cm`,
          desc: 'Corriente fija en sentido positivo del eje Y.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(x2, S.y0 + 1.5 * s2, 0),
          offset: V(8, 5, 11),
          color: c.v,
          title: 'Conductor 2 ($I_2$)',
          val: `I₂ = ${S.I2} A (${s2 > 0 ? '+Y' : '−Y'}) · x₂ = +${x2} cm`,
          desc: 'Su sentido relativo determina atracción o repulsión.'
        };
      }
      if (key === 'F') {
        return {
          pos: V(x2 - s2 * 1.8, S.y0, 0),
          offset: V(7, 5, 11),
          color: c.F,
          title: 'Fuerza $\\Delta\\vec{F}$',
          val: `ΔF = ${fm(dF * 1e6)} μN · F/L = ${fm(FperL * 1e6)} μN/m`,
          desc: s2 > 0 ? 'Fuerzas atractivas (acción y reacción).' : 'Fuerzas repulsivas (acción y reacción).'
        };
      }
      if (key === 'mu') {
        return {
          pos: V(x2, S.y0, 0),
          offset: V(7, 4, 10),
          color: c.mu,
          title: 'Segmento $\\Delta l$',
          val: `Δl = ${S.dl} cm · y₀ = ${S.y0} cm`,
          desc: 'Tramo sobre el que se integra la fuerza magnética.'
        };
      }
    }

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
          title: 'Campo uniforme $\\vec{B}$',
          val: `|B| = ${S.B} mT (+X)`,
          desc: 'Campo externo horizontal uniforme.'
        };
      }
      if (key === 'I') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2),
          offset: V(7, 6, 10),
          color: c.I,
          title: 'Espira conductora',
          val: `I = ${S.I} A · N = ${S.N} · L = ${S.L} cm`,
          desc: 'Circuito cerrado sometido al par magnético.'
        };
      }
      if (key === 'v') {
        const sTh = Math.sin(thRad);
        return {
          pos: V(0, sTh >= 0 ? -2.4 : 2.4, 0),
          offset: V(7, 6, 10),
          color: c.v,
          title: 'Torque $\\vec{\\tau} = \\vec{\\mu}\\times\\vec{B}$',
          val: `|τ| = ${fm(tau)} N·m · θ = ${degTxt}°`,
          desc: 'Dirigido sobre el eje de rotación Y.'
        };
      }
      if (key === 'F') {
        return {
          pos: uDir.clone().multiplyScalar(S.L / 2).add(V(0, 0, -2.0)),
          offset: V(7, 6, 10),
          color: c.F,
          title: 'Par de fuerzas laterales',
          val: `F = ${fm(Farm)} N · ∑F = 0 N`,
          desc: 'Fuerzas opuestas en los brazos verticales que producen el giro.'
        };
      }
      if (key === 'mu') {
        return {
          pos: nDir.clone().multiplyScalar(3.2),
          offset: V(7, 6, 10),
          color: c.mu,
          title: 'Momento dipolar $\\vec{\\mu}$',
          val: `|μ| = ${fm(mu)} A·m² · θ = ${degTxt}°`,
          desc: 'Normal al plano de la espira; tiende a alinearse con B.'
        };
      }
    }

    if (mod.id === 'movimiento-particula') {
      const live = mod.getLive ? mod.getLive() : { p: V(), v: V(1, 0, 0), B: V(0, 1, 0), E: V(), F: V(), q: -E_, m: 9.1e-31 };
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
          title: 'Campo magnético $\\vec{B}$',
          val: `|B| = ${fm(S.B)} mT (+Y)`,
          desc: 'Curva la trayectoria sin alterar la energía cinética.',
          follow: true
        };
      }
      if (key === 'I') {
        const rGyro = (live.m * live.v.length() * Math.sin((S.th * Math.PI) / 180)) / (Math.abs(live.q) * (S.B * 1e-3));
        return {
          pos: p.clone(),
          offset: V(4.2, 3.0, 5.2),
          color: c.I,
          title: 'Partícula y trayectoria',
          val: `q = ${fm(live.q)} C · r = ${fm(rGyro)} m`,
          desc: 'Integrada mediante el método simpléctico de Boris.',
          follow: true
        };
      }
      if (key === 'v') {
        const Ek = (0.5 * live.m * live.v.lengthSq()) / E_;
        return {
          pos: p.clone().addScaledVector(vDir, 2.0),
          offset: V(3.4, 2.2, 4.4),
          color: c.v,
          title: 'Velocidad instantánea $\\vec{v}$',
          val: `|v| = ${fm(live.v.length())} m/s · Ek = ${fm(Ek)} eV`,
          desc: 'Tangente a la trayectoria.',
          follow: true
        };
      }
      if (key === 'F') {
        return {
          pos: p.clone().addScaledVector(fDir, 2.0),
          offset: V(3.4, 2.2, 4.4),
          color: c.F,
          title: 'Fuerza de Lorentz $\\vec{F}$',
          val: `|F| = ${fm(live.F.length())} N`,
          desc: live.q > 0 ? 'Paralela a v × B (q > 0).' : 'Opuesta a v × B (q < 0).',
          follow: true
        };
      }
      if (key === 'mu') {
        const feMag = Math.abs(live.q) * (S.E * 1e3);
        return {
          pos: p.clone().add(V(0, 0, live.q > 0 ? -1.8 : 1.8)),
          offset: V(3.6, 2.3, 4.6),
          color: c.mu,
          title: 'Fuerza eléctrica $\\vec{F}_E$',
          val: `|F_E| = ${fm(feMag)} N · E = ${fm(S.E)} kV/m`,
          desc: 'Componente transversal sobre el eje Z.',
          follow: true
        };
      }
      if (key === 'vxb') {
        return {
          pos: p.clone().addScaledVector(vxbDir, 1.8),
          offset: V(3.4, 2.2, 4.4),
          color: c.vxb,
          title: 'Producto cruz $\\vec{v}\\times\\vec{B}$',
          val: `|v × B| = ${fm(vxb.length())} V/m`,
          desc: 'Referencia direccional de la regla de la mano derecha.',
          follow: true
        };
      }
    }

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
          title: 'Campo uniforme $\\vec{B}$',
          val: `|B| = ${S.B} mT · Φ_B = ${fm(phi * 1e6)} μWb`,
          desc: 'Densidad espacial de líneas proporcional a la magnitud de B.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, S.L / 2, 0),
          offset: V(8, 6, 11),
          color: c.I,
          title: 'Superficie de área $A$',
          val: `A = ${fm(A * 1e4)} cm²`,
          desc: 'Superficie plana orientable donde se evalúa el flujo.'
        };
      }
      if (key === 'v') {
        return {
          pos: V(-10, 0, 0),
          offset: V(9, 6, 12),
          color: c.v,
          title: 'Proyección $A_\\perp = A\\cos\\theta$',
          val: `A_⊥ = ${fm(A * cTh * 1e4)} cm² · cos θ = ${cTh.toFixed(3)}`,
          desc: 'Sección eficaz proyectada en el plano x = −10 cm.'
        };
      }
      if (key === 'mu') {
        return {
          pos: nDir.clone().multiplyScalar(3.5),
          offset: V(8, 6, 11),
          color: c.mu,
          title: 'Vector normal $\\hat{n}$',
          val: `θ = ${degTxt}° respecto a B`,
          desc: 'Define la orientación positiva de la superficie.'
        };
      }
      if (key === 'vxb') {
        return {
          pos: V(2.2 * Math.cos(thRad / 2), 0, 2.2 * Math.sin(thRad / 2)),
          offset: V(7, 5, 10),
          color: c.vxb,
          title: 'Ángulo $\\theta$',
          val: `θ = ${degTxt}° · cos θ = ${cTh.toFixed(3)}`,
          desc: 'Inclinación entre el vector normal y el campo magnético.'
        };
      }
    }

    if (mod.id === 'ley-gauss') {
      const gCenter = V(S.gx, S.gy, 0);
      const live = mod.getLive ? mod.getLive() : { phiOut: 0, phiIn: 0, phiNet: 0 };

      if (key === 'B') {
        return {
          pos: gCenter.clone().add(V(0, S.Rg * 0.85, 0)),
          offset: V(9, 6, 13),
          color: c.B,
          title: 'Flujo saliente ($\\Phi_{\\text{sal}} > 0$)',
          val: `+${fm(live.phiOut * 1e6)} μWb (B · n̂ > 0)`,
          desc: 'Zonas donde el campo atraviesa S hacia el exterior.'
        };
      }
      if (key === 'I') {
        return {
          pos: V(0, 0, 0),
          offset: V(9, 6, 13),
          color: c.I,
          title: 'Fuente magnética ($q_m = 0$)',
          val: `${S.source === 'dipolo' ? 'Imán N–S' : 'Espira'} · I = ${S.I} A`,
          desc: 'Produce exclusivamente líneas cerradas sin fuentes ni sumideros.'
        };
      }
      if (key === 'v') {
        return {
          pos: gCenter,
          offset: V(10, 7, 14),
          color: c.v,
          title: 'Superficie gaussiana $S$',
          val: `${S.surf === 'esfera' ? 'Esfera' : 'Caja'} R_g = ${S.Rg} cm · Balance ${fm(live.phiNet * 1e6)} μWb`,
          desc: 'Frontera cerrada sobre la que se integra el flujo magnético.'
        };
      }
      if (key === 'F') {
        return {
          pos: gCenter.clone().add(V(0, -S.Rg * 0.85, 0)),
          offset: V(9, 6, 13),
          color: c.F,
          title: 'Flujo entrante ($\\Phi_{\\text{ent}} < 0$)',
          val: `−${fm(Math.abs(live.phiIn) * 1e6)} μWb (B · n̂ < 0)`,
          desc: 'Compensa el flujo saliente al cerrarse cada línea de campo.'
        };
      }
      if (key === 'mu') {
        return {
          pos: V(0, 1.5, 0),
          offset: V(8, 5, 12),
          color: c.mu,
          title: 'Momento dipolar $\\vec{\\mu}$',
          val: 'Sur → Norte (+Y)',
          desc: 'En el interior del imán el campo retorna de Sur a Norte.'
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
    hud.style.borderTopColor = info.color;

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

    const clampedX = Math.max(150, Math.min(w - 150, sx));
    const clampedY = Math.max(115, Math.min(h - 60, sy - 20));
    hud.style.left = clampedX + 'px';
    hud.style.top = clampedY + 'px';
  }

  let cachedInfo = null;

  function tick(now, isAnimating) {
    if (!activeKey || !Sim.activeMod) return;

    markerGrp.quaternion.copy(cam.quaternion);

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
