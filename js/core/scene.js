/* ===== Escena 3D, cámara, controles e iluminación ===== */
const cvw = $('cvw');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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

function syncSize() {
  const w = cvw.clientWidth;
  const h = cvw.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h);
  cam.aspect = w / h;
  cam.updateProjectionMatrix();
}
syncSize();
new ResizeObserver(syncSize).observe(cvw);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dl = new THREE.DirectionalLight(0xffffff, 0.7);
dl.position.set(5, 10, 7);
scene.add(dl);

Sim.scene = { cvw, renderer, scene, cam, ctl, syncSize, toggleTheme };
