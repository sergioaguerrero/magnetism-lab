/* ===== Escena 3D, cámara, controles, paleta adaptable y limpieza de memoria WebGL ===== */
const cvw = $('cvw');

const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
const themeListeners = [];

function isDarkTheme() {
  const manual = document.documentElement.dataset.theme;
  if (manual === 'dark') return true;
  if (manual === 'light') return false;
  return darkMedia.matches;
}

function getPalette() {
  if (isDarkTheme()) {
    return {
      bg: 0x0b0e13,
      B: 0x22c55e,
      BAlt: 0x10b981,
      I: 0xf59e0b,
      v: 0x38bdf8,
      F: 0xef4444,
      mu: 0xe879f9,
      vxb: 0xfacc15,
      arc: 0xfef08a,
      probe: 0xffffff,
      probeEmissive: 0xe879f9,
      gridMain: 0x334155,
      gridSub: 0x1e293b,
      axisLine: 0x9aa5b1,
      fluxPos: 0x10b981,
      fluxNeg: 0xf43f5e,
      fluxZero: 0x94a3b8,
      gaussSurf: 0x38bdf8,
      css: {
        B: '#22c55e',
        I: '#f59e0b',
        v: '#38bdf8',
        F: '#ef4444',
        mu: '#e879f9',
        vxb: '#facc15'
      }
    };
  }
  return {
    bg: 0xe9edf2,
    B: 0x15803d,
    BAlt: 0x059669,
    I: 0xd97706,
    v: 0x0284c7,
    F: 0xdc2626,
    mu: 0xa21caf,
    vxb: 0xb45309,
    arc: 0xca8a04,
    probe: 0x701a75,
    probeEmissive: 0xa21caf,
    gridMain: 0x94a3b8,
    gridSub: 0xcbd5e1,
    axisLine: 0x475569,
    fluxPos: 0x059669,
    fluxNeg: 0xe11d48,
    fluxZero: 0x64748b,
    gaussSurf: 0x0284c7,
    css: {
      B: '#15803d',
      I: '#d97706',
      v: '#0284c7',
      F: '#dc2626',
      mu: '#a21caf',
      vxb: '#b45309'
    }
  };
}

function disposeMaterial(mat) {
  if (!mat) return;
  if (Array.isArray(mat)) {
    mat.forEach(disposeMaterial);
    return;
  }
  if (!mat._shared && typeof mat.dispose === 'function') {
    mat.dispose();
  }
}

/* Libera recursivamente geometrías y materiales en GPU respetando los buffers compartidos de ArrowHelper */
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
let webglReady = false;

if (typeof THREE === 'undefined') {
  showFallback(
    'No se pudo cargar Three.js',
    'Verifica tu conexión a internet para descargar las librerías del visor 3D (Three.js y KaTeX).'
  );
} else {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    cvw.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(50, 1, 0.05, 3000);
    ctl = new THREE.OrbitControls(cam, renderer.domElement);
    ctl.enableDamping = true;
    webglReady = true;
  } catch (err) {
    showFallback(
      'WebGL no está disponible en este navegador',
      'Activa la aceleración por hardware o utiliza un navegador compatible con WebGL para ver el laboratorio 3D.'
    );
  }
}

function applySceneTheme() {
  if (!scene) return;
  scene.background = new THREE.Color(getPalette().bg);
  themeListeners.forEach((fn) => {
    try {
      fn(getPalette(), isDarkTheme());
    } catch (_) {
      /* noop */
    }
  });
}

if (webglReady) {
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
    }, 180);
  }

  syncSize();
  new ResizeObserver(syncSize).observe(cvw);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 0.65));
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const dl = new THREE.DirectionalLight(0xffffff, 0.75);
  dl.position.set(6, 12, 8);
  scene.add(dl);

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
