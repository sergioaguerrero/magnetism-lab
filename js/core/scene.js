/* ===== Escena 3D, iluminación de estudio científico, paleta calibrada y limpieza GPU ===== */
const cvw = $('cvw');

const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
const themeListeners = [];

function isDarkTheme() {
  const manual = document.documentElement.dataset.theme;
  if (manual === 'dark') return true;
  if (manual === 'light') return false;
  return darkMedia.matches;
}

/* Paleta física calibrada 1:1 con css/styles.css (sin colores neón ni Tailwind por defecto) */
function getPalette() {
  if (isDarkTheme()) {
    return {
      bg: 0x121312,
      B: 0x4ca978,
      BAlt: 0x3b8c64,
      I: 0xd98c3f,
      v: 0x5ba3cf,
      F: 0xd9534f,
      mu: 0xb878b0,
      vxb: 0xd1aa47,
      arc: 0xcab06a,
      south: 0x4d7eb8,
      probe: 0xe8e6df,
      probeEmissive: 0x8e5687,
      gridMajor: 0x343733,
      gridMinor: 0x20221f,
      axisX: 0xb35a57,
      axisY: 0x528f6e,
      axisZ: 0x5985a8,
      axisNeg: 0x454843,
      axisLine: 0x76736b,
      labelInk: '#b5b2a8',
      fluxPos: 0x4ca978,
      fluxNeg: 0xd9534f,
      fluxZero: 0x7a7d77,
      gaussSurf: 0x5ba3cf,
      css: {
        B: '#4ca978',
        I: '#d98c3f',
        v: '#5ba3cf',
        F: '#d9534f',
        mu: '#b878b0',
        vxb: '#d1aa47',
        south: '#4d7eb8'
      }
    };
  }
  return {
    bg: 0xf1efe9,
    B: 0x1b6e44,
    BAlt: 0x257c52,
    I: 0xb45309,
    v: 0x1d5d8a,
    F: 0xb42318,
    mu: 0x7c3572,
    vxb: 0x8a6116,
    arc: 0x9a6d1a,
    south: 0x245086,
    probe: 0x56234f,
    probeEmissive: 0x7c3572,
    gridMajor: 0xc8c3b7,
    gridMinor: 0xdedad0,
    axisX: 0xa34b46,
    axisY: 0x357554,
    axisZ: 0x39688c,
    axisNeg: 0xb8b3a6,
    axisLine: 0x6f6c64,
    labelInk: '#4e4c46',
    fluxPos: 0x1b6e44,
    fluxNeg: 0xb42318,
    fluxZero: 0x76736a,
    gaussSurf: 0x1d5d8a,
    css: {
      B: '#1b6e44',
      I: '#b45309',
      v: '#1d5d8a',
      F: '#b42318',
      mu: '#7c3572',
      vxb: '#8a6116',
      south: '#245086'
    }
  };
}

function disposeMaterial(mat) {
  if (!mat) return;
  if (Array.isArray(mat)) {
    mat.forEach(disposeMaterial);
    return;
  }
  if (!mat._shared) {
    if (mat.map && !mat.map._shared && typeof mat.map.dispose === 'function') {
      mat.map.dispose();
    }
    if (typeof mat.dispose === 'function') {
      mat.dispose();
    }
  }
}

/* Libera recursivamente geometrías, texturas y materiales en GPU respetando buffers compartidos */
function disposeObject(obj) {
  if (!obj) return;
  if (typeof THREE !== 'undefined' && obj instanceof THREE.ArrowHelper) {
    if (obj.line) disposeMaterial(obj.line.material);
    if (obj.cone) disposeMaterial(obj.cone.material);
    return;
  }
  if (obj.children && obj.children.length > 0) {
    for (let i = obj.children.length - 1; i >= 0; i--) {
      disposeObject(obj.children[i]);
    }
  }
  if (obj.geometry && !obj.geometry._shared && typeof obj.geometry.dispose === 'function') {
    obj.geometry.dispose();
  }
  if (obj.material) {
    disposeMaterial(obj.material);
  }
}

