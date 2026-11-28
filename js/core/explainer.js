/* ===== Desarrollo analítico contextual por tema (redacción académica individualizada) ===== */
(function () {
  function fmTex(x) {
    if (x === 0 || !isFinite(x)) return '0';
    const a = Math.abs(x);
    if (a >= 0.001 && a < 1e4) {
      return String(+x.toPrecision(4));
    }
    const exp = Math.floor(Math.log10(a));
    const mant = +(x / Math.pow(10, exp)).toPrecision(3);
    return `${mant}\\times 10^{${exp}}`;
  }

  /* Tema 1: estructura centrada en producto vectorial (modo vectorial) o campo dipolar (modo imán) */
  function buildTema1(S, mod) {
    if (S.modo === 'iman') {
      const live = mod.getLive ? mod.getLive() : null;
      const bxMt = live ? live.bLocal.x * 1e3 : 0;
      const byMt = live ? live.bLocal.y * 1e3 : 0;
      const bMagMt = live ? live.bMag * 1e3 : 0;
      const angDeg = live ? live.angDeg : 0;
      const rCm = Math.hypot(S.px, S.py);

      return `
        <p>La brújula se encuentra en $(x, y) = (${S.px}\\text{ cm},\\, ${S.py}\\text{ cm})$, a una distancia $r = ${fmTex(rCm)}\\text{ cm}$ del centro del imán de barra orientado sobre el eje $Y$.</p>
        <p>En ese punto, el campo dipolar aproximado tiene componentes cartesianas y magnitud:</p>
        $$\\vec{B}(x,y) = (${fmTex(bxMt)}\\,\\hat{i} + ${fmTex(byMt)}\\,\\hat{j})\\text{ mT}, \\qquad |\\vec{B}| = ${fmTex(bMagMt)}\\text{ mT}$$
        <p>El par magnético sobre la aguja la orienta en la dirección tangente a la línea de campo local:</p>
        $$\\alpha = \\operatorname{atan2}(B_y, B_x) = ${angDeg}^\\circ$$
        <div class="analysis-note">En el exterior del imán las líneas emergen del polo Norte ($+Y$) y convergen hacia el polo Sur ($-Y$); al acercar la brújula a cualquiera de los polos, la magnitud crece rápidamente y la dirección se alinea con el eje del imán.</div>
      `;
    }

    const qSign = S.signo === 'pos' ? 1 : -1;
    const absQ = S.q * 1e-6;
    const v = S.v;
    const B = S.B * 1e-3;
    const thRad = (S.th * Math.PI) / 180;
    const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.sin(thRad);
    const vxb = v * B * sTh;
    const FB = absQ * vxb;

    return `
      <p>Con $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{j}$ y una velocidad $v = ${v}\\text{ m/s}$ inclinada $\\theta = ${S.th}^\\circ$ en el plano $XY$, el módulo del producto cruz corresponde al área del paralelogramo generado por ambos vectores:</p>
      $$|\\vec{v}\\times\\vec{B}| = v\\,B\\,\\sin\\theta = (${v})\\,(${fmTex(B)})\\,(${sTh.toFixed(4)}) = ${fmTex(vxb)}\\text{ V/m}$$
      <p>Multiplicando por la carga $q = ${qSign > 0 ? '+' : '-'}${S.q}\\text{ }\\mu\\text{C}$ se obtiene la fuerza magnética perpendicular al plano $XY$:</p>
      $$|\\vec{F}_B| = |q|\\,|\\vec{v}\\times\\vec{B}| = (${fmTex(absQ)}\\text{ C})\\,(${fmTex(vxb)}\\text{ V/m}) = ${fmTex(FB * 1e6)}\\text{ }\\mu\\text{N}$$
      <table class="calc-table">
        <thead><tr><th>Magnitud</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Factor geométrico $\\sin(${S.th}^\\circ)$</td><td>${sTh.toFixed(4)}</td></tr>
          <tr><td>Dirección de $\\vec{v}\\times\\vec{B}$</td><td>${sTh < 1e-3 ? 'Indefinida (nulo)' : '+Z'}</td></tr>
          <tr><td>Sentido de $\\vec{F}_B$</td><td>${sTh < 1e-3 ? 'F = 0' : qSign > 0 ? '+Z (q > 0)' : '−Z (q < 0)'}</td></tr>
        </tbody>
      </table>
    `;
  }

  /* Tema 2: contraste directo entre Biot-Savart discreto y expresión analítica según geometría */
  function buildTema2(S, mod) {
    const xm = S.px * 1e-2;
    const ym = S.py * 1e-2;
    const rm = Math.hypot(xm, ym);
    const Rm = S.R * 1e-2;
    const Lm = S.L * 1e-2;
    const qvEq = S.I * 0.01;
    const live = mod.getLive ? mod.getLive() : { bMag: 0, bAna: null, errRel: null };

    let derivation = '';
    let note = '';

    if (S.geo === 'hilo') {
      const dm = Math.abs(xm);
      derivation =
        dm > 0.003
          ? `<p>A una distancia perpendicular $d = |x| = ${fmTex(dm)}\\text{ m}$ del conductor largo sobre el eje $Y$:</p>
             $$B = \\frac{\\mu_0\\,I}{2\\pi\\,d} = \\frac{(2\\times 10^{-7})\\,(${S.I})}{${fmTex(dm)}} = ${fmTex(((MU0 * S.I) / (2 * Math.PI * dm)) * 1e6)}\\text{ }\\mu\\text{T}$$`
          : `<p>La sonda coincide con el eje del conductor ($d = 0$), donde la aproximación de hilo filiforme diverge.</p>`;
      note = 'El simulador discretiza un conductor finito de 240 cm; el pequeño residuo respecto a la fórmula de hilo infinito refleja los extremos del tramo.';
    } else if (S.geo === 'espira') {
      const r2y2 = Rm * Rm + ym * ym;
      derivation =
        Math.abs(S.px) < 0.05
          ? `<p>Sobre el eje de simetría ($x = 0$) a altura $y = ${fmTex(ym)}\\text{ m}$ de la espira de radio $R = ${fmTex(Rm)}\\text{ m}$:</p>
             $$B_y(y) = \\frac{\\mu_0\\,I\\,R^2}{2\\,(R^2 + y^2)^{3/2}} = \\frac{(4\\pi\\times 10^{-7})\\,(${S.I})\\,(${fmTex(Rm * Rm)})}{2\\,(${fmTex(r2y2)})^{3/2}} = ${fmTex((live.bAna || 0) * 1e6)}\\text{ }\\mu\\text{T}$$`
          : `<p>Fuera del eje ($x = ${S.px}\\text{ cm} \\neq 0$) la integral de Biot-Savart involucra integrales elípticas; sitúa $x = 0\\text{ cm}$ para contrastar con la expresión axial cerrada.</p>`;
      note = 'En el centro de la espira ($y = 0$), el campo alcanza su máximo $B_0 = \\mu_0 I / (2R)$.';
    } else if (S.geo === 'helmholtz') {
      const lp = (yy) => (MU0 * S.I * Rm * Rm) / (2 * Math.pow(Rm * Rm + yy * yy, 1.5));
      const b1 = lp(ym - Rm / 2);
      const b2 = lp(ym + Rm / 2);
      derivation =
        Math.abs(S.px) < 0.05
          ? `<p>Por superposición de las dos espiras situadas en $y = \\pm R/2$ ($R = ${S.R}\\text{ cm}$):</p>
             $$B_y = B_1 + B_2 = ${fmTex(b1 * 1e6)} + ${fmTex(b2 * 1e6)} = ${fmTex((b1 + b2) * 1e6)}\\text{ }\\mu\\text{T}$$`
          : `<p>Desplaza la sonda a $x = 0\\text{ cm}$ para evaluar la superposición analítica sobre el eje de las bobinas.</p>`;
      note = 'Separar las bobinas una distancia igual a su radio anula la primera y segunda derivada de $B_y(y)$ en el origen, generando una región central casi uniforme.';
    } else if (S.geo === 'solenoide') {
      const nDens = S.N / Lm;
      const bInf = MU0 * nDens * S.I;
      derivation = `
        <p>Con $N = ${S.N}$ espiras en $L = ${S.L}\\text{ cm}$, la densidad lineal es $n = N/L = ${fmTex(nDens)}\\text{ m}^{-1}$:</p>
        $$B_{\\text{ideal}} = \\mu_0\\,n\\,I = (4\\pi\\times 10^{-7})\\,(${fmTex(nDens)})\\,(${S.I}) = ${fmTex(bInf * 1e6)}\\text{ }\\mu\\text{T}$$
      `;
      note = 'La fórmula $\\mu_0 n I$ supone un solenoide largo ($L \\gg R$). Cuando $L$ es comparable a $R$ o la sonda se acerca a los extremos, el cálculo discreto muestra la caída real del campo.';
    } else if (S.geo === 'carga_mov') {
      const sinTh = rm > 1e-4 ? Math.abs(xm) / rm : 0;
      derivation = `
        <p>Una carga puntual con momento de corriente equivalente $q\\vec{v} = ${fmTex(qvEq)}\\text{ C}\\cdot\\text{m/s}\\,\\hat{j}$ produce en $(${S.px}, ${S.py}, 0)\\text{ cm}$:</p>
        $$|\\vec{B}_q| = \\frac{\\mu_0}{4\\pi}\\,\\frac{q\\,v\\,\\sin\\theta}{r^2} = (10^{-7})\\,\\frac{(${fmTex(qvEq)})\\,(${sinTh.toFixed(4)})}{(${fmTex(rm || 1)})^2} = ${live.bAna != null ? fmTex(live.bAna * 1e6) + '\\text{ }\\mu\\text{T}' : '\\text{singularidad en } r = 0'}$$
      `;
      note = 'El campo se anula sobre la línea de movimiento ($x = 0$, $\\sin\\theta = 0$) y es máximo en el plano perpendicular ($y = 0$).';
    } else {
      const sinTh = rm > 1e-4 ? Math.abs(xm) / rm : 0;
      derivation = `
        <p>Para un elemento aislado $I\\,\\Delta\\vec{l}$ ($\\Delta l = 0.01\\text{ m}$) en el origen, evaluado a distancia $r = ${fmTex(rm)}\\text{ m}$:</p>
        $$|\\Delta\\vec{B}| = \\frac{\\mu_0}{4\\pi}\\,\\frac{I\\,\\Delta l\\,\\sin\\theta}{r^2} = (10^{-7})\\,\\frac{(${S.I})\\,(0.01)\\,(${sinTh.toFixed(4)})}{(${fmTex(rm || 1)})^2} = ${live.bAna != null ? fmTex(live.bAna * 1e6) + '\\text{ }\\mu\\text{T}' : '\\text{singularidad en } r = 0'}$$
      `;
      note = 'Un elemento diferencial aislado no existe físicamente por conservación de la carga, pero constituye la base de superposición para cualquier circuito cerrado.';
    }

    return `
      ${derivation}
      <table class="calc-table">
        <thead><tr><th>Comparación en sonda</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Integración numérica $|\\vec{B}|$</td><td>${fmTex(live.bMag * 1e6)} μT</td></tr>
          <tr><td>Solución analítica</td><td>${live.bAna != null ? fmTex(live.bAna * 1e6) + ' μT' : 'Fuera de región válida'}</td></tr>
          <tr><td>Diferencia relativa</td><td>${live.errRel != null ? fmTex(live.errRel) + ' %' : '—'}</td></tr>
        </tbody>
      </table>
      <div class="analysis-note">${note}</div>
    `;
  }

  /* Tema 3: análisis en dos etapas (campo B1 -> fuerza sobre segmento Δl) */
  function buildTema3(S) {
    const dm = S.d * 1e-2;
    const dlm = S.dl * 1e-2;
    const B1 = (MU0 * S.I1) / (2 * Math.PI * dm);
    const FperL = (MU0 * S.I1 * S.I2) / (2 * Math.PI * dm);
    const dF = FperL * dlm;
    const mismo = S.dir === 'mismo';

    return `
      <h3>1. Campo del primer conductor sobre el segundo</h3>
      <p>El hilo 1 ($I_1 = ${S.I1}\\text{ A}$ en $+Y$) genera a la distancia $d = ${fmTex(dm)}\\text{ m}$ un campo magnético dirigido en $-Z$:</p>
      $$B_1 = \\frac{\\mu_0\\,I_1}{2\\pi\\,d} = \\frac{(2\\times 10^{-7})\\,(${S.I1})}{${fmTex(dm)}} = ${fmTex(B1 * 1e6)}\\text{ }\\mu\\text{T}$$

      <h3>2. Fuerza de Laplace sobre el segmento $\\Delta l = ${S.dl}\\text{ cm}$</h3>
      <p>Al ser $d\\vec{l}_2 \\perp \\vec{B}_1$, el producto vectorial $I_2\\,d\\vec{l}_2\\times\\vec{B}_1$ produce una fuerza horizontal por unidad de longitud:</p>
      $$\\frac{F}{L} = I_2\\,B_1 = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d} = ${fmTex(FperL * 1e6)}\\text{ }\\mu\\text{N/m}$$
      $$\\Delta F = \\left(\\frac{F}{L}\\right)\\Delta l = (${fmTex(FperL)}\\text{ N/m})\\,(${fmTex(dlm)}\\text{ m}) = ${fmTex(dF * 1e6)}\\text{ }\\mu\\text{N}$$

      <div class="analysis-note">${
        mismo
          ? 'Como ambas corrientes circulan en $+Y$, $\\hat{j}\\times(-\\hat{k}) = -\\hat{i}$ sobre el conductor 2 y $+\\hat{i}$ sobre el conductor 1: las fuerzas se dirigen una hacia la otra (atracción).'
          : 'Con $I_2$ invertida ($-Y$), $(-\\hat{j})\\times(-\\hat{k}) = +\\hat{i}$ sobre el conductor 2 y $-\\hat{i}$ sobre el conductor 1: las fuerzas separan ambos conductores (repulsión).'
      }</div>
    `;
  }

  /* Tema 4: estado instantáneo del rotor magnético y criterio de equilibrio */
  function buildTema4(S, mod) {
    const live = mod.getLive ? mod.getLive() : { curTh: (S.th0 * Math.PI) / 180, deg: S.th0 };
    const thDeg = Number(live.deg.toFixed(1));
    const thRad = live.curTh;

    const Lm = S.L * 1e-2;
    const Rm = Lm / 2;
    const A = S.shape === 'rect' ? Lm * Lm : Math.PI * Rm * Rm;
    const B = S.B * 1e-3;
    const mu = S.N * S.I * A;
    const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.abs(Math.sin(thRad));
    const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);
    const tau = mu * B * sTh;
    const U = -mu * B * cTh;

    const eqState =
      Math.abs(thDeg) < 3
        ? 'Cerca del equilibrio estable ($\\theta = 0^\\circ$, mínimo de $U$).'
        : Math.abs(Math.abs(thDeg) - 180) < 5
          ? 'Cerca del equilibrio inestable ($\\theta = \\pm 180^\\circ$, máximo de $U$).'
          : 'El torque restaurador tiende a reducir $|\\theta|$ hacia $0^\\circ$.';

    return `
      <p>La espira (${S.shape === 'rect' ? `cuadrada de lado $L = ${S.L}\\text{ cm}$` : `circular de diámetro $L = ${S.L}\\text{ cm}$`}, $N = ${S.N}$) tiene área $A = ${fmTex(A * 1e4)}\\text{ cm}^2$ y momento dipolar:</p>
      $$|\\vec{\\mu}| = N\\,I\\,A = (${S.N})\\,(${S.I})\\,(${fmTex(A)}) = ${fmTex(mu)}\\text{ A}\\cdot\\text{m}^2$$
      <p>En la orientación actual $\\theta = ${thDeg}^\\circ$ respecto a $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$:</p>
      $$|\\vec{\\tau}| = \\mu\\,B\\,|\\sin\\theta| = (${fmTex(mu)})\\,(${fmTex(B)})\\,|\\sin(${thDeg}^\\circ)| = ${fmTex(tau)}\\text{ N}\\cdot\\text{m}$$
      $$U = -\\vec{\\mu}\\cdot\\vec{B} = -\\mu\\,B\\,\\cos(${thDeg}^\\circ) = ${fmTex(U)}\\text{ J}$$
      <div class="analysis-note">${eqState} Aunque cada brazo vertical soporta una fuerza lateral de $${fmTex(S.N * S.I * Lm * B)}\\text{ N}$, ambas se anulan en traslación ($\\sum\\vec{F} = \\vec{0}$) y actúan únicamente como par de giro.</div>
    `;
  }

  /* Tema 5: evaluación adaptada al régimen dinámico de Lorentz */
  function buildTema5(S) {
    const [q, m] = P[S.part];
    const absQ = Math.abs(q);
    const v0 = S.v * 1e6;
    const thRad = (S.th * Math.PI) / 180;
    const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.sin(thRad);
    const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);
    const vp = v0 * sTh;
    const vl = v0 * cTh;
    const B = S.B * 1e-3;
    const E = S.E * 1e3;
    const r = (m * vp) / (absQ * B);
    const T = (2 * Math.PI * m) / (absQ * B);
    const pitch = vl * T;
    const vd = E / B;
    const EkeV = (0.5 * m * v0 * v0) / E_;

    const regimeNotes = {
      ciclotron: 'Con $E = 0$ y $\\theta = 90^\\circ$, la fuerza magnética es estrictamente centrípeta y la órbita cierra en un plano perpendicular a $\\vec{B}$.',
      helice: 'La velocidad se separa en una rotación circular gobernada por $v_\\perp$ y una traslación uniforme $v_\\parallel$ a lo largo de $+Y$.',
      selector: 'Ajustando $v_0 = E/B$, la fuerza eléctrica $q\\vec{E}$ cancela exactamente a $q(\\vec{v}\\times\\vec{B})$ y la partícula atraviesa sin desviarse.',
      espectrometro: 'Para igual rapidez y campo, el radio crece linealmente con $m/|q|$: la partícula $\\alpha$ describe el doble de radio que el protón.',
      deriva: 'Al diferir $v_0$ de $E/B$, el campo eléctrico varía la rapidez en cada tramo cambiando el radio instantáneo y originando una trayectoria cicloidal.',
      libre: 'Movimiento general bajo campos $\\vec{E}$ y $\\vec{B}$ uniformes integrado mediante el algoritmo simpléctico de Boris.'
    };

    return `
      <p>${regimeNotes[S.preset] || regimeNotes.libre}</p>
      <table class="calc-table">
        <thead><tr><th>Parámetro orbital</th><th>Valor</th></tr></thead>
        <tbody>
          <tr><td>Velocidad perpendicular $v_\\perp$</td><td>${fmTex(vp)} m/s</td></tr>
          <tr><td>Velocidad paralela $v_\\parallel$</td><td>${fmTex(vl)} m/s</td></tr>
          <tr><td>Radio de Larmor $r$</td><td>${fmTex(r)} m</td></tr>
          <tr><td>Periodo ciclotrónico $T$</td><td>${fmTex(T)} s</td></tr>
          <tr><td>Paso de hélice $p = v_\\parallel T$</td><td>${fmTex(pitch)} m</td></tr>
          <tr><td>Energía cinética inicial $E_k$</td><td>${fmTex(EkeV)} eV</td></tr>
        </tbody>
      </table>
      $$r = \\frac{m\\,v_\\perp}{|q|\\,B} = ${fmTex(r)}\\text{ m}, \\qquad T = \\frac{2\\pi\\,m}{|q|\\,B} = ${fmTex(T)}\\text{ s}$$
      ${
        E > 0
          ? `<p>Con campo eléctrico $E = ${fmTex(E)}\\text{ V/m}$, la velocidad de deriva es $v_d = E/B = ${fmTex(vd)}\\text{ m/s}$ (${Math.abs(v0 - vd) / (vd || 1) < 0.03 ? 'equilibrio de filtro de Wien' : 'régimen de deriva cicloidal'}).</p>`
          : `<div class="analysis-note">Como $\\vec{F}_B \\perp \\vec{v}$, el campo magnético no realiza trabajo y el integrador de Boris conserva la energía cinética sin deriva numérica secular.</div>`
      }
    `;
  }

  /* Tema 6: proyección geométrica del área y criterio de signo */
  function buildTema6(S, mod) {
    const live = mod.getLive ? mod.getLive() : { curTh: (S.th * Math.PI) / 180, deg: S.th };
    const thDeg = Number(live.deg.toFixed(1));
    const thRad = live.curTh;

    const Lm = S.L * 1e-2;
    const Rm = Lm / 2;
    const A = S.shape === 'disco' ? Math.PI * Rm * Rm : Lm * Lm;
    const B = S.B * 1e-3;
    const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);
    const Aeff = A * cTh;
    const phi = B * Aeff;

    return `
      <p>Al inclinar la normal $\\hat{n}$ un ángulo $\\theta = ${thDeg}^\\circ$ respecto a $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$, la sección eficaz que intercepta el campo se proyecta sobre el plano perpendicular ($x = -10\\text{ cm}$) con área:</p>
      $$A_\\perp = A\\,\\cos\\theta = (${fmTex(A * 1e4)}\\text{ cm}^2)\\,(${cTh.toFixed(4)}) = ${fmTex(Aeff * 1e4)}\\text{ cm}^2$$
      <p>El flujo magnético resultante es proporcional a dicha proyección:</p>
      $$\\Phi_B = B\\,A_\\perp = (${fmTex(B)}\\text{ T})\\,(${fmTex(Aeff)}\\text{ m}^2) = ${fmTex(phi * 1e6)}\\text{ }\\mu\\text{Wb}$$
      <ul class="analysis-list">
        <li><b>$\\cos\\theta > 0$ ($|\\theta| < 90^\\circ$):</b> las líneas atraviesan en el sentido de $+\\hat{n}$ (flujo positivo).</li>
        <li><b>$\\cos\\theta = 0$ ($\\theta = \\pm 90^\\circ$):</b> la superficie queda paralela al campo y el flujo se anula.</li>
        <li><b>$\\cos\\theta < 0$ ($|\\theta| > 90^\\circ$):</b> las líneas entran por la cara $+\\hat{n}$ (flujo negativo).</li>
      </ul>
    `;
  }

  /* Tema 7: balance de flujo en superficie cerrada y significado de ∇·B = 0 */
  function buildTema7(S, mod) {
    const Rgm = S.Rg * 1e-2;
    const Atot = S.surf === 'esfera' ? 4 * Math.PI * Rgm * Rgm : 6 * Math.pow(2 * Rgm, 2);
    const live = mod.getLive ? mod.getLive() : { phiOut: 0, phiIn: 0, phiNet: 0 };

    return `
      <p>Sobre la superficie cerrada $S$ (${S.surf === 'esfera' ? `esfera de radio $R_g = ${S.Rg}\\text{ cm}$` : `cubo de arista $2R_g = ${2 * S.Rg}\\text{ cm}$`}, área total $${fmTex(Atot * 1e4)}\\text{ cm}^2$) centrada en $(${S.gx}, ${S.gy}, 0)\\text{ cm}$, la integración discreta separa las regiones con $\\vec{B}\\cdot\\hat{n} > 0$ y $\\vec{B}\\cdot\\hat{n} < 0$:</p>
      $$\\Phi_{\\text{sal}} = +${fmTex(live.phiOut * 1e6)}\\text{ }\\mu\\text{Wb}, \\qquad \\Phi_{\\text{ent}} = -${fmTex(Math.abs(live.phiIn) * 1e6)}\\text{ }\\mu\\text{Wb}$$
      $$\\oint_S \\vec{B}\\cdot d\\vec{A} \\approx ${fmTex(live.phiNet * 1e6)}\\text{ }\\mu\\text{Wb} \\quad (\\text{teórico: } 0\\text{ Wb})$$
      <div class="analysis-note">Incluso cuando la superficie envuelve un único polo del imán, las líneas de campo regresan por el interior del material de Sur a Norte, manteniendo el balance nulo ($\\nabla\\cdot\\vec{B} = 0$). El pequeño residuo mostrado corresponde exclusivamente al tamaño finito de la malla de integración numérica.</div>
    `;
  }

  let lastSig = '';
  let pendingTimer = null;

  function isAnalysisOpen() {
    return document.body.classList.contains('analysis-open');
  }

  function update(mod, force) {
    const bodyEl = $('explain-body');
    if (!bodyEl || !mod) return;
    if (!force && !isAnalysisOpen()) return;

    const S = mod.state || {};
    const live = mod.getLive ? mod.getLive() : null;
    const liveKey =
      mod.id === 'torque-lazo' || mod.id === 'flujo-magnetico'
        ? live
          ? live.deg.toFixed(1)
          : ''
        : mod.id === 'ley-gauss'
          ? live
            ? `${live.phiOut.toPrecision(4)}:${live.phiIn.toPrecision(4)}`
            : ''
          : mod.id === 'fuentes-campo'
            ? live
              ? live.bMag.toPrecision(4)
              : ''
            : '';

    const sig = `${mod.id}:${JSON.stringify(S)}:${liveKey}`;
    if (!force && sig === lastSig) return;
    lastSig = sig;

    let html = '';
    if (mod.id === 'campo-magnetico') html = buildTema1(S, mod);
    else if (mod.id === 'fuentes-campo') html = buildTema2(S, mod);
    else if (mod.id === 'fuerza-corrientes') html = buildTema3(S);
    else if (mod.id === 'torque-lazo') html = buildTema4(S, mod);
    else if (mod.id === 'movimiento-particula') html = buildTema5(S);
    else if (mod.id === 'flujo-magnetico') html = buildTema6(S, mod);
    else if (mod.id === 'ley-gauss') html = buildTema7(S, mod);

    bodyEl.innerHTML = html;
    if (Sim.ui && Sim.ui.renderMath) {
      Sim.ui.renderMath(bodyEl);
    }
  }

  function scheduleUpdate(mod) {
    if (!isAnalysisOpen()) return;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      update(mod, false);
    }, 75);
  }

  Sim.explainer = { update, scheduleUpdate };
})();
