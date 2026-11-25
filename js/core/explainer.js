/* ===== Motor pedagógico: explicación visual y matemática en vivo según tema, variante y parámetros ===== */
(function () {
  /* Formateador numérico en notación científica LaTeX limpia (ej. 1.602 × 10⁻¹⁹ en vez de 1.602e-19) */
  function fmTex(x) {
    if (x === 0 || !isFinite(x)) return '0';
    const a = Math.abs(x);
    if (a >= 0.01 && a < 1e4) {
      return String(+x.toPrecision(4));
    }
    const exp = Math.floor(Math.log10(a));
    const mant = +(x / Math.pow(10, exp)).toPrecision(3);
    return `${mant}\\times 10^{${exp}}`;
  }

  function buildModA(S) {
    const pNames = {
      e: 'un <b>electrón</b> ($q = -1.602\\times 10^{-19}\\text{ C}$, $m = 9.11\\times 10^{-31}\\text{ kg}$)',
      p: 'un <b>protón</b> ($q = +1.602\\times 10^{-19}\\text{ C}$, $m = 1.67\\times 10^{-27}\\text{ kg}$)',
      a: 'una <b>partícula alfa ($\\alpha$)</b> ($q = +3.204\\times 10^{-19}\\text{ C}$, $m = 6.64\\times 10^{-27}\\text{ kg}$)'
    };
    const presetDesc = {
      ciclotron:
        '<b>Órbita de Ciclotrón:</b> La partícula ingresa perpendicularmente al campo magnético ($\\theta = 90^\\circ$) sin campo eléctrico ($E = 0$). La fuerza magnética actúa como fuerza centrípeta pura, curvando la trayectoria en una circunferencia perfecta.',
      helice:
        '<b>Hélice Magnética:</b> La velocidad inicial forma un ángulo oblicuo ($\\theta = ' +
        S.th +
        '^\\circ$) respecto a $\\vec{B}$. La componente perpendicular $v_\\perp$ produce el giro circular mientras la componente paralela $v_\\parallel$ avanza a velocidad constante a lo largo del eje vertical $Y$.',
      selector:
        '<b>Selector de Velocidades (Filtro de Wien):</b> Con campos cruzados $\\vec{E} \\perp \\vec{B}$ ajustados a $v_0 = E/B$, la fuerza eléctrica y la fuerza magnética tienen igual magnitud y sentidos opuestos ($\\vec{F}_{\\text{neta}} = \\vec{0}$), logrando que la partícula viaje en línea recta.',
      espectrometro:
        '<b>Espectrómetro de Masas:</b> Iones con igual rapidez entran al mismo campo $\\vec{B}$. Como el radio de giro es proporcional a $m/|q|$, la partícula $\\alpha$ (órbita roja) se curva con el doble de radio que el protón (órbita azul).',
      deriva:
        '<b>Deriva $\\vec{E}\\times\\vec{B}$:</b> Al combinarse $\\vec{E}$ y $\\vec{B}$ con $v_0 \\neq E/B$, la partícula acelera y frena en cada ciclo cambiando su radio de curvatura y describiendo una cicloide que deriva lateralmente.',
      libre:
        '<b>Configuración Personalizada:</b> Movimiento tridimensional de una carga puntual gobernado por la fuerza electromagnética de Lorentz.'
    };

    const [q, m] = P[S.part];
    const v0 = S.v * 1e6;
    const thRad = (S.th * Math.PI) / 180;
    const vp = v0 * Math.sin(thRad);
    const vl = v0 * Math.cos(thRad);
    const B = S.B * 1e-3;
    const E = S.E * 1e3;
    const FB = Math.abs(q) * vp * B;
    const FE = Math.abs(q) * E;
    const r = (m * vp) / (Math.abs(q) * B);
    const T = (2 * Math.PI * m) / (Math.abs(q) * B);
    const f = 1 / T;
    const pitch = vl * T;
    const vd = E / B;
    const EkeV = (0.5 * m * v0 * v0) / E_;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>${presetDesc[S.preset] || presetDesc.libre}</p>
        <p>En este instante se simula ${pNames[S.part]} con rapidez inicial $v_0 = ${fmTex(v0)}\\text{ m/s}$ y ángulo $\\theta = ${S.th}^\\circ$ dentro de un campo magnético vertical $\\vec{B} = ${fmTex(B)}\\text{ T}\\,\\hat{j}$${E > 0 ? ` y un campo eléctrico transversal $E = ${fmTex(E)}\\text{ V/m}$` : ''}.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Esfera y estela naranja:</b> La esfera (${q > 0 ? 'roja por tener carga positiva $q > 0$' : 'azul por tener carga negativa $q < 0$'}) traza la trayectoria integrada paso a paso mediante el algoritmo simpléctico de Boris.</li>
          <li><b>Triedro de la Regla de la Mano Derecha:</b> Sobre la partícula se dibujan la velocidad instantánea $\\vec{v}$ (<b>flecha azul</b>, dedo índice), el campo magnético $\\vec{B}$ (<b>flecha verde</b>, dedo medio) y el producto cruz $\\vec{v}\\times\\vec{B}$ (<b>flecha amarilla</b>, pulgar).</li>
          <li><b>Dirección de la fuerza $\\vec{F}$ (flecha roja):</b> ${q > 0 ? 'Al ser una carga positiva, la fuerza magnética apunta en el <b>mismo sentido que el pulgar amarillo</b> ($\\vec{v}\\times\\vec{B}$), empujando siempre hacia el centro de curvatura.' : 'Al ser un electrón ($q < 0$), la fuerza magnética (flecha roja) apunta en <b>sentido opuesto al pulgar amarillo</b> ($\\vec{v}\\times\\vec{B}$), invirtiendo el sentido de giro respecto a un protón.'}</li>
          ${E > 0 ? `<li><b>Fuerza eléctrica $\\vec{F}_E$ (flecha magenta):</b> Empuja paralelamente al eje $Z$ compitiendo contra la fuerza magnética.</li>` : ''}
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático y resultados en vivo</h3>
        <p><b>A · Componentes de velocidad y Fuerza Magnética:</b></p>
        $$v_\\perp = v_0\\sin(${S.th}^\\circ) = ${fmTex(vp)}\\text{ m/s}$$
        $$v_\\parallel = v_0\\cos(${S.th}^\\circ) = ${fmTex(vl)}\\text{ m/s}$$
        $$|\\vec{F}_B| = |q|\\,v_\\perp\\,B = ${fmTex(FB)}\\text{ N}$$

        <p><b>B · Radio de curvatura ($r$) y Periodo de ciclotrón ($T$):</b></p>
        $$r = \\frac{m\\,v_\\perp}{|q|\\,B} = ${fmTex(r)}\\text{ m}$$
        $$T = \\frac{2\\pi\\,m}{|q|\\,B} = ${fmTex(T)}\\text{ s}, \\qquad f = \\frac{1}{T} = ${fmTex(f)}\\text{ Hz}$$
        $$p = v_\\parallel\\,T = ${fmTex(pitch)}\\text{ m}$$

        ${
          E > 0
            ? `<p><b>C · Balance eléctrico-magnético y velocidad de deriva:</b></p>
               $$|\\vec{F}_E| = |q|\\,E = ${fmTex(FE)}\\text{ N}, \\qquad v_d = \\frac{E}{B} = ${fmTex(vd)}\\text{ m/s}$$
               <p>${Math.abs(v0 - vd) / (vd || 1) < 0.03 ? 'Como $v_0 = v_d$, se cumple $|\\vec{F}_E| = |\\vec{F}_B|$ y la partícula avanza en línea recta.' : `Como $v_0 \\neq v_d$, la resultante curva la trayectoria mientras deriva a razón de $${fmTex(vd)}\\text{ m/s}$.`}</p>`
            : `<p><b>C · Energía cinética constante:</b> Como $\\vec{F}_B \\perp \\vec{v}$, el campo magnético no realiza trabajo mecánico y la energía se conserva en $E_k = ${fmTex(EkeV)}\\text{ eV}$.</p>`
        }
      </div>
    `;
  }

  function buildModB(S) {
    const geoNames = {
      hilo: 'un <b>conductor rectilíneo muy largo</b> ubicado sobre el eje vertical $Y$',
      espira: `una <b>espira circular</b> de radio $R = ${S.R}\\text{ cm}$ situada en el plano horizontal $XZ$`,
      helmholtz: `un par de <b>bobinas de Helmholtz</b> de radio $R = ${S.R}\\text{ cm}$ separadas una distancia igual a su radio ($y = \\pm R/2$)`,
      solenoide: `un <b>solenoide helicoidal</b> de radio $R = ${S.R}\\text{ cm}$, longitud $L = ${S.L}\\text{ cm}$ y $N = ${S.N}$ vueltas`,
      elemento_dl: 'un <b>elemento diferencial de corriente $I\\,\\Delta\\vec{l}$</b> ($\Delta l = 1\\text{ cm}$) en el origen',
      carga_mov: 'una <b>carga puntual $q$ en movimiento</b> con velocidad $\\vec{v}$ a lo largo del eje $+Y$'
    };

    const xm = S.px * 1e-2;
    const ym = S.py * 1e-2;
    const rm = Math.hypot(xm, ym);
    const Rm = S.R * 1e-2;
    const Lm = S.L * 1e-2;

    let formulaBlock = '';
    if (S.geo === 'hilo') {
      const Bana = Math.abs(xm) > 0.003 ? (MU0 * S.I) / (2 * Math.PI * Math.abs(xm)) : null;
      formulaBlock = `
        <p><b>Campo magnético de un hilo recto a distancia $d = |x| = ${fmTex(Math.abs(xm))}\\text{ m}$:</b></p>
        $$B = \\frac{\\mu_0\\,I}{2\\pi\\,d} = ${Bana ? `${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{Sobre el conductor }(d = 0)'}$$
      `;
    } else if (S.geo === 'espira') {
      const Bana = Math.abs(S.px) < 0.05 ? (MU0 * S.I * Rm * Rm) / (2 * Math.pow(Rm * Rm + ym * ym, 1.5)) : null;
      formulaBlock = `
        <p><b>Campo en el eje de simetría de la espira ($x = 0, y = ${fmTex(ym)}\\text{ m}$):</b></p>
        $$B_y(y) = \\frac{\\mu_0\\,I\\,R^2}{2\\,(R^2 + y^2)^{3/2}} = ${Bana != null ? `${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{Coloca }x = 0\\text{ cm para evaluar en el eje}'}$$
      `;
    } else if (S.geo === 'helmholtz') {
      const lp = (yy) => (MU0 * S.I * Rm * Rm) / (2 * Math.pow(Rm * Rm + yy * yy, 1.5));
      const Bana = Math.abs(S.px) < 0.05 ? lp(ym - Rm / 2) + lp(ym + Rm / 2) : null;
      formulaBlock = `
        <p><b>Superposición de las dos bobinas en el eje ($x = 0$):</b></p>
        $$B_y(y) = B_{\\text{espira}}(y - R/2) + B_{\\text{espira}}(y + R/2)$$
        $$B_y = ${Bana != null ? `${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{Coloca }x = 0\\text{ cm para evaluar en el eje}'}$$
      `;
    } else if (S.geo === 'solenoide') {
      const Bana = (MU0 * S.N * S.I) / Lm;
      formulaBlock = `
        <p><b>Campo interior del solenoide ($n = N/L = ${fmTex(S.N / Lm)}\\text{ m}^{-1}$):</b></p>
        $$B_{\\text{int}} \\approx \\mu_0\\,\\frac{N}{L}\\,I = ${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}$$
      `;
    } else {
      const sinTh = rm > 1e-4 ? Math.abs(xm) / rm : 0;
      const Bana = rm > 0.005 ? ((MU0 / (4 * Math.PI)) * (S.I * 0.01 * sinTh)) / (rm * rm) : null;
      formulaBlock = `
        <p><b>Ley de Biot-Savart puntual a distancia $r = ${fmTex(rm)}\\text{ m}$ ($\\sin\\theta = ${sinTh.toFixed(3)}$):</b></p>
        $$|\\vec{B}| = \\frac{\\mu_0}{4\\pi}\\,\\frac{${S.geo === 'carga_mov' ? '|q\\,\\vec{v}\\times\\hat{r}|' : '|I\\,\\Delta\\vec{l}\\times\\hat{r}|'}}{r^2} = ${Bana != null ? `${fmTex(Bana * 1e6)}\\text{ }\\mu\\text{T}` : '\\text{En el origen }(r = 0)'}$$
      `;
    }

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se estudia el campo magnético $\\vec{B}$ producido por ${geoNames[S.geo]} con corriente $I = ${S.I}\\text{ A}$, evaluando la lectura exacta en el punto de la sonda $(x, y, z) = (${S.px}\\text{ cm},\\, ${S.py}\\text{ cm},\\, 0)$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Conductor naranja y flecha de corriente:</b> Representa el camino físico de la corriente $I$, dividido internamente en elementos diferenciales $\\Delta\\vec{l}_k$.</li>
          <li><b>Mapa vectorial en el plano $z = 0$:</b> La rejilla de flechas muestra la dirección local de $\\vec{B}$ y su intensidad mediante un código de color térmico (<b>rojo/naranja</b> donde el campo es más intenso cerca del conductor, <b>azul</b> donde decae con la distancia).</li>
          <li><b>Líneas de campo verdes:</b> Curvas cerradas tangentes a los vectores $\\vec{B}$ en todo punto, obedeciendo la regla de la mano derecha alrededor de la corriente.</li>
          <li><b>Sonda rosa (esfera y flecha magenta):</b> Indica el punto exacto donde el simulador compara la suma numérica de Biot-Savart contra la ecuación analítica teórica.</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático y resultados en vivo</h3>
        <p><b>Suma discreta de Biot-Savart ejecutada por el simulador:</b></p>
        $$\\vec{B}(\\vec{r}) = \\frac{\\mu_0\\,I}{4\\pi}\\sum_{k} \\frac{\\Delta\\vec{l}_k \\times (\\vec{r} - \\vec{r}_k)}{|\\vec{r} - \\vec{r}_k|^3}$$
        ${formulaBlock}
      </div>
    `;
  }

  function buildModC(S) {
    const dm = S.d * 1e-2;
    const dlm = S.dl * 1e-2;
    const B1 = (MU0 * S.I1) / (2 * Math.PI * dm);
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
          <li><b>Hilos y portadores en movimiento:</b> Las esferas luminosas que viajan por el hilo 1 (naranja) y el hilo 2 (azul claro) muestran visualmente el sentido y la rapidez del flujo de corriente en cada conductor.</li>
          <li><b>Anillos verdes de campo magnético:</b> Muestran cómo el campo $\\vec{B}_1$ rodea circularmente al hilo 1 hasta alcanzar al hilo 2 con dirección perpendicular ($-Z$, flecha verde sobre el segmento).</li>
          <li><b>Segmentos magenta ($\\Delta l$) y flechas rojas de fuerza:</b> En los tramos resaltados se aplica el producto cruz $d\\vec{F} = I\\,d\\vec{l}\\times\\vec{B}$. ${mismo ? 'Observa cómo ambas flechas rojas apuntan hacia el centro: <b>los conductores se atraen</b>.' : 'Observa cómo ambas flechas rojas apuntan hacia afuera: <b>los conductores se repelen</b>.'}</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático y resultados en vivo</h3>
        <p><b>A · Campo magnético $B_1$ que el hilo 1 produce sobre el hilo 2:</b></p>
        $$B_1 = \\frac{\\mu_0\\,I_1}{2\\pi\\,d} = ${fmTex(B1 * 1e6)}\\text{ }\\mu\\text{T}$$

        <p><b>B · Fuerza por unidad de longitud entre ambos conductores:</b></p>
        $$\\frac{F}{L} = \\frac{\\mu_0\\,I_1\\,I_2}{2\\pi\\,d} = ${fmTex(FperL * 1e6)}\\text{ }\\mu\\text{N/m}$$

        <p><b>C · Fuerza magnética sobre el segmento $\\Delta l = ${S.dl}\\text{ cm}$:</b></p>
        $$\\Delta F = \\left(\\frac{F}{L}\\right)\\Delta l = ${fmTex(dF * 1e6)}\\text{ }\\mu\\text{N}$$
        <p>Por la tercera ley de Newton ($\\vec{F}_{1\\to 2} = -\\vec{F}_{2\\to 1}$), ambos segmentos experimentan exactamente la misma magnitud de fuerza.</p>
      </div>
    `;
  }

  function buildModD(S) {
    const Lm = S.L * 1e-2;
    const A = S.shape === 'rect' ? Lm * Lm : Math.PI * (Lm / 2) * (Lm / 2);
    const B = S.B * 1e-3;
    const mu = S.N * S.I * A;
    const thRad = (S.th0 * Math.PI) / 180;
    const tau = mu * B * Math.abs(Math.sin(thRad));
    const U = -mu * B * Math.cos(thRad);
    const Farm = S.N * S.I * Lm * B;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Una <b>${S.shape === 'rect' ? `espira cuadrada de lado $L = ${S.L}\\text{ cm}$` : `espira circular de diámetro $L = ${S.L}\\text{ cm}$`}</b> con $N = ${S.N}$ vueltas y corriente $I = ${S.I}\\text{ A}$ se orienta a $\\theta = ${S.th0}^\\circ$ dentro de un campo magnético uniforme $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Vector momento magnético $\\vec{\\mu}$ (flecha magenta):</b> Es perpendicular al plano de la espira siguiendo la regla de la mano derecha (al curvar los dedos en el sentido de las flechas amarillas de corriente $I$, el pulgar apunta en $\\vec{\\mu}$).</li>
          <li><b>Par de fuerzas laterales $\\vec{F}_1$ y $\\vec{F}_2$ (flechas rojas):</b> Empujan los brazos verticales en sentidos opuestos ($+Z$ y $-Z$). Como tienen igual magnitud, la espira no se desplaza ($\\sum\\vec{F} = \\vec{0}$), pero forman una cupla que hace girar la espira.</li>
          <li><b>Vector torque $\\vec{\\tau} = \\vec{\\mu}\\times\\vec{B}$ (flecha azul en eje $Y$):</b> Indica el eje y sentido de rotación que lleva a $\\vec{\\mu}$ a alinearse con $\\vec{B}$ (verde) en el equilibrio estable ($\\theta = 0^\\circ$).</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático y resultados en vivo</h3>
        <p><b>A · Área de la espira y Momento Dipolar Magnético ($|\\vec{\\mu}|$):</b></p>
        $$A = ${fmTex(A)}\\text{ m}^2, \\qquad |\\vec{\\mu}| = N\\,I\\,A = ${fmTex(mu)}\\text{ A}\\cdot\\text{m}^2$$

        <p><b>B · Magnitud del Torque ($|\\vec{\\tau}|$) y Fuerzas en los brazos:</b></p>
        $$|\\vec{\\tau}| = \\mu\\,B\\,|\\sin\\theta| = ${fmTex(tau)}\\text{ N}\\cdot\\text{m}$$
        $$F_{\\text{brazo}} = N\\,I\\,L\\,B = ${fmTex(Farm)}\\text{ N}$$

        <p><b>C · Energía potencial magnética ($U$):</b></p>
        $$U = -\\vec{\\mu}\\cdot\\vec{B} = -\\mu\\,B\\,\\cos\\theta = ${fmTex(U)}\\text{ J}$$
      </div>
    `;
  }

  function buildModE(S) {
    const Lm = S.L * 1e-2;
    const A = S.shape === 'disco' ? Math.PI * (Lm / 2) * (Lm / 2) : Lm * Lm;
    const B = S.B * 1e-3;
    const thRad = (S.th * Math.PI) / 180;
    const cTh = Math.cos(thRad);
    const Aeff = A * cTh;
    const phi = B * A * cTh;

    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se calcula el flujo magnético $\\Phi_B$ a través de una <b>${S.shape === 'disco' ? `superficie circular de diámetro $L = ${S.L}\\text{ cm}$` : `superficie cuadrada de lado $L = ${S.L}\\text{ cm}$`}</b> cuyo vector normal $\\hat{n}$ forma un ángulo $\\theta = ${S.th}^\\circ$ con un campo uniforme $\\vec{B} = ${S.B}\\text{ mT}\\,\\hat{i}$.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Orientación y arco amarillo ($\\theta$):</b> Muestra el ángulo entre el campo $\\vec{B}$ (flecha verde central) y el vector normal $\\hat{n}$ de la superficie (flecha magenta).</li>
          <li><b>Líneas que atraviesan y puntos de impacto:</b> Las líneas de campo que logran cruzar la superficie se iluminan con esferas brillantes en los puntos de corte; las que pasan por fuera quedan tenues.</li>
          <li><b>Sombra proyectada al fondo ($x = -10$):</b> Representa geométricamente el <b>área efectiva $A_\\perp = A\\cos\\theta$</b> que intercepta las líneas de campo.</li>
          <li><b>Color de la superficie:</b> Cambia a <b>verde</b> cuando el flujo es positivo ($|\\theta| < 90^\\circ$), <b>gris</b> cuando es nulo ($\\theta = \\pm 90^\\circ$, de canto) y <b>rojo coral</b> cuando es negativo ($|\\theta| > 90^\\circ$).</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático y resultados en vivo</h3>
        <p><b>A · Área total y área proyectada perpendicular al campo:</b></p>
        $$A = ${fmTex(A)}\\text{ m}^2 \\;(${fmTex(A * 1e4)}\\text{ cm}^2)$$
        $$A_\\perp = A\\,\\cos(${S.th}^\\circ) = ${fmTex(Aeff * 1e4)}\\text{ cm}^2$$

        <p><b>B · Flujo magnético total $\\Phi_B$:</b></p>
        $$\\Phi_B = \\int_S \\vec{B}\\cdot d\\vec{A} = B\\,A\\,\\cos\\theta = ${fmTex(phi * 1e6)}\\text{ }\\mu\\text{Wb}$$
      </div>
    `;
  }

  function buildModF(S) {
    return `
      <div class="exp-sec">
        <h3>1. Planteamiento del problema actual</h3>
        <p>Se verifica la <b>Ley de Gauss del magnetismo</b> utilizando una <b>${S.surf === 'esfera' ? `esfera cerrada de radio $R_g = ${S.Rg}\\text{ cm}$` : `caja cerrada de lado $2R_g = ${2 * S.Rg}\\text{ cm}$`}</b> ubicada en $(x_g, y_g, 0) = (${S.gx}\\text{ cm},\\, ${S.gy}\\text{ cm},\\, 0)$ alrededor de <b>${S.source === 'dipolo' ? 'un imán de barra (dipolo N–S)' : 'una espira circular de corriente'}</b>.</p>
      </div>

      <div class="exp-sec">
        <h3>2. Explicación visual de lo que ocurre en la escena 3D</h3>
        <ul>
          <li><b>Lazos cerrados de campo magnético (líneas verdes):</b> Observa que las líneas de $\\vec{B}$ no nacen ni mueren en ningún punto; salen por el Polo Norte (rojo), rodean por el exterior hacia el Polo Sur (azul) y <b>continúan cerradas por dentro del imán de Sur a Norte</b>.</li>
          <li><b>Superficie gaussiana translúcida (azul):</b> Puedes desplazarla con $(x_g, y_g)$ para encerrar un solo polo del imán, ambos polos o una región exterior.</li>
          <li><b>Flechas verdes ($\\Phi_{\\text{saliente}}$) vs. flechas rojas ($\\Phi_{\\text{entrante}}$):</b> En la frontera de la superficie cerrada, las flechas verdes indican donde el campo sale ($\\vec{B}\\cdot\\hat{n} > 0$) y las rojas donde el campo entra ($\\vec{B}\\cdot\\hat{n} < 0$).</li>
        </ul>
      </div>

      <div class="exp-sec">
        <h3>3. Desarrollo matemático y resultados en vivo</h3>
        <p><b>A · Balance exacto entre flujo saliente y flujo entrante:</b></p>
        $$\\oint_S \\vec{B}\\cdot d\\vec{A} = \\Phi_{\\text{saliente}} + \\Phi_{\\text{entrante}} = 0\\text{ Wb}$$
        $$\\Phi_{\\text{saliente}} = |\\Phi_{\\text{entrante}}|$$

        <p><b>B · Ecuación de Maxwell ($\\nabla\\cdot\\vec{B} = 0$):</b></p>
        $$\\oint_S \\vec{B}\\cdot d\\vec{A} = \\iiint_V (\\nabla\\cdot\\vec{B})\\,dV = 0 \\iff \\nabla\\cdot\\vec{B} = 0$$
        <p>Como toda línea que entra a cualquier volumen cerrado debe salir de él, el flujo magnético neto a través de cualquier superficie cerrada es siempre cero, confirmando la ausencia de monopolos magnéticos.</p>
      </div>
    `;
  }

  let lastSig = '';

  function update(mod) {
    const bodyEl = $('explain-body');
    const titleEl = $('explain-mod-title');
    if (!bodyEl || !mod) return;

    const S = mod.state || {};
    const sig = mod.id + ':' + JSON.stringify(S);
    if (sig === lastSig) return;
    lastSig = sig;

    if (titleEl) {
      titleEl.textContent = mod.title;
    }
    let html = '';
    if (mod.id === 'A') html = buildModA(S);
    else if (mod.id === 'B') html = buildModB(S);
    else if (mod.id === 'C') html = buildModC(S);
    else if (mod.id === 'D') html = buildModD(S);
    else if (mod.id === 'E') html = buildModE(S);
    else if (mod.id === 'F') html = buildModF(S);

    bodyEl.innerHTML = html;
    if (Sim.ui && Sim.ui.renderMath) {
      Sim.ui.renderMath(bodyEl);
    }
  }

  Sim.explainer = { update };
})();