function clearGroup(group) {
  if (!group) return;
  for (let i = group.children.length - 1; i >= 0; i--) {
    disposeObject(group.children[i]);
  }
  group.clear();
}

function showFallback(title, detail) {
  if (!cvw) return;
  const box = document.createElement('div');
  box.className = 'sim-fallback';
  box.innerHTML = `<strong>${title}</strong><p>${detail}</p>`;
  cvw.appendChild(box);
}

let renderer = null;
let scene = null;
let cam = null;
let ctl = null;
let hemiLight = null;
let webglReady = false;

if (typeof THREE === 'undefined') {
  showFallback(
    'No se pudo cargar el motor 3D',
    'Verifica la conexión de red para cargar las dependencias gráficas y matemáticas.'
  );
} else {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (typeof THREE.ACESFilmicToneMapping !== 'undefined') {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
    }
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    cvw.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(46, 1, 0.1, 1500);
    ctl = new THREE.OrbitControls(cam, renderer.domElement);
    ctl.enableDamping = true;
    ctl.dampingFactor = 0.08;
    ctl.minDistance = 2.5;
    ctl.maxDistance = 120;
    ctl.maxPolarAngle = Math.PI * 0.96;
    ctl.minPolarAngle = Math.PI * 0.04;
    webglReady = true;
  } catch (err) {
    showFallback(
      'WebGL no está disponible',
      'Activa la aceleración por hardware o utiliza un navegador compatible para ejecutar las simulaciones 3D.'
    );
  }
}

function applySceneTheme() {
  if (!scene) return;
  const pal = getPalette();
  scene.background = new THREE.Color(pal.bg);
  if (hemiLight) {
    hemiLight.color.setHex(isDarkTheme() ? 0xd8dfd8 : 0xffffff);
    hemiLight.groundColor.setHex(isDarkTheme() ? 0x1d201d : 0xd7d2c6);
  }
  themeListeners.forEach((fn) => {
    try {
      fn(pal, isDarkTheme());
    } catch (_) {
      /* noop */
    }
  });
}

if (webglReady) {
  /* Iluminación de estudio de 3 puntos para volumen claro sin brillos artificiales */
  hemiLight = new THREE.HemisphereLight(0xffffff, 0xd7d2c6, 0.72);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffaf2, 0.85);
  keyLight.position.set(10, 16, 12);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xdbe8f4, 0.35);
  rimLight.position.set(-12, -4, -10);
  scene.add(rimLight);

  applySceneTheme();
  darkMedia.addEventListener('change', applySceneTheme);

  let resizeTimer = null;
  let firstSize = true;

  function syncSize() {
    const w = cvw.clientWidth;
    const h = cvw.clientHeight;
    if (!w || !h) return;

    cam.aspect = w / h;
    cam.updateProjectionMatrix();

    if (firstSize) {
      firstSize = false;
      renderer.setSize(w, h, false);
      return;
    }

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const fw = cvw.clientWidth;
      const fh = cvw.clientHeight;
      if (fw && fh) {
        renderer.setSize(fw, fh, false);
        cam.aspect = fw / fh;
        cam.updateProjectionMatrix();
      }
    }, 120);
  }

  syncSize();
  new ResizeObserver(syncSize).observe(cvw);

  Sim.scene = {
    cvw,
    renderer,
    scene,
    cam,
    ctl,
    webglReady,
    syncSize,
    isDarkTheme,
    getPalette,
    clearGroup,
    disposeObject,
    onThemeChange(fn) {
      if (typeof fn === 'function') themeListeners.push(fn);
    },
    toggleTheme() {
      const next = isDarkTheme() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      applySceneTheme();
    }
  };
} else {
  Sim.scene = {
    cvw,
    renderer: null,
    scene: null,
    cam: null,
    ctl: null,
    webglReady: false,
    syncSize() {},
    isDarkTheme,
    getPalette,
    clearGroup() {},
    disposeObject() {},
    onThemeChange() {},
    toggleTheme() {
      const next = isDarkTheme() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
    }
  };
}
