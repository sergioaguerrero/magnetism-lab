/* ===== Escena 3D, cámara, controles e iluminación ===== */
const cvw = $('cvw');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
cvw.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(50, 1, 0.05, 3000);
const ctl = new THREE.OrbitControls(cam, renderer.domElement);
ctl.enableDamping = true;

const dark = window.matchMedia('(prefers-color-scheme: dark)');
const isDarkTheme = () => {
  const manual = document.documentElement.dataset.theme;
  if (manual === 'dark') return true;
  if (manual === 'light') return false;
  return dark.matches;
};
const setBg = () => {
  scene.background = new THREE.Color(isDarkTheme() ? 0x0b0e13 : 0xe9edf2);
};
setBg();
dark.addEventListener('change', setBg);

function toggleTheme() {
  const next = isDarkTheme() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  setBg();
}

let resizeTimer = null;
let firstSize = true;

function syncSize() {
  const w = cvw.clientWidth;
  const h = cvw.clientHeight;
  if (!w || !h) return;

  /* Actualiza la matriz de proyección de la cámara en cada fotograma de la animación sin pausar WebGL */
  cam.aspect = w / h;
  cam.updateProjectionMatrix();

  if (firstSize) {
    firstSize = false;
    renderer.setSize(w, h, false);
    return;
  }

  /* Evita reasignar el framebuffer de la GPU 30 veces durante la transición CSS de las barras laterales */
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

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dl = new THREE.DirectionalLight(0xffffff, 0.7);
dl.position.set(5, 10, 7);
scene.add(dl);

Sim.scene = { cvw, renderer, scene, cam, ctl, syncSize, toggleTheme };
