/* ===== Primitivas 3D científicas: ejes etiquetados, cuadrículas calibradas y vectores sólidos ===== */
(function () {
  if (!Sim.scene || !Sim.scene.webglReady) {
    Sim.viz = {
      createAxes: () => null,
      createGrid: () => null,
      createVector: () => null,
      createLabel: () => null
    };
    return;
  }

  /* Geometrías unitarias compartidas para vectores sólidos (cero asignaciones al actualizar) */
  const UNIT_SHAFT_GEO = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false);
  UNIT_SHAFT_GEO.translate(0, 0.5, 0);
  UNIT_SHAFT_GEO._shared = true;

  const UNIT_CONE_GEO = new THREE.ConeGeometry(1, 1, 14);
  UNIT_CONE_GEO.translate(0, 0.5, 0);
  UNIT_CONE_GEO._shared = true;

  const UP = new THREE.Vector3(0, 1, 0);

  /* Etiqueta 3D nítida en canvas de alta resolución (IBM Plex Mono) */
  function createLabel(text, opts = {}) {
    if (typeof document === 'undefined' || !document.createElement) return null;
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return null;

    const fontSize = opts.fontSize || 34;
    const weight = opts.weight || '600';
    const fontFamily = opts.fontFamily || '"IBM Plex Mono", Consolas, monospace';
    const color = opts.color || Sim.scene.getPalette().labelInk;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const padX = 14;
    const padY = 10;
    canvas.width = Math.max(64, Math.ceil(metrics.width + padX * 2));
    canvas.height = Math.max(48, Math.ceil(fontSize + padY * 2));

    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: opts.depthTest !== undefined ? opts.depthTest : true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    const worldH = opts.worldHeight || 0.72;
    const aspect = canvas.width / canvas.height;
    sprite.scale.set(worldH * aspect, worldH, 1);
    return sprite;
  }

  /* Vector 3D científico con vástago cilíndrico sólido, punta cónica proporcionada y etiqueta opcional */
  function createVector(dir, origin, length, color, opts = {}) {
    const grp = new THREE.Group();
    const radius = opts.radius || 0.068;
    const headLenRatio = opts.headLength || Math.min(0.85, Math.max(0.32, length * 0.22));
    const headRad = opts.headRadius || radius * 2.55;

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.46,
      metalness: 0.08
    });

    const shaft = new THREE.Mesh(UNIT_SHAFT_GEO, mat);
    const cone = new THREE.Mesh(UNIT_CONE_GEO, mat);
    grp.add(shaft, cone);

    let labelSprite = null;
    if (opts.label) {
      const hexStr = '#' + new THREE.Color(color).getHexString();
      labelSprite = createLabel(opts.label, {
        color: hexStr,
        worldHeight: opts.labelHeight || 0.75,
        depthTest: false
      });
      if (labelSprite) {
        labelSprite.renderOrder = 20;
        grp.add(labelSprite);
      }
    }

    const tmpDir = new THREE.Vector3();
    let curLen = length;
    let curHeadLen = headLenRatio;
    let curHeadRad = headRad;

    function layoutGeometry() {
      const safeLen = Math.max(0.001, curLen);
      const hLen = Math.min(curHeadLen, safeLen * 0.45);
      const sLen = Math.max(0.001, safeLen - hLen);
      shaft.scale.set(radius, sLen, radius);
      cone.position.set(0, sLen, 0);
      cone.scale.set(curHeadRad, hLen, curHeadRad);
      if (labelSprite) {
        labelSprite.position.set(0, safeLen + 0.55, 0);
      }
    }

    grp.setDirection = function (d) {
      if (!d) return grp;
      tmpDir.copy(d);
      if (tmpDir.lengthSq() < 1e-14) return grp;
      tmpDir.normalize();
      if (tmpDir.y > 0.99999) {
        grp.quaternion.set(0, 0, 0, 1);
      } else if (tmpDir.y < -0.99999) {
        grp.quaternion.set(1, 0, 0, 0);
      } else {
        grp.quaternion.setFromUnitVectors(UP, tmpDir);
      }
      return grp;
    };

    grp.setLength = function (len, hLen, hRad) {
      curLen = len;
      if (hLen !== undefined) curHeadLen = hLen;
      if (hRad !== undefined) curHeadRad = hRad;
      layoutGeometry();
      return grp;
    };

    grp.setColor = function (c) {
      mat.color.set(c);
      return grp;
    };

    grp.setOrigin = function (o) {
      if (o) grp.position.copy(o);
      return grp;
    };

    grp.position.copy(origin || new THREE.Vector3());
    grp.setDirection(dir || UP);
    layoutGeometry();
    return grp;
  }

  /* Sistema de coordenadas personalizado con semiejes, marcas de escala y etiquetas +X, +Y, +Z */
  function createAxes(length = 10, opts = {}) {
    const grp = new THREE.Group();
    const pal = Sim.scene.getPalette();
    const negLen = opts.negLength !== undefined ? opts.negLength : length * 0.35;
    const tickStep = opts.tickStep || (length >= 10 ? 2 : 1);
    const tickSize = length >= 10 ? 0.16 : 0.1;
    const axisRad = opts.radius || (length >= 10 ? 0.032 : 0.022);
    const headLen = length >= 10 ? 0.42 : 0.24;
    const headRad = axisRad * 3.1;

    const defs = [
      { name: '+X', dir: new THREE.Vector3(1, 0, 0), perp: new THREE.Vector3(0, 1, 0), color: pal.axisX },
      { name: '+Y', dir: new THREE.Vector3(0, 1, 0), perp: new THREE.Vector3(1, 0, 0), color: pal.axisY },
      { name: '+Z', dir: new THREE.Vector3(0, 0, 1), perp: new THREE.Vector3(0, 1, 0), color: pal.axisZ }
    ];

    const negPts = [];
    const tickPts = [];

    defs.forEach((ax) => {
      const vec = createVector(ax.dir, new THREE.Vector3(), length, ax.color, {
        radius: axisRad,
        headLength: headLen,
        headRadius: headRad
      });
      grp.add(vec);

      if (negLen > 0) {
        negPts.push(new THREE.Vector3(), ax.dir.clone().multiplyScalar(-negLen));
      }

      if (tickStep > 0) {
        for (let t = tickStep; t < length - headLen; t += tickStep) {
          const base = ax.dir.clone().multiplyScalar(t);
          tickPts.push(
            base.clone().addScaledVector(ax.perp, -tickSize),
            base.clone().addScaledVector(ax.perp, tickSize)
          );
        }
      }

      const hexStr = '#' + new THREE.Color(ax.color).getHexString();
      const lbl = createLabel(ax.name, {
        color: hexStr,
        worldHeight: length >= 10 ? 0.68 : 0.44
      });
      if (lbl) {
        lbl.position.copy(ax.dir).multiplyScalar(length + (length >= 10 ? 0.65 : 0.38));
        grp.add(lbl);
      }
    });

    if (negPts.length > 0) {
      grp.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(negPts),
          new THREE.LineBasicMaterial({ color: pal.axisNeg, transparent: true, opacity: 0.45 })
        )
      );
    }

    if (tickPts.length > 0) {
      grp.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(tickPts),
          new THREE.LineBasicMaterial({ color: pal.axisNeg, transparent: true, opacity: 0.6 })
        )
      );
    }

    if (opts.unitLabel) {
      const scaleLbl = createLabel(opts.unitLabel, {
        color: pal.labelInk,
        worldHeight: length >= 10 ? 0.5 : 0.36
      });
      if (scaleLbl) {
        scaleLbl.position.set(length * 0.72, -0.55, 0);
        grp.add(scaleLbl);
      }
    }

    return grp;
  }

  /* Cuadrícula científica calibrada con diferenciación entre divisiones principales y secundarias */
  function createGrid(opts = {}) {
    const size = opts.size || 24;
    const majorStep = opts.majorStep || 4;
    const minorStep = opts.minorStep || 2;
    const plane = opts.plane || 'xz';
    const pal = Sim.scene.getPalette();
    const half = size / 2;

    const grp = new THREE.Group();
    const majorPts = [];
    const minorPts = [];

    const mkPt = (a, b) => (plane === 'xy' ? new THREE.Vector3(a, b, 0) : new THREE.Vector3(a, 0, b));

    for (let v = -half; v <= half + 1e-6; v += minorStep) {
      const rounded = Math.round(v * 1000) / 1000;
      const isMajor = Math.abs(rounded % majorStep) < 1e-4;
      const target = isMajor ? majorPts : minorPts;
      target.push(mkPt(rounded, -half), mkPt(rounded, half));
      target.push(mkPt(-half, rounded), mkPt(half, rounded));
    }

    if (minorPts.length > 0) {
      grp.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(minorPts),
          new THREE.LineBasicMaterial({ color: pal.gridMinor, transparent: true, opacity: 0.55 })
        )
      );
    }

    if (majorPts.length > 0) {
      grp.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(majorPts),
          new THREE.LineBasicMaterial({ color: pal.gridMajor, transparent: true, opacity: 0.75 })
        )
      );
    }

    return grp;
  }

  Sim.viz = {
    createAxes,
    createGrid,
    createVector,
    createLabel
  };
})();
