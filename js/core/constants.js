/* ===== Constantes físicas (SI) y utilidades globales ===== */
window.Sim = window.Sim || {
  modules: [],
  modulesById: {},
  registerModule(modDef) {
    if (modDef.state) {
      modDef.defaultState = JSON.parse(JSON.stringify(modDef.state));
    }
    this.modules.push(modDef);
    this.modulesById[modDef.id] = modDef;
  }
};

const MU0 = 4e-7 * Math.PI;
const E_ = 1.602176634e-19;

const P = {
  e: [-E_, 9.1093837e-31],
  p: [E_, 1.67262192e-27],
  a: [2 * E_, 6.6446573e-27]
};

const V = (x = 0, y = 0, z = 0) => (typeof THREE !== 'undefined' ? new THREE.Vector3(x, y, z) : { x, y, z });
const $ = (id) => document.getElementById(id);

const fm = (x) => {
  if (!isFinite(x) || x === 0) return '0';
  const a = Math.abs(x);
  return a >= 0.01 && a < 1e5 ? String(+x.toPrecision(4)) : x.toExponential(3);
};
