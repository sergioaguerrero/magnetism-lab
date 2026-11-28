/* ===== Motor pedagógico: explicación visual y desarrollo matemático paso a paso en vivo ===== */
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

  function buildTema1(S, mod) {
    if (S.modo === 'iman') {
      const live = mod.getLive ? mod.getLive() : null;
      const bxMt = live ? live.bLocal.x * 1e3 : 0;
      const byMt = live ? live.bLocal.y * 1e3 : 0;
      const bMagMt = live ? live.bMag * 1e3 : 0;
      const angDeg = live ? live.angDeg : 0;

      return `
        <div class="exp-sec">
          <h3>1. Planteamiento del problema actual</h3>
          <p>Se explora la estructura espacial del <b>campo magnético $\\vec{B}$</b> generado por un <b>imán permanente de barra</b> (Polo Norte en $+Y$, Polo Sur en $-Y$) utilizando una <b>brújula magnética 3D</b> situada en $(x, y, z) = (${S.px}\\text{ cm},\\, ${S.py}\\text{ cm},\\, 0)$.</p>
        </div>

        <div class="exp-sec">
          <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
          <ul>
            <li><b>Polos del imán (Norte rojo y Sur azul):</b> Las líneas verdes de campo magnético emergen del Polo Norte ($+Y$) y curvan por el exterior hasta entrar por el Polo Sur ($-Y$).</li>
            <li><b>Aguja de la brújula en $(x, y)$:</b> La punta norte de la brújula (flecha roja) se alinea tangencialmente al vector campo magnético local $\\vec{B}(x,y)$ (flecha verde).</li>
          </ul>
        </div>

        <div class="exp-sec">
          <h3>3. Desarrollo matemático paso a paso</h3>
          <p><b>Paso 1 · Distancia desde la brújula al centro del dipolo ($r$):</b></p>
          $$r = \\sqrt{x^2 + y^2} = \\sqrt{(${S.px}\\text{ cm})^2 + (${S.py}\\text{ cm})^2} = ${fmTex(Math.hypot(S.px, S.py))}\\text{ cm}$$
          <p><b>Paso 2 · Componentes y magnitud del campo local en la brújula:</b></p>
          $$\\vec{B}(x,y) = (${fmTex(bxMt)}\\,\\hat{i} + ${fmTex(byMt)}\\,\\hat{j})\\text{ mT}, \\qquad |\\vec{B}| = ${fmTex(bMagMt)}\\text{ mT}$$
          <p><b>Paso 3 · Ángulo tangencial de la aguja Norte ($\\alpha$):</b></p>
          $$\\alpha = \\operatorname{atan2}(B_y, B_x) = ${angDeg}^\\circ$$
        </div>
      `;
    }

    const qSign = S.signo === 'pos' ? 1 : -1;
    const qC = qSign * S.q * 1e-6;
    const absQ = Math.abs(qC);
    const v = S.v;
    const B = S.B * 1e-3;
    const thRad = (S.th * Math.PI) / 180;
    const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.sin(thRad);
    const vxb = v * B * sTh;
    const FB = absQ * vxb;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se analiza la definición operacional del <b>campo magnético $\\vec{B}$</b> a través de la fuerza que ejerce sobre una carga puntual de prueba $q = ${qSign > 0 ? '+' : '-'}${S.q}\\text{ }\\mu\\text{C}$ que se mueve con rapidez $v = ${v}\\text{ m/s}$ formando un ángulo $\\theta = ${S.th}^\\circ$ respecto a un campo uniforme $B = ${S.B}\\text{ mT}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Vectores en el plano $XY$:</b> El campo magnético $\\vec{B}$ (flecha verde vertical) y la velocidad $\\vec{v}$ (flecha azul claro) definen un plano; el área del <b>paralelogramo sombreado</b> es geométricamente igual a $|\\vec{v}\\times\\vec{B}| = v\\,B\\,\\sin\\theta$.</li>
          <li><b>Pulgar de la mano derecha ($\\vec{v}\\times\\vec{B}$):</b> Es perpendicular tanto a $\\vec{v}$ como a $\\vec{B}$ (apunta en $+Z$).</li>
          <li><b>Fuerza magnética $\\vec{F}_B$ (flecha roja):</b> ${qSign > 0 ? 'Como la carga es <b>positiva ($q > 0$)</b>, la fuerza apunta en el mismo sentido que $\\vec{v}\\times\\vec{B}$ ($+Z$).' : 'Como la carga es <b>negativa ($q < 0$)</b>, la fuerza apunta en sentido opuesto a $\\vec{v}\\times\\vec{B}$ ($-Z$).'}</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>

        <p><b>Paso 1 · Evaluación del módulo del producto cruz $|\\vec{v}\\times\\vec{B}|$:</b></p>
        $$|\\vec{v}\\times\\vec{B}| = v\\,B\\,\\sin\\theta$$
        $$|\\vec{v}\\times\\vec{B}| = (${v}\\text{ m/s})\\,(${fmTex(B)}\\text{ T})\\,\\sin(${S.th}^\\circ)$$
        $$|\\vec{v}\\times\\vec{B}| = (${fmTex(v * B)})\\,(${sTh.toFixed(4)}) = ${fmTex(vxb)}\\text{ V/m}$$

        <p><b>Paso 2 · Cálculo de la magnitud de la fuerza magnética $|\\vec{F}_B|$:</b></p>
        $$|\\vec{F}_B| = |q|\\,|\\vec{v}\\times\\vec{B}| = |q|\\,v\\,B\\,\\sin\\theta$$
        $$|\\vec{F}_B| = (${fmTex(absQ)}\\text{ C})\\,(${fmTex(vxb)}\\text{ V/m})$$
        $$|\\vec{F}_B| = ${fmTex(FB)}\\text{ N} = ${fmTex(FB * 1e6)}\\text{ }\\mu\\text{N}$$
      </div>
    `;
  }

  function buildTema2(S) {
    const geoNames = {
      hilo: 'un <b>conductor rectilíneo muy largo</b> ubicado sobre el eje vertical $Y$',
      espira: `una <b>espira circular</b> de radio $R = ${S.R}\\text{ cm}$ situada en el plano horizontal $XZ$`,
      helmholtz: `un par de <b>bobinas de Helmholtz</b> de radio $R = ${S.R}\\text{ cm}$ separadas una distancia igual a su radio ($y = \\pm R/2$)`,
      solenoide: `un <b>solenoide helicoidal</b> de radio $R = ${S.R}\\text{ cm}$, longitud $L = ${S.L}\\text{ cm}$ y $N = ${S.N}$ vueltas`,
      elemento_dl: 'un <b>elemento diferencial de corriente $I\\,\\Delta\\vec{l}$</b> ($\\Delta l = 1\\text{ cm}$) en el origen',
      carga_mov: 'una <b>carga puntual $q$ en movimiento</b> con velocidad $\\vec{v}$ a lo largo del eje $+Y$'
    };

    const xm = S.px * 1e-2;
    const ym = S.py * 1e-2;
    const rm = Math.hypot(xm, ym);
    const Rm = S.R * 1e-2;
    const Lm = S.L * 1e-2;
    const kBiot = 1e-7 * S.I;
    const qvEq = S.I * 0.01;

    let paso1Block = `
      <p><b>Paso 1 · Prefactor magnético y suma discreta de Biot-Savart:</b></p>
      $$\\frac{\\mu_0\\,I}{4\\pi} = (10^{-7}\\text{ T}\\cdot\\text{m/A})\\,(${S.I}\\text{ A}) = ${fmTex(kBiot)}\\text{ T}\\cdot\\text{m}$$
      $$\\vec{B}(\\vec{r}) = \\frac{\\mu_0\\,I}{4\\pi}\\sum_{k} \\frac{\\Delta\\vec{l}_k \\times (\\vec{r} - \\vec{r}_k)}{|\\vec{r} - \\vec{r}_k|^3}$$
    `;

    let formulaBlock = '';
    if (S.geo === 'hilo') {
      const dm = Math.abs(xm);
      const Bana = dm > 0.003 ? (MU0 * S.I) / (2 * Math.PI * dm) : null;
      formulaBlock = `
        <p><b>Paso 2 · Evaluación analítica para el hilo recto infinito:</b> La distancia perpendicular desde la sonda hasta el hilo (eje $Y$) es $d = |x| = ${fmTex(dm)}\\text{ m}$:</p>
        $$B = \\frac{\\mu_0\\,I}{2\\pi\\,d}$$
        ${
          Bana
            ? `$$B = \\frac{(4\\pi\\times 10^{-7})\\,(${S.I})}{2\\pi\\,(${fmTex(dm)})} = \\frac{${fmTex(MU0 * S.I)}}{${fmTex(2 * Math.PI * dm)}}$$
               $$B = ${fmTex(Bana)}\\text{ T} = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$`
            : `$$d = 0\\text{ m} \\implies \\text{Punto sobre el conductor (singularidad)}$$`
        }
      `;
    } else if (S.geo === 'espira') {
      const r2y2 = Rm * Rm + ym * ym;
      const denom = 2 * Math.pow(r2y2, 1.5);
      const num = MU0 * S.I * Rm * Rm;
      const Bana = Math.abs(S.px) < 0.05 ? num / denom : null;
      formulaBlock = `
        <p><b>Paso 2 · Evaluación analítica en el eje de la espira ($x = 0$):</b> Con radio $R = ${fmTex(Rm)}\\text{ m}$ y altura axial $y = ${fmTex(ym)}\\text{ m}$:</p>
        $$B_y(y) = \\frac{\\mu_0\\,I\\,R^2}{2\\,(R^2 + y^2)^{3/2}}$$
        ${
          Bana != null
            ? `$$R^2 + y^2 = (${fmTex(Rm)})^2 + (${fmTex(ym)})^2 = ${fmTex(r2y2)}\\text{ m}^2$$
               $$B_y = \\frac{(4\\pi\\times 10^{-7})\\,(${S.I})\\,(${fmTex(Rm * Rm)})}{2\\,(${fmTex(r2y2)})^{3/2}} = \\frac{${fmTex(num)}}{${fmTex(denom)}}$$
               $$B_y = ${fmTex(Bana)}\\text{ T} = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$`
            : `$$x = ${S.px}\\text{ cm} \\neq 0 \\implies \\text{Coloca }x = 0\\text{ cm para evaluar la fórmula en el eje}$$`
        }
      `;
    } else if (S.geo === 'helmholtz') {
      const y1 = ym - Rm / 2;
      const y2 = ym + Rm / 2;
      const lp = (yy) => (MU0 * S.I * Rm * Rm) / (2 * Math.pow(Rm * Rm + yy * yy, 1.5));
      const b1 = lp(y1);
      const b2 = lp(y2);
      const Bana = Math.abs(S.px) < 0.05 ? b1 + b2 : null;
      formulaBlock = `
        <p><b>Paso 2 · Superposición de las dos bobinas de Helmholtz en el eje ($x = 0$):</b> Las bobinas están en $y_1 = -R/2 = -${fmTex(Rm / 2)}\\text{ m}$ y $y_2 = +R/2 = +${fmTex(Rm / 2)}\\text{ m}$:</p>
        $$B_y(y) = B_{\\text{espira\\,1}}(y - R/2) + B_{\\text{espira\\,2}}(y + R/2)$$
        ${
          Bana != null
            ? `$$B_{\\text{espira\\,1}} = ${fmTex(b1 * 1e6)}\\text{ }\\mu\\text{T}, \\qquad B_{\\text{espira\\,2}} = ${fmTex(b2 * 1e6)}\\text{ }\\mu\\text{T}$$
               $$B_y = ${fmTex(b1 * 1e6)} + ${fmTex(b2 * 1e6)} = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$`
            : `$$x = ${S.px}\\text{ cm} \\neq 0 \\implies \\text{Coloca }x = 0\\text{ cm para evaluar en el eje}$$`
        }
      `;
    } else if (S.geo === 'solenoide') {
      const nDens = S.N / Lm;
      const Bana = MU0 * nDens * S.I;
      formulaBlock = `
        <p><b>Paso 2 · Campo en el interior del solenoide:</b> Primero calculamos la densidad lineal de espiras $n = N/L$:</p>
        $$n = \\frac{N}{L} = \\frac{${S.N}}{${fmTex(Lm)}\\text{ m}} = ${fmTex(nDens)}\\text{ vueltas/m}$$
        $$B_{\\text{int}} = \\mu_0\\,n\\,I = (4\\pi\\times 10^{-7})\\,(${fmTex(nDens)})\\,(${S.I})$$
        $$B_{\\text{int}} = ${fmTex(Bana)}\\text{ T} = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$
      `;
    } else if (S.geo === 'carga_mov') {
      const dm = Math.abs(xm);
      const sinTh = rm > 1e-4 ? dm / rm : 0;
      const Bana = rm > 0.005 ? ((MU0 / (4 * Math.PI)) * (qvEq * sinTh)) / (rm * rm) : null;

      paso1Block = `
        <p><b>Paso 1 · Ley de Biot-Savart para una carga puntual en movimiento ($q\\vec{v}$):</b></p>
        $$\\vec{B}_q(\\vec{r}) = \\frac{\\mu_0}{4\\pi}\\,\\frac{q\\,\\vec{v} \\times \\hat{r}}{r^2}, \\qquad q\\,v = ${fmTex(qvEq)}\\text{ C}\\cdot\\text{m/s}\\;(+\\hat{j})$$
      `;
      formulaBlock = `
        <p><b>Paso 2 · Evaluación puntual a distancia $r = \\sqrt{x^2 + y^2}$:</b></p>
        $$r = \\sqrt{(${fmTex(xm)})^2 + (${fmTex(ym)})^2} = ${fmTex(rm)}\\text{ m}, \\qquad \\sin\\theta = \\frac{|x|}{r} = ${sinTh.toFixed(4)}$$
        $$|\\vec{B}_q| = \\frac{\\mu_0}{4\\pi}\\,\\frac{q\\,v\\,\\sin\\theta}{r^2}$$
        ${
          Bana != null
            ? `$$|\\vec{B}_q| = (10^{-7})\\,\\frac{(${fmTex(qvEq)})\\,(${sinTh.toFixed(4)})}{(${fmTex(rm)})^2} = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$`
            : `$$r = 0\\text{ m} \\implies \\text{Singularidad en la posición de la carga}$$`
        }
      `;
    } else {
      const dm = Math.abs(xm);
      const sinTh = rm > 1e-4 ? dm / rm : 0;
      const dlMeters = 0.01;
      const Bana = rm > 0.005 ? ((MU0 / (4 * Math.PI)) * (S.I * dlMeters * sinTh)) / (rm * rm) : null;
      formulaBlock = `
        <p><b>Paso 2 · Evaluación puntual del elemento diferencial a distancia $r = \\sqrt{x^2 + y^2}$:</b></p>
        $$r = \\sqrt{(${fmTex(xm)})^2 + (${fmTex(ym)})^2} = ${fmTex(rm)}\\text{ m}, \\qquad \\sin\\theta = \\frac{|x|}{r} = ${sinTh.toFixed(4)}$$
        $$|\\Delta\\vec{B}| = \\frac{\\mu_0}{4\\pi}\\,\\frac{I\\,\\Delta l\\,\\sin\\theta}{r^2}$$
        ${
          Bana != null
            ? `$$|\\Delta\\vec{B}| = (10^{-7})\\,\\frac{(${S.I})\\,(0.01)\\,(${sinTh.toFixed(4)})}{(${fmTex(rm)})^2} = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$`
            : `$$r = 0\\text{ m} \\implies \\text{Singularidad en el origen}$$`
        }
      `;
    }

    const sourceIntro =
      S.geo === 'carga_mov'
        ? `con momento de corriente equivalente $q\\,v = ${fmTex(qvEq)}\\text{ C}\\cdot\\text{m/s}$`
        : `con corriente $I = ${S.I}\\text{ A}$`;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se estudia el campo magnético $\\vec{B}$ producido por ${geoNames[S.geo]} ${sourceIntro}, evaluando la lectura exacta en el punto de la sonda $(x, y, z) = (${S.px}\\text{ cm},\\, ${S.py}\\text{ cm},\\, 0)$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>${S.geo === 'carga_mov' ? 'Carga puntual y vector velocidad $\\vec{v}$:' : 'Conductor y flecha de corriente:'}</b> ${S.geo === 'carga_mov' ? 'La esfera roja representa la carga positiva $q$ desplazándose a lo largo de $+Y$ (flecha azul).' : 'Representa el camino físico de la corriente $I$, dividido internamente en elementos diferenciales $\\Delta\\vec{l}_k$.'}</li>
          <li><b>Mapa vectorial en el plano $z = 0$:</b> La rejilla de flechas muestra la dirección local de $\\vec{B}$ y su intensidad mediante un código de color térmico (rojo/naranja cerca de la fuente, azul al alejarse).</li>
          <li><b>Líneas de campo verdes:</b> Curvas cerradas tangentes a $\\vec{B}$ en todo punto, siguiendo la regla de la mano derecha.</li>
          <li><b>Sonda de medida (magenta):</b> Compara el cálculo numérico de Biot-Savart frente a la ecuación analítica.</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>
        ${paso1Block}
        ${formulaBlock}
      </div>
    `;
  }

  function buildTema3(S) {
    const dm = S.d * 1e-2;
    const dlm = S.dl * 1e-2;
    const B1 = (MU0 * S.I1) / (2 * Math.PI * dm);
    const B2 = (MU0 * S.I2) / (2 * Math.PI * dm);
    const FperL = (MU0 * S.I1 * S.I2) / (2 * Math.PI * dm);
    const dF = FperL * dlm;
    const mismo = S.dir === 'mismo';

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Dos conductores rectos paralelos separados $d = ${S.d}\\text{ cm}$ transportan corrientes $I_1 = ${S.I1}\\text{ A}$ e $I_2 = ${S.I2}\\text{ A}$ en <b>${mismo ? 'el mismo sentido (paralelas $\\uparrow\\uparrow$)' : 'sentidos opuestos (antiparalelas $\\uparrow\\downarrow$)'}</b>. Se calcula la fuerza magnética mutua sobre un segmento de longitud $\\Delta l = ${S.dl}\\text{ cm}$ ubicado en $y_0 = ${S.y0}\\text{ cm}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Hilos y portadores en movimiento:</b> Las esferas que viajan por el hilo 1 (naranja) y el hilo 2 (azul claro) indican el sentido y la rapidez del flujo de corriente.</li>
          <li><b>Anillos verdes de campo magnético:</b> El campo $\\vec{B}_1$ rodea circularmente al hilo 1 y alcanza al hilo 2 perpendicularmente ($-Z$).</li>
          <li><b>Segmentos magenta ($\\Delta l$) y flechas rojas de fuerza:</b> Sobre el tramo resaltado actúa $d\\vec{F} = I\\,d\\vec{l}\\times\\vec{B}$. ${mismo ? 'Ambas flechas apuntan hacia el centro: <b>los conductores se atraen</b>.' : 'Ambas flechas apuntan hacia afuera: <b>los conductores se repelen</b>.'}</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>

        <p><b>Paso 1 · Campo magnético $B_1$ que el hilo 1 crea sobre el hilo 2 (a distancia $d = ${fmTex(dm)}\\text{ m}$):</b></p>
        $$B_1 = \\frac{\\mu_0\\,I_1}{2\\pi\\,d} = \\frac{(2\\times 10^{-7})\\,(${S.I1})}{${fmTex(dm)}} = ${fmTex(B1 * 1e6)}\\text{ }\\mu\\text{T}$$

        <p><b>Paso 2 · Campo magnético $B_2$ que el hilo 2 crea sobre el hilo 1:</b></p>
        $$B_2 = \\frac{\\mu_0\\,I_2}{2\\pi\\,d} = \\frac{(2\\times 10^{-7})\\,(${S.I2})}{${fmTex(dm)}} = ${fmTex(B2 * 1e6)}\\text{ }\\mu\\text{T}$$

        <p><b>Paso 3 · Fuerza magnética por unidad de longitud ($F/L$):</b></p>
        $$\\frac{F}{L} = I_2\\,B_1 = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d} = (${S.I2}\\text{ A})\\,(${fmTex(B1)}\\text{ T}) = ${fmTex(FperL * 1e6)}\\text{ }\\mu\\text{N/m}$$

        <p><b>Paso 4 · Fuerza total ($\\Delta F$) sobre el segmento $\\Delta l = ${fmTex(dlm)}\\text{ m}$:</b></p>
        $$\\Delta F = \\left(\\frac{F}{L}\\right)\\,\\Delta l = (${fmTex(FperL)}\\text{ N/m})\\,(${fmTex(dlm)}\\text{ m}) = ${fmTex(dF * 1e6)}\\text{ }\\mu\\text{N}$$
      </div>
    `;
  }

  function buildTema4(S, mod) {
    const live = mod.getLive ? mod.getLive() : null;
    const thDeg = live ? Number(live.deg.toFixed(1)) : S.th0;
    const thRad = live ? live.curTh : (S.th0 * Math.PI) / 180;

    const Lm = S.L * 1e-2;
    const Rm = Lm / 2;
    const A = S.shape === 'rect' ? Lm * Lm : Math.PI * Rm * Rm;
    const B = S.B * 1e-3;
    const mu = S.N * S.I * A;
    const sTh = Math.abs(Math.sin(thRad)) < 1e-12 ? 0 : Math.abs(Math.sin(thRad));
    const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);
    const tau = mu * B * sTh;
    const U = -mu * B * cTh;
    const Farm = S.N * S.I * Lm * B;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Una <b>${S.shape === 'rect' ? `espira cuadrada de lado $L = ${S.L}\\text{ cm}$` : `espira circular de diámetro $L = ${S.L}\\text{ cm}$`}</b> con $N = ${S.N}$ vueltas y corriente $I = ${S.I}\\text{ A}$ se encuentra en este instante a $\\theta = ${thDeg}^\\circ$ dentro de un campo magnético uniforme $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Momento magnético $\\vec{\\mu}$ (magenta):</b> Perpendicular al plano de la espira por la regla de la mano derecha.</li>
          <li><b>Par de fuerzas laterales $\\vec{F}_1, \\vec{F}_2$ (rojas):</b> Empujan los brazos verticales en sentidos opuestos ($\\sum\\vec{F} = \\vec{0}$), generando la cupla de rotación.</li>
          <li><b>Vector torque $\\vec{\\tau} = \\vec{\\mu}\\times\\vec{B}$ (azul en eje $Y$):</b> Dirige la rotación hacia el equilibrio estable ($\\theta = 0^\\circ$).</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>

        <p><b>Paso 1 · Área encerrada por la espira ($A$):</b></p>
        ${
          S.shape === 'rect'
            ? `$$A = L^2 = (${fmTex(Lm)}\\text{ m})^2 = ${fmTex(A)}\\text{ m}^2 \\;(${fmTex(A * 1e4)}\\text{ cm}^2)$$`
            : `$$A = \\pi\\left(\\frac{L}{2}\\right)^2 = \\pi\\,(${fmTex(Rm)}\\text{ m})^2 = ${fmTex(A)}\\text{ m}^2 \\;(${fmTex(A * 1e4)}\\text{ cm}^2)$$`
        }

        <p><b>Paso 2 · Momento dipolar magnético ($|\\vec{\\mu}|$):</b></p>
        $$|\\vec{\\mu}| = N\\,I\\,A = (${S.N})\\,(${S.I}\\text{ A})\\,(${fmTex(A)}\\text{ m}^2) = ${fmTex(mu)}\\text{ A}\\cdot\\text{m}^2$$

        <p><b>Paso 3 · Fuerza lateral ($F_{\\text{brazo}}$) y Torque instantáneo ($|\\vec{\\tau}|$ en $\\theta = ${thDeg}^\\circ$):</b></p>
        $$F_{\\text{brazo}} = N\\,I\\,L\\,B = (${S.N})\\,(${S.I})\\,(${fmTex(Lm)})\\,(${fmTex(B)}) = ${fmTex(Farm)}\\text{ N}$$
        $$|\\vec{\\tau}| = \\mu\\,B\\,|\\sin\\theta| = (${fmTex(mu)})\\,(${fmTex(B)})\\,|\\sin(${thDeg}^\\circ)| = ${fmTex(tau)}\\text{ N}\\cdot\\text{m}$$

        <p><b>Paso 4 · Energía potencial magnética ($U$):</b></p>
        $$U = -\\vec{\\mu}\\cdot\\vec{B} = -(${fmTex(mu * B)})\\,(${cTh.toFixed(4)}) = ${fmTex(U)}\\text{ J}$$
      </div>
    `;
  }

  function buildTema5(S) {
    const pNames = {
      e: 'un <b>electrón</b> ($q = -1.602\\times 10^{-19}\\text{ C}$, $m = 9.11\\times 10^{-31}\\text{ kg}$)',
      p: 'un <b>protón</b> ($q = +1.602\\times 10^{-19}\\text{ C}$, $m = 1.67\\times 10^{-27}\\text{ kg}$)',
      a: 'una <b>partícula alfa ($\\alpha$)</b> ($q = +3.204\\times 10^{-19}\\text{ C}$, $m = 6.64\\times 10^{-27}\\text{ kg}$)'
    };
    const presetDesc = {
      ciclotron:
        '<b>Órbita de Ciclotrón:</b> La partícula ingresa perpendicularmente al campo magnético ($\\theta = 90^\\circ$) sin campo eléctrico ($E = 0$). La fuerza magnética actúa como fuerza centrípeta pura.',
      helice:
        '<b>Hélice Magnética:</b> Con ángulo oblicuo ($\\theta = ' +
        S.th +
        '^\\circ$), $v_\\perp$ produce el giro circular mientras $v_\\parallel$ avanza a velocidad constante a lo largo de $+Y$.',
      selector:
        '<b>Selector de Velocidades (Filtro de Wien):</b> Con $\\vec{E} \\perp \\vec{B}$ ajustados a $v_0 = E/B$, las fuerzas eléctrica y magnética se anulan ($\\vec{F}_{\\text{neta}} = \\vec{0}$) y la trayectoria es rectilínea.',
      espectrometro:
        '<b>Espectrómetro de Masas:</b> Como el radio es proporcional a $m/|q|$, la partícula $\\alpha$ (órbita roja) describe aproximadamente el doble de radio que el protón (órbita azul).',
      deriva:
        '<b>Deriva $\\vec{E}\\times\\vec{B}$:</b> Con $v_0 \\neq E/B$, la partícula acelera y frena en cada ciclo describiendo una cicloide con deriva lateral.',
      libre:
        '<b>Configuración Personalizada:</b> Movimiento 3D de una carga gobernado por la fuerza de Lorentz integrada con el método simpléctico de Boris.'
    };

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
    const FB = absQ * vp * B;
    const FE = absQ * E;
    const r = (m * vp) / (absQ * B);
    const T = (2 * Math.PI * m) / (absQ * B);
    const f = 1 / T;
    const pitch = vl * T;
    const vd = E / B;
    const EkJ = 0.5 * m * v0 * v0;
    const EkeV = EkJ / E_;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>${presetDesc[S.preset] || presetDesc.libre}</p>
        <p>Se simula ${pNames[S.part]} con rapidez inicial $v_0 = ${fmTex(v0)}\\text{ m/s}$ y ángulo $\\theta = ${S.th}^\\circ$ en un campo $\\vec{B} = ${fmTex(B)}\\text{ T}\\,\\hat{j}$${E > 0 ? ` y campo eléctrico transversal $E = ${fmTex(E)}\\text{ V/m}$` : ''}.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Esfera y estela:</b> La esfera (${q > 0 ? 'roja, $q > 0$' : 'azul, $q < 0$'}) traza la trayectoria integrada con el método de Boris.</li>
          <li><b>Triedro de la Mano Derecha:</b> Velocidad $\\vec{v}$ (azul), campo $\\vec{B}$ (verde) y producto cruz $\\vec{v}\\times\\vec{B}$ (amarillo/ocre).</li>
          <li><b>Fuerza $\\vec{F}$ (roja):</b> ${q > 0 ? 'Al ser positiva, apunta en el mismo sentido que $\\vec{v}\\times\\vec{B}$.' : 'Al ser negativa, apunta en sentido opuesto a $\\vec{v}\\times\\vec{B}$, invirtiendo el sentido de giro.'}</li>
          ${E > 0 ? `<li><b>Fuerza eléctrica $\\vec{F}_E$ (magenta):</b> Actúa sobre el eje $Z$ compitiendo contra la fuerza magnética.</li>` : ''}
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>

        <p><b>Paso 1 · Descomposición de la velocidad inicial ($\\vec{v}_0$):</b></p>
        $$v_\\perp = v_0\\,\\sin(${S.th}^\\circ) = ${fmTex(vp)}\\text{ m/s}, \\qquad v_\\parallel = v_0\\,\\cos(${S.th}^\\circ) = ${fmTex(vl)}\\text{ m/s}$$

        <p><b>Paso 2 · Fuerza magnética de Lorentz ($|\\vec{F}_B|$):</b></p>
        $$|\\vec{F}_B| = |q|\\,v_\\perp\\,B = (${fmTex(absQ)})\\,(${fmTex(vp)})\\,(${fmTex(B)}) = ${fmTex(FB)}\\text{ N}$$

        <p><b>Paso 3 · Radio de curvatura ($r$):</b></p>
        $$r = \\frac{m\\,v_\\perp}{|q|\\,B} = \\frac{(${fmTex(m)})\\,(${fmTex(vp)})}{(${fmTex(absQ)})\\,(${fmTex(B)})} = ${fmTex(r)}\\text{ m}$$

        <p><b>Paso 4 · Periodo ($T$), frecuencia ($f$) y paso helicoidal ($p$):</b></p>
        $$T = \\frac{2\\pi\\,m}{|q|\\,B} = ${fmTex(T)}\\text{ s}, \\qquad f = \\frac{1}{T} = ${fmTex(f)}\\text{ Hz}, \\qquad p = v_\\parallel\\,T = ${fmTex(pitch)}\\text{ m}$$

        ${
          E > 0
            ? `<p><b>Paso 5 · Fuerza eléctrica ($|\\vec{F}_E|$) y velocidad de deriva ($v_d$):</b></p>
               $$|\\vec{F}_E| = |q|\\,E = ${fmTex(FE)}\\text{ N}, \\qquad v_d = \\frac{E}{B} = ${fmTex(vd)}\\text{ m/s}$$
               <p>${Math.abs(v0 - vd) / (vd || 1) < 0.03 ? 'Como $v_0 \\approx v_d$, se cumple $|\\vec{F}_E| = |\\vec{F}_B|$ y la partícula sigue en línea recta.' : `Como $v_0 \\neq v_d$, la trayectoria curva mientras deriva a $${fmTex(vd)}\\text{ m/s}$.`}</p>`
            : `<p><b>Paso 5 · Energía cinética ($E_k$):</b> Como $\\vec{F}_B \\perp \\vec{v}$, el campo magnético no realiza trabajo:</p>
               $$E_k = \\frac{1}{2}\\,m\\,v_0^2 = ${fmTex(EkJ)}\\text{ J} = ${fmTex(EkeV)}\\text{ eV}$$`
        }
      </div>
    `;
  }

  function buildTema6(S, mod) {
    const live = mod.getLive ? mod.getLive() : null;
    const thDeg = live ? Number(live.deg.toFixed(1)) : S.th;
    const thRad = live ? live.curTh : (S.th * Math.PI) / 180;

    const Lm = S.L * 1e-2;
    const Rm = Lm / 2;
    const A = S.shape === 'disco' ? Math.PI * Rm * Rm : Lm * Lm;
    const B = S.B * 1e-3;
    const cTh = Math.abs(Math.cos(thRad)) < 1e-12 ? 0 : Math.cos(thRad);
    const Aeff = A * cTh;
    const phi = B * Aeff;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se calcula el flujo magnético $\\Phi_B$ a través de una <b>${S.shape === 'disco' ? `superficie circular de diámetro $L = ${S.L}\\text{ cm}$` : `superficie cuadrada de lado $L = ${S.L}\\text{ cm}$`}</b> cuyo vector normal $\\hat{n}$ forma un ángulo $\\theta = ${thDeg}^\\circ$ con un campo uniforme $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Orientación y arco ($\\theta$):</b> Muestra el ángulo entre $\\vec{B}$ (verde) y el vector normal $\\hat{n}$ (magenta).</li>
          <li><b>Líneas e impactos:</b> Las líneas que cruzan la superficie se iluminan y marcan los puntos exactos de intersección.</li>
          <li><b>Sombra proyectada ($x = -10$):</b> Representa geométricamente el área efectiva $A_\\perp = A\\cos\\theta$.</li>
          <li><b>Color de la superficie:</b> Verde si $\\Phi_B > 0$, gris si $\\theta = \\pm 90^\\circ$ y rojo si $\\Phi_B < 0$.</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>

        <p><b>Paso 1 · Área geométrica total ($A$):</b></p>
        ${
          S.shape === 'disco'
            ? `$$A = \\pi\\left(\\frac{L}{2}\\right)^2 = \\pi\\,(${fmTex(Rm)}\\text{ m})^2 = ${fmTex(A)}\\text{ m}^2 \\;(${fmTex(A * 1e4)}\\text{ cm}^2)$$`
            : `$$A = L^2 = (${fmTex(Lm)}\\text{ m})^2 = ${fmTex(A)}\\text{ m}^2 \\;(${fmTex(A * 1e4)}\\text{ cm}^2)$$`
        }

        <p><b>Paso 2 · Área proyectada perpendicular al campo ($A_\\perp$):</b></p>
        $$A_\\perp = A\\,\\cos(${thDeg}^\\circ) = (${fmTex(A)})\\,(${cTh.toFixed(4)}) = ${fmTex(Aeff)}\\text{ m}^2$$

        <p><b>Paso 3 · Flujo magnético total ($\\Phi_B$):</b></p>
        $$\\Phi_B = \\int_S \\vec{B}\\cdot d\\vec{A} = B\\,A\\,\\cos\\theta = (${fmTex(B)}\\text{ T})\\,(${fmTex(Aeff)}\\text{ m}^2) = ${fmTex(phi * 1e6)}\\text{ }\\mu\\text{Wb}$$
      </div>
    `;
  }

  function buildTema7(S, mod) {
    const Rgm = S.Rg * 1e-2;
    const Atot = S.surf === 'esfera' ? 4 * Math.PI * Rgm * Rgm : 6 * Math.pow(2 * Rgm, 2);
    const live = mod.getLive ? mod.getLive() : { phiOut: 0, phiIn: 0, phiNet: 0 };

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se verifica la <b>Ley de Gauss del magnetismo</b> utilizando una <b>${S.surf === 'esfera' ? `esfera cerrada de radio $R_g = ${S.Rg}\\text{ cm}$` : `caja cerrada de lado $2R_g = ${2 * S.Rg}\\text{ cm}$`}</b> ubicada en $(x_g, y_g, 0) = (${S.gx}\\text{ cm},\\, ${S.gy}\\text{ cm},\\, 0)$ alrededor de <b>${S.source === 'dipolo' ? 'un imán de barra (dipolo N–S)' : 'una espira circular de corriente'}</b>.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Lazos cerrados de campo magnético:</b> Las líneas de $\\vec{B}$ salen por el Polo Norte (rojo), regresan al Polo Sur (azul) y se cierran por el interior de Sur a Norte.</li>
          <li><b>Superficie gaussiana translúcida:</b> Desplázala con $(x_g, y_g)$ para encerrar un polo, ambos o el exterior.</li>
          <li><b>Flechas verdes ($\\vec{B}\\cdot\\hat{n} > 0$) vs. flechas rojas ($\\vec{B}\\cdot\\hat{n} < 0$):</b> Muestran respectivamente las zonas de flujo saliente y entrante.</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático paso a paso</h3>

        <p><b>Paso 1 · Área total de la superficie gaussiana cerrada ($A_{\\text{total}}$):</b></p>
        ${
          S.surf === 'esfera'
            ? `$$A_{\\text{total}} = 4\\pi\\,R_g^2 = 4\\pi\\,(${fmTex(Rgm)}\\text{ m})^2 = ${fmTex(Atot)}\\text{ m}^2$$`
            : `$$A_{\\text{total}} = 6\\,(2R_g)^2 = 6\\,(${fmTex(2 * Rgm)}\\text{ m})^2 = ${fmTex(Atot)}\\text{ m}^2$$`
        }

        <p><b>Paso 2 · Balance numérico en la malla de integración sobre $S$:</b></p>
        $$\\Phi_{\\text{sal}} = +${fmTex(live.phiOut * 1e6)}\\text{ }\\mu\\text{Wb}, \\qquad \\Phi_{\\text{ent}} = -${fmTex(Math.abs(live.phiIn) * 1e6)}\\text{ }\\mu\\text{Wb}$$
        $$\\Phi_{\\text{sal}} + \\Phi_{\\text{ent}} = ${fmTex(live.phiNet * 1e6)}\\text{ }\\mu\\text{Wb} \\approx 0\\text{ Wb}$$

        <p><b>Paso 3 · Forma integral y diferencial (Teorema de la Divergencia):</b></p>
        $$\\oint_S \\vec{B}\\cdot d\\vec{A} = \\iiint_V (\\nabla\\cdot\\vec{B})\\,dV = 0 \\implies \\nabla\\cdot\\vec{B} = 0$$
      </div>
    `;
  }

  let lastSig = '';
  let pendingTimer = null;

  function isExplainOpen() {
    return document.body.classList.contains('explain-open');
  }

  function update(mod, force) {
    const bodyEl = $('explain-body');
    const titleEl = $('explain-mod-title');
    if (!bodyEl || !mod) return;

    /* No reconstruir DOM ni ejecutar KaTeX si el panel de explicación está cerrado */
    if (!force && !isExplainOpen()) return;

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
          : '';

    const sig = `${mod.id}:${JSON.stringify(S)}:${liveKey}`;
    if (!force && sig === lastSig) return;
    lastSig = sig;

    if (titleEl) {
      titleEl.textContent = mod.title;
    }

    let html = '';
    if (mod.id === 'campo-magnetico') html = buildTema1(S, mod);
    else if (mod.id === 'fuentes-campo') html = buildTema2(S);
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

  /* Debounce ligero para arrastrar sliders con suavidad cuando el panel está abierto */
  function scheduleUpdate(mod) {
    if (!isExplainOpen()) return;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      update(mod, false);
    }, 75);
  }

  Sim.explainer = { update, scheduleUpdate };
})();
